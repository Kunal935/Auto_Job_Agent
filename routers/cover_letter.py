# routers/cover_letter.py
"""
Router: Cover Letter Generation
Author: Kunal
Description:
    - Accepts resume file (PDF/DOCX) + job description + company name
    - Calls core.cover_letter_gen.generate_cover_letter()
    - Returns JSON with generated cover letter and recommendation
    - Unicode-safe and temp file cleanup
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi import status
from typing import Dict, Literal
import os
import shutil
import logging
from app.core.cover_letter_gen import generate_cover_letter

# -----------------------------
# Setup
# -----------------------------
router = APIRouter(
    prefix="/cover_letter",
    tags=["Cover Letter"]
)

# Temporary upload directory
UPLOAD_DIR = ".temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# -----------------------------
# Endpoint: /generate
# -----------------------------
@router.post("/generate")
async def generate_cover(
    resume_file: UploadFile = File(..., description="Upload PDF or DOCX resume"),
    job_description: str = Form(..., description="Target job description or skills"),
    target_job: str = Form(default="Software Engineer", description="Selected job title"),
    tone: str = Form(default="professional", description="Tone of the letter"),
    word_limit: int = Form(default=300, description="Max word count limit"),
    experience_level: str = Form(default="intermediate", description="Applicant experience level"),
    is_premium: bool = Form(default=False, description="User's premium status")
):
    """
    Generate a production-ready AI cover letter.
    Validates level/word limits against premium status.
    """
    
    # 1️⃣ Validation Logic
    if experience_level == "professional" and not is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The 'Professional' experience level is a Premium-only feature."
        )
    
    if word_limit > 600 and not is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Generating letters longer than 600 words requires a Premium subscription."
        )

    # 2️⃣ Save uploaded file temporarily
    file_path = os.path.join(UPLOAD_DIR, resume_file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(resume_file.file, buffer)
    except Exception as e:
        return JSONResponse(
            content={"error": f"Failed to save resume: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # 3️⃣ Generate cover letter
    try:
        result = generate_cover_letter(
            file_path, 
            job_description, 
            company_name="the company", 
            tone=tone,
            experience_level=experience_level,
            word_limit=word_limit
        )

        if "error" in result:
             return JSONResponse(content=result, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Inject original job title
        result["job_role"] = target_job
        
        logging.info(f"Cover letter generated for: {resume_file.filename} ({target_job})")
        return result

    except Exception as e:
        return JSONResponse(
            content={"error": f"Internal Server Error: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    finally:
        # Cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
