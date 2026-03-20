# routers/match.py
"""
Router: Job-Resume Matching
Author: Kunal
Description:
    - Match resume skills against job skills
    - Return matching score and details
"""

from fastapi import APIRouter, Depends, Form, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db import crud
from app.core.job_matching import calculate_skill_match

router = APIRouter(
    prefix="/match",
    tags=["Match"]
)

@router.post("/resume-job")
def match_resume_job(
    resume_id: int = Form(...),
    job_id: int = Form(...),
    db: Session = Depends(get_db)
):
    """
    Match a resume against a job by IDs and return score
    """
    resume = crud.get_resume_by_id(db, resume_id)
    job = crud.get_job_by_id(db, job_id)

    if not resume:
        return JSONResponse({"error": "Resume not found"}, status_code=status.HTTP_404_NOT_FOUND)
    if not job:
        return JSONResponse({"error": "Job not found"}, status_code=status.HTTP_404_NOT_FOUND)

    # Skills from DB
    resume_skills = [s.strip() for s in resume.skills.split(",") if s.strip()]
    job_skills = [s.strip() for s in job.description.split(",") if s.strip()]

    from core.job_matching import calculate_skill_match
    match_report = calculate_skill_match(resume_skills, job_skills)

    return {"resume_id": resume_id, "job_id": job_id, "match": match_report}


@router.post("/detailed-insight")
def get_detailed_insight(
    resume_id: int = Form(...),
    job_description: str = Form(...),
    db: Session = Depends(get_db)
):
    """
    Get detailed AI analysis for a specific job description
    """
    resume = crud.get_resume_by_id(db, resume_id)
    if not resume:
        return JSONResponse({"error": "Resume not found"}, status_code=status.HTTP_404_NOT_FOUND)

    from app.core.job_matching import generate_detailed_match_report
    insight = generate_detailed_match_report(resume.raw_text, job_description)

    return insight
