
"""
Router: Resume Upload & Extraction
Author: Kunal
Description:
    - Upload resumes (PDF/DOCX)
    - Extract structured data using LLM
    - Store in DB
"""

from fastapi import APIRouter, UploadFile, File, status, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import os
import shutil
import logging
from app.core.resume_parser import extract_resume_llm, read_file
from app.db.database import get_db
from app.db import crud

from app.routers.auth import get_current_user
from app.db.models import User

router = APIRouter(
    prefix="/resume",
    tags=["Resume"]
)

# Temp upload folder
UPLOAD_DIR = ".temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

logging.basicConfig(level=logging.INFO)

@router.post("/upload")
async def upload_resume(
    resume_file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a resume file (PDF/DOCX), extract structured data, and save in DB.
    STRICT RULE: Only one parse allowed per user.
    """
    # 1. Check if user already parsed a resume
    if current_user.resume_parsed:
        return JSONResponse(
            content={"error": "❌ You have already used your free resume parsing. Please upgrade your plan to continue."},
            status_code=status.HTTP_403_FORBIDDEN
        )

    file_path = os.path.join(UPLOAD_DIR, resume_file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(resume_file.file, buffer)
        logging.info(f"Resume uploaded: {file_path}")
    except Exception as e:
        logging.error(f"Failed to save resume: {e}")
        return JSONResponse(
            content={"error": f"Failed to save resume: {e}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # Read file content
    raw_text = read_file(file_path)
    if not raw_text:
        return JSONResponse(
            content={"error": "Failed to read resume content. Check file format."},
            status_code=status.HTTP_400_BAD_REQUEST
        )

    # Extract structured data
    data = extract_resume_llm(raw_text)

    # Save in DB
    try:
        db_resume = crud.create_resume(db, {
            "name": data.get("name", ""),
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "skills": ",".join(data.get("skills", [])) if isinstance(data.get("skills"), list) else str(data.get("skills", "")),
            "raw_text": raw_text
        }, user_id=current_user.id)
        
        # 2. Mark user as having parsed their resume
        crud.update_user_resume_parsed(db, current_user.id)
        
        logging.info(f"Resume saved in DB: ID {db_resume.id} for user {current_user.id}")
    except Exception as e:
        logging.error(f"DB error: {e}")
        return JSONResponse(
            content={"error": f"DB error: {e}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    finally:
        # Cleanup
        try:
            os.remove(file_path)
        except:
            pass

    return {"message": "Resume uploaded and parsed successfully", "resume_id": db_resume.id, "data": data}
