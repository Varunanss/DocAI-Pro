from fastapi import FastAPI, File, UploadFile, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import os
from datetime import datetime
import json

from .database import get_db, engine, SessionLocal
from . import models, schemas
from .utils import jwt_handler
from .services import pdf_parser, resume_parser, gemini_service

# Reset & Create Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="DocProcessor AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ==========================
# 🔐 AUTH
# ==========================
# 👇 FIXED: Changed URL from "/api/" to "/api/auth/register"
# 👇 REPLACE THE OLD REGISTER FUNCTION WITH THIS
@app.post("/api/auth/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if email already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        # This triggers the "Account Already Exists" toast on Frontend
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Hash Password & Create User
    hashed_password = jwt_handler.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 3. 🔥 AUTO-LOGIN: Generate Token Immediately
    # This allows the frontend to log them in right after signing up
    access_token = jwt_handler.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not jwt_handler.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(401, "Invalid credentials")
    return {"access_token": jwt_handler.create_access_token({"sub": db_user.email}), "token_type": "bearer"}

# ==========================
# 🔄 BACKGROUND PROCESSOR
# ==========================
async def process_document_background(analysis_id: int, file_path: str):
    db = SessionLocal()
    try:
        analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
        
        # STAGE 1
        analysis.status = "stage_1_identifying"
        db.commit()
        
        text = pdf_parser.extract_text_from_pdf(file_path)
        page_count = pdf_parser.get_page_count(file_path)
        try: genre = gemini_service.detect_genre_python(text) 
        except: genre = "general_document"

        if genre == "resume": extracted_json = resume_parser.extract_resume_data(text)
        else: extracted_json = pdf_parser.extract_generic_data(text)
            
        analysis.extracted_data = extracted_json
        analysis.document_type = genre
        analysis.page_count = page_count
        db.commit()

        # STAGE 2
        analysis.status = "stage_2_summarizing"
        db.commit()
        
        final_summary, final_json, score = await gemini_service.generate_smart_analysis(file_path, genre, text)
        
        # FINAL SUCCESS
        analysis.status = "stage_3_finalizing"
        db.commit()
        
        if len(final_json) > 10: analysis.extracted_data = final_json
        analysis.ai_summary = final_summary
        analysis.confidence_score = score
        analysis.status = "success"
        analysis.processed_at = datetime.utcnow()
        db.commit()
        print(f"✅ Analysis Complete for ID {analysis_id}")

    except Exception as e:
        print(f"❌ Failed: {e}")
        analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
        analysis.status = "failed"
        analysis.error_message = str(e)
        db.commit()
    finally:
        db.close()

# ==========================
# 📂 UPLOAD
# ==========================
@app.post("/api/upload", response_model=schemas.UploadResponse)
async def upload_file(
    bg_tasks: BackgroundTasks,
    file: UploadFile = File(...), 
    user: models.User = Depends(jwt_handler.get_current_user),
    db: Session = Depends(get_db)
):
    path = os.path.join(UPLOAD_DIR, f"{datetime.now().timestamp()}_{file.filename}")
    with open(path, "wb") as f: f.write(await file.read())
        
    new_doc = models.Document(filename=file.filename, file_path=path, user_id=user.id, file_size=0)
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    
    new_analysis = models.Analysis(document_id=new_doc.id, status="pending")
    db.add(new_analysis)
    db.commit()
    db.refresh(new_analysis)
    
    bg_tasks.add_task(process_document_background, new_analysis.id, path)
    
    return {"processing_id": new_analysis.id, "message": "Upload successful"}

# ==========================
# 📊 RESULTS & HISTORY
# ==========================
@app.get("/api/processing/{analysis_id}", response_model=schemas.ProcessingResult)
def get_results(analysis_id: int, db: Session = Depends(get_db), u=Depends(jwt_handler.get_current_user)):
    analysis = db.query(models.Analysis).filter(models.Analysis.id == analysis_id).first()
    if not analysis: raise HTTPException(404, "Not found")
    
    doc = db.query(models.Document).filter(models.Document.id == analysis.document_id).first()
    
    try: fields = json.loads(analysis.extracted_data)
    except: fields = []

    return {
        "id": analysis.id,
        "documentTitle": doc.filename,
        "pages": analysis.page_count or 0,
        "processedAt": analysis.processed_at.strftime("%Y-%m-%d %H:%M") if analysis.processed_at else "",
        "extractedFields": fields,
        "summary": analysis.ai_summary or "",
        "confidence": analysis.confidence_score or 0,
        "status": analysis.status,
        "documentType": analysis.document_type or "unknown",
        "errorMessage": analysis.error_message
    }

@app.get("/api/history", response_model=list[schemas.ProcessingResult])
def get_history(db: Session = Depends(get_db), user=Depends(jwt_handler.get_current_user)):
    history = (
        db.query(models.Analysis)
        .join(models.Document)
        .filter(models.Document.user_id == user.id)
        .order_by(models.Analysis.processed_at.desc())
        .all()
    )
    
    results = []
    for ana in history:
        doc = db.query(models.Document).filter(models.Document.id == ana.document_id).first()
        try: fields = json.loads(ana.extracted_data)
        except: fields = []
        
        results.append({
            "id": ana.id,
            "documentTitle": doc.filename,
            "pages": ana.page_count or 0,
            "processedAt": ana.processed_at.strftime("%Y-%m-%d %H:%M") if ana.processed_at else "Pending",
            "extractedFields": fields,
            "summary": ana.ai_summary or "",
            "confidence": ana.confidence_score or 0,
            "status": ana.status,
            "documentType": ana.document_type or "doc",
            "errorMessage": ana.error_message
        })
    return results

@app.delete("/api/history/{id}")
def delete_item(id: int, db: Session = Depends(get_db), u=Depends(jwt_handler.get_current_user)):
    ana = db.query(models.Analysis).filter(models.Analysis.id == id).first()
    if ana:
        doc = db.query(models.Document).filter(models.Document.id == ana.document_id).first()
        if doc: db.delete(doc)
        db.delete(ana)
        db.commit()
    return {"status": "ok"}

@app.get("/api/reports/{id}/download")
async def download(id: int, db: Session = Depends(get_db)):
    ana = db.query(models.Analysis).filter(models.Analysis.id == id).first()
    path = await gemini_service.generate_pdf_report(ana.ai_summary, ana.extracted_data, ana.document_type)
    return FileResponse(path, media_type="application/pdf", filename="report.pdf")
