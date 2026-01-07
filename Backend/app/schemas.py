from pydantic import BaseModel
from typing import List, Optional

class Token(BaseModel):
    access_token: str
    token_type: str

class UserCreate(BaseModel):
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UploadResponse(BaseModel):
    processing_id: int
    message: str

class ExtractedField(BaseModel):
    label: str
    value: str | int | float | list | None

class ProcessingResult(BaseModel):
    id: Optional[int] = None  # <--- NEW FIELD FOR DASHBOARD
    documentTitle: str
    pages: int
    processedAt: str
    extractedFields: List[dict]
    summary: str
    confidence: float
    status: str
    documentType: str
    errorMessage: Optional[str] = None

class ActivityLog(BaseModel):
    action: str
    details: str

class ErrorLog(BaseModel):
    error: str
    file_name: Optional[str] = None
    timestamp: str
    context: str