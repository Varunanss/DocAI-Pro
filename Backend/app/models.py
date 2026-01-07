from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

# ==========================
# 👤 TABLE 1: USERS (The Account)
# ==========================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    
    # Relationship: One User has Many Documents
    documents = relationship("Document", back_populates="owner")

# ==========================
# 📄 TABLE 2: DOCUMENTS (The Uploads)
# ==========================
class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    file_size = Column(Integer)
    upload_date = Column(DateTime, default=datetime.utcnow)
    
    # Link to User
    user_id = Column(Integer, ForeignKey("users.id"))
    owner = relationship("User", back_populates="documents")
    
    # Relationship: One Document has One Analysis Result
    analysis = relationship("Analysis", back_populates="document", uselist=False)

# ==========================
# 🧠 TABLE 3: ANALYSIS (The AI Data)
# ==========================
class Analysis(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    
    # Link to Document
    document_id = Column(Integer, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="analysis")

    # Status Tracking
    status = Column(String, default="pending")  # pending, processing, success, failed
    
    # AI Outputs
    document_type = Column(String)              # resume, invoice, etc.
    page_count = Column(Integer)
    ai_summary = Column(Text)                   # The big text summary
    extracted_data = Column(Text)               # JSON string of entities
    confidence_score = Column(Float)            # 98.5%
    
    # Error Handling
    error_message = Column(String, nullable=True)
    processed_at = Column(DateTime, nullable=True)