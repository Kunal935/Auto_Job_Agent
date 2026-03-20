# routers/jobs.py
"""
Router: Job CRUD / Listing + Aggregated Job Fetching
Author: Kunal
"""

from fastapi import APIRouter, status, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import Optional, List
from db.database import get_db
from db import crud, models
from db.models import Job, Resume, User
from routers.auth import get_current_user

# ⬇ Only real functions available in core.job_fetcher
from core.job_fetcher import (
    fetch_all_jobs,
    fetch_arbeitnow,
    fetch_remoteok,
    fetch_remotive,
    fetch_hackernews,
    fetch_internshala,
    filter_jobs_by_skills,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


# -----------------------------
# Add a new job (DB)
# -----------------------------
@router.post("/add")
def add_job(job: dict, db: Session = Depends(get_db)):
    try:
        db_job = crud.create_job(db, job)
        return {"message": "Job added", "job_id": db_job.id}
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------------
# List all jobs in DB
# -----------------------------
@router.get("/all")
def list_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).all()
    result = [
        {
            "id": j.id,
            "title": j.title,
            "company": j.company,
            "description": j.description,
            "url": j.url,
        } for j in jobs
    ]
    return {"jobs": result}


# -----------------------------
# Fetch recent jobs from Aggregator
# -----------------------------
@router.get("/recent")
def recent_jobs(
    skills: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default="all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch recent jobs tailored to the current user's resume.
    """
    jobs: List[dict] = []

    if source == "remotive":
        jobs += fetch_remotive()
    elif source == "remoteok":
        jobs += fetch_remoteok()
    elif source == "arbeitnow":
        jobs += fetch_arbeitnow()
    elif source == "hn" or source == "hackernews":
        jobs += fetch_hackernews()
    elif source == "internshala":
        jobs += fetch_internshala()
    else:
        jobs += fetch_all_jobs(skill=skills)

    # 🔍 Tailor matches to the CURRENT user's latest resume
    last_resume = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.id.desc()).first()
    
    user_skills = []
    if last_resume and last_resume.skills:
        user_skills = [s.strip() for s in last_resume.skills.split(",") if s.strip()]

    from app.core.job_matching import calculate_skill_match
    
    for job in jobs:
        required = job.get("skills_required", [])
        if not required and job.get("description"):
            required = [s.strip() for s in job["description"].split(",") if len(s.strip()) < 20]
        
        report = calculate_skill_match(user_skills, required)
        job["match"] = report.get("total_score_percent", 0)
        job["tags"] = required if required else report.get("core_matched", [])[:3]
        
        if not job.get("ai_insight"):
            matched_count = len(report.get("core_matched", []))
            job["ai_insight"] = f"Strong match with {matched_count} of your core skills: {', '.join(report.get('core_matched', [])[:3])}."

    if skills:
        skills_list = [s.strip().lower() for s in skills.split(",") if s.strip()]
        jobs = filter_jobs_by_skills(jobs, skills_list)

    return {"count": len(jobs), "source": source, "jobs": jobs[:12]}


# -----------------------------
# Get job by ID (DB)
# -----------------------------
@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        return JSONResponse(content={"error": "Job not found"}, status_code=status.HTTP_404_NOT_FOUND)

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "url": job.url,
    }
