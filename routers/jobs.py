# routers/jobs.py
"""
Router: Job CRUD / Listing + Aggregated Job Fetching
Author: Kunal
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from db import crud
from db.database import get_db
from db.models import Job, Resume, User
from routers.auth import get_current_user

from core.job_fetcher import (
    fetch_all_jobs,
    fetch_arbeitnow,
    fetch_foundit,
    fetch_hackernews,
    fetch_indeed_india,
    fetch_internshala,
    fetch_linkedin,
    fetch_naukri,
    fetch_remoteok,
    fetch_remotive,
    filter_jobs_by_skills,
)

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.post("/add")
def add_job(job: dict, db: Session = Depends(get_db)):
    try:
        db_job = crud.create_job(db, job)
        return {"message": "Job added", "job_id": db_job.id}
    except Exception as e:
        return JSONResponse(
            content={"error": str(e)},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


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
        }
        for j in jobs
    ]
    return {"jobs": result}


def _split_csv(value: Optional[str]) -> List[str]:
    if not value:
        return []
    return [item.strip() for item in str(value).split(",") if item.strip()]


def _get_latest_resume_skills(db: Session, current_user: Optional[User]) -> List[str]:
    """Return latest resume skills. Works even when auth/admin user is missing."""
    user_id = getattr(current_user, "id", None) or 1

    resume = (
        db.query(Resume)
        .filter(Resume.user_id == user_id)
        .order_by(Resume.id.desc())
        .first()
    )

    # If hardcoded user id has no resume, use latest resume from table.
    if not resume:
        resume = db.query(Resume).order_by(Resume.id.desc()).first()

    if resume and resume.skills:
        return _split_csv(resume.skills)
    return []


def _calculate_skill_match(resume_skills: List[str], job_skills: List[str]):
    """Use project matcher if available, otherwise fallback safely."""
    try:
        from core.job_matching import calculate_skill_match

        return calculate_skill_match(resume_skills, job_skills)
    except Exception:
        resume_set = {str(s).strip().lower() for s in resume_skills if s}
        job_set = {str(s).strip().lower() for s in job_skills if s}

        if not job_set:
            return {
                "core_matched": [],
                "missing_core": [],
                "total_score_percent": 0,
            }

        matched = resume_set.intersection(job_set)
        missing = job_set - resume_set
        score = round((len(matched) / len(job_set)) * 100, 2)

        return {
            "core_matched": sorted(list(matched)),
            "missing_core": sorted(list(missing)),
            "total_score_percent": score,
        }


def _infer_required_skills(job: dict) -> List[str]:
    required = job.get("skills_required") or job.get("tags") or []
    if isinstance(required, str):
        required = _split_csv(required)
    if not isinstance(required, list):
        required = []

    # If missing, infer from description/title using project fetcher helper.
    if not required:
        try:
            from core.job_fetcher import extract_skills_from_text

            required = extract_skills_from_text(
                f"{job.get('title','')} {job.get('description','')}"
            )
        except Exception:
            required = []

    return required[:8]


@router.get("/recent")
def recent_jobs(
    skills: Optional[str] = Query(default=None),
    source: Optional[str] = Query(default="all"),
    location: Optional[str] = Query(default="India"),
    limit: int = Query(default=24, ge=1, le=50),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Fetch recent jobs tailored to user's resume + search query.

    Query examples:
    - /jobs/recent
    - /jobs/recent?skills=python,fastapi&location=Delhi
    - /jobs/recent?source=naukri&skills=machine learning&location=Bangalore
    - /jobs/recent?source=linkedin&skills=react&location=Noida
    - /jobs/recent?source=nearby&location=Delhi
    """
    try:
        resume_skills = _get_latest_resume_skills(db, current_user)
        query_skills = _split_csv(skills)

        # If search box is empty, use resume skills for job discovery.
        final_skill_query = skills or ",".join(resume_skills[:5]) or "python developer"

        src = (source or "all").lower().strip()
        jobs: List[dict] = []

        source_map = {
            "remotive": fetch_remotive,
            "remoteok": fetch_remoteok,
            "arbeitnow": fetch_arbeitnow,
            "hn": fetch_hackernews,
            "hackernews": fetch_hackernews,
            "internshala": fetch_internshala,
            "linkedin": fetch_linkedin,
            "naukri": fetch_naukri,
            "indeed": fetch_indeed_india,
            "foundit": fetch_foundit,
        }

        if src in source_map:
            jobs = source_map[src](
                skill=final_skill_query,
                location=location or "India",
                limit=limit,
            )
        else:
            # all / nearby / india -> aggregate every supported source.
            jobs = fetch_all_jobs(
                skill=final_skill_query,
                location=location or "India",
                limit=limit,
            )

        # Apply skill filter only when user typed search query.
        # If no query, resume skills are already used for discovery.
        if query_skills:
            jobs = filter_jobs_by_skills(jobs, [s.lower() for s in query_skills])

        scoring_skills = query_skills or resume_skills

        for job in jobs:
            required = _infer_required_skills(job)
            report = _calculate_skill_match(scoring_skills, required)

            score = report.get("total_score_percent", 0)

            # Search cards should not look like 0% garbage if they match the query concept.
            if job.get("is_search_card") and score == 0:
                score = 65 if scoring_skills else 50

            job["match"] = score
            job["skills_required"] = required
            job["tags"] = (required or job.get("tags") or [])[:4]

            if not job.get("company") and job.get("company_name"):
                job["company"] = job.get("company_name")

            if not job.get("source") and job.get("site"):
                job["source"] = job.get("site")

            matched = report.get("core_matched", [])[:3]
            if matched:
                job["ai_insight"] = (
                    f"Good match because your resume/search has: {', '.join(matched)}."
                )
            elif job.get("is_search_card"):
                job["ai_insight"] = (
                    "Live job-board search link. Open it to see latest listings for this role/location."
                )
            else:
                job["ai_insight"] = (
                    "Basic match found. Add more resume skills or search a specific role for better results."
                )

        # Nearby mode: prefer exact/India/Remote locations.
        if src == "nearby" and location:
            loc_l = location.lower()
            jobs = sorted(
                jobs,
                key=lambda j: (
                    loc_l in str(j.get("location", "")).lower(),
                    "india" in str(j.get("location", "")).lower(),
                    "remote" in str(j.get("location", "")).lower(),
                    j.get("match", 0),
                ),
                reverse=True,
            )
        else:
            jobs = sorted(jobs, key=lambda j: j.get("match", 0), reverse=True)

        return {
            "count": len(jobs[:limit]),
            "source": source,
            "location": location or "India",
            "skills_used": scoring_skills,
            "jobs": jobs[:limit],
        }

    except Exception as e:
        return JSONResponse(
            content={"error": f"Job fetch failed: {str(e)}"},
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = crud.get_job_by_id(db, job_id)
    if not job:
        return JSONResponse(
            content={"error": "Job not found"},
            status_code=status.HTTP_404_NOT_FOUND,
        )

    return {
        "id": job.id,
        "title": job.title,
        "company": job.company,
        "description": job.description,
        "url": job.url,
    }
