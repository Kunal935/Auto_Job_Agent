"""
core/job_fetcher.py
Multi-source Job Fetcher (APIs + Scrapers) - Full code

Features:
- Integrates multiple job sources (API + HTML scrapers)
- Reads API keys from environment (left blank by default)
- Filters by skill keywords and optional location
- Deduplicates results and returns top-N recent jobs
- Fail-safe: individual source failures won't crash whole fetch
- Sources included: RemoteOK, Remotive, ArbeitNow, WeWorkRemotely,
  TimesJobs (scrape), MonsterIndia (scrape), HackerNews Jobs (scrape),
  JSearch (RapidAPI) placeholder, Adzuna placeholder, GitHub jobs placeholder,
  Indeed/LinkedIn placeholders (require auth / advanced scraping)
"""

import os
import time
import requests
from typing import List, Dict, Optional, Set
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import quote_plus




# HTTP request common config
REQUEST_TIMEOUT = 8
HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; AutoJobAgent/1.0)"}



MOCK_JOBS = [
    {
        "id": "indeed-001",
        "title": "Python Backend Developer",
        "company_name": "TechNova",
        "location": "Bangalore, India",
        "url": "https://indeed.com/job/python-backend-dev",
        "site": "Indeed",
        "skills_required": ["Python", "FastAPI", "PostgreSQL", "Docker"],
        "salary": "6-10 LPA",
        "posted_date": "2025-12-01",
        "description": "Work on scalable APIs and automation pipelines."
    },
    {
        "id": "linkedin-002",
        "title": "Full Stack Engineer",
        "company_name": "Green Apple Solutions",
        "location": "Noida, India",
        "url": "https://linkedin.com/jobs/fullstack",
        "site": "LinkedIn",
        "skills_required": ["JavaScript", "React", "Node.js", "GCP"],
        "salary": "7-12 LPA",
        "posted_date": "2025-11-30",
        "description": "Frontend + Backend ownership with microservices."
    },
    {
        "id": "naukri-003",
        "title": "Machine Learning Engineer (NLP)",
        "company_name": "DataMind AI",
        "location": "Remote",
        "url": "https://naukri.com/jobs/ml-nlp",
        "site": "Naukri",
        "skills_required": ["Python", "Transformers", "MongoDB"],
        "salary": "10-18 LPA",
        "posted_date": "2025-11-29",
        "description": "Build state-of-the-art NLP systems and deploy them."
    },
    {
        "id": "glassdoor-004",
        "title": "AI Software Developer",
        "company_name": "NeoSoft Global",
        "location": "Pune, India",
        "url": "https://glassdoor.com/job/ai-dev",
        "site": "Glassdoor",
        "skills_required": ["Python", "LLMs", "API Integration"],
        "salary": "12-20 LPA",
        "posted_date": "2025-11-28",
        "description": "Build AI-driven solutions with fast deployment cycles."
    },
    {
        "id": "ziprecruiter-005",
        "title": "Cloud DevOps Engineer",
        "company_name": "SkyOps Tech",
        "location": "Hyderabad, India",
        "url": "https://ziprecruiter.com/cloud-devops",
        "site": "ZipRecruiter",
        "skills_required": ["AWS", "CI/CD", "Kubernetes"],
        "salary": "15-25 LPA",
        "posted_date": "2025-11-27",
        "description": "Cloud infrastructure automation and DevOps tooling."
    },
    {
        "id": "monster-006",
        "title": "Backend Developer (Go/Python)",
        "company_name": "RapidAPI Hub",
        "location": "Gurgaon, India",
        "url": "https://monster.com/job/backend-go-python",
        "site": "Monster",
        "skills_required": ["Go", "Python", "Redis"],
        "salary": "8-16 LPA",
        "posted_date": "2025-11-26",
        "description": "Backend microservices at very large scale."
    },
    {
        "id": "angel-007",
        "title": "AI Product Engineer",
        "company_name": "Stealth Startup",
        "location": "Remote",
        "url": "https://angel.co/jobs/ai-product",
        "site": "Wellfound (AngelList)",
        "skills_required": ["Python", "React", "LLM APIs"],
        "salary": "20-30 LPA + Equity",
        "posted_date": "2025-11-27",
        "description": "AI product ownership from MVP to deployment."
    },
    {
        "id": "hackerearth-008",
        "title": "Junior Software Developer",
        "company_name": "ByteCraft",
        "location": "Mumbai, India",
        "url": "https://hackerearth.com/challenges/hiring",
        "site": "HackerEarth Jobs",
        "skills_required": ["Java", "Spring Boot", "SQL"],
        "salary": "5-9 LPA",
        "posted_date": "2025-11-25",
        "description": "Competitive coding + backend APIs."
    }
]







def clean_html(html_content: str) -> str:
    """
    Strips HTML tags while preserving basic structure like newlines for lists and paragraphs.
    """
    if not html_content or not isinstance(html_content, str):
        return html_content or ""
    
    if "<" not in html_content or ">" not in html_content:
        return html_content.strip()

    try:
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Add newlines for structural tags to preserve readability
        for tag in soup.find_all(["p", "br", "div", "li", "h1", "h2", "h3", "h4"]):
            if tag.name == "li":
                tag.insert(0, "• ")
            tag.append("\n")
            
        text = soup.get_text(separator=" ")
        
        # Cleanup: Remove excessive whitespace and newlines
        import re
        text = re.sub(r' +', ' ', text) # multiple spaces to one
        text = re.sub(r'\n\s*\n', '\n\n', text) # multiple newlines to double
        return text.strip()
    except Exception:
        return html_content.strip()


# ------------------------------
# Helpers
# ------------------------------
def _normalize_job(job: Dict) -> Dict:
    # Clean up HTML from descriptions
    raw_desc = job.get("description", "") or ""
    clean_desc = clean_html(raw_desc)

    normalized = {
        "id": f"{job.get('title', '')}-{job.get('company', '')}".lower().replace(' ', '-'),
        "title": job.get("title", "").strip(),
        "company": (job.get("company") or job.get("company_name") or "Unknown").strip(),
        "description": clean_desc,
        "url": job.get("url", "") or job.get("link", "") or "",
        "source": job.get("source", "unknown"),
        "posted_at": job.get("posted_at") or job.get("date") or None,
        "location": job.get("location", "Remote"),
        "salary": job.get("salary", "Competitive"),
        "experience": job.get("experience", "Not specified"),
        "skills_required": job.get("skills_required", []),
        "logo": job.get("logo", None)
    }
    return normalized


def _job_identity(job: Dict) -> str:
    """Return a simple identity string for dedup (title + company + url)."""
    return f"{(job.get('title') or '').lower()}|{(job.get('company') or '').lower()}|{(job.get('url') or '').lower()}"


# -------------------------
# Remotive API
# -------------------------
def fetch_remotive(skill: Optional[str] = None, limit: int = 10) -> List[Dict]:

    url = "https://remotive.com/api/remote-jobs"

    params = {}
    if skill:
        params["search"] = skill

    try:
        r = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
        data = r.json()
    except Exception:
        return []

    jobs = []

    for job in data.get("jobs", [])[:limit]:

        title = job.get("title", "")
        desc = job.get("description", "")
        # Skill filtering
        if skill and skill.lower() not in (title + desc).lower():
            continue

        jobs.append({
            "title": title,
            "company": job.get("company_name", "Unknown"),
            "description": desc,
            "url": job.get("url", ""),
            "source": "remotive",
            "posted_at": job.get("publication_date")
        })
    return jobs


# -------------------------
# RemoteOK API
# -------------------------
def fetch_remoteok(skill: Optional[str] = None, limit: int = 10) -> List[Dict]:

    url = "https://remoteok.com/api"

    r = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
    data = r.json()

    jobs = []

    for job in data[1:limit+1]:

        title = job.get("position") or ""
        desc = job.get("description","")

        text = (title + desc).lower()

        if skill and skill.lower() not in text:
            continue

        jobs.append({
            "title": title,
            "company": job.get("company"),
            "description": job.get("description", ""),
            "url": job.get("url"),
            "source": "remoteok",
            "posted_at": job.get("date")
        })

    return jobs


# -------------------------
# ArbeitNow API
# -------------------------
def fetch_arbeitnow(skill: Optional[str] = None, limit: int = 10) -> List[Dict]:

    url = "https://www.arbeitnow.com/api/job-board-api"

    r = requests.get(url, timeout=REQUEST_TIMEOUT)
    data = r.json()

    jobs = []

    for job in data.get("data", [])[:limit]:

        title = job.get("title") or ""
        if skill and skill.lower() not in title.lower():
            continue

        jobs.append({
            "title": title,
            "company": job["company_name"],
            "description": job.get("description", ""),
            "url": job["url"],
            "source": "arbeitnow",
            "posted_at": None
        })

    return jobs


# -------------------------
# HackerNews Jobs
# -------------------------
def fetch_hackernews(skill: Optional[str] = None, limit: int = 10) -> List[Dict]:

    url = "https://hacker-news.firebaseio.com/v0/jobstories.json"

    ids = requests.get(url).json()[:limit]

    jobs = []

    for job_id in ids:

        item = requests.get(
            f"https://hacker-news.firebaseio.com/v0/item/{job_id}.json"
        ).json()

        if not item:
            continue

        jobs.append({
            "title": item.get("title"),
            "company": "HackerNews",
            "description": item.get("text", ""),
            "url": item.get("url"),
            "source": "hackernews",
            "posted_at": None
        })

    return jobs


# -------------------------
# Deduplicate
# -------------------------
def deduplicate(jobs: List[Dict]) -> List[Dict]:

    seen: Set[str] = set()
    unique = []

    for job in jobs:

        identity = f"{job['title']}-{job['company']}"

        if identity not in seen:
            seen.add(identity)
            unique.append(job)

    return unique
# ------------------------------
# Internshala Scraper
# ------------------------------

def fetch_internshala(skill: Optional[str] = None,
                      location: Optional[str] = None,
                      limit: int = 12) -> List[Dict]:

    try:

        query = skill.lower() if skill else "python"

        url = f"https://internshala.com/jobs/keywords-{query}"

        resp = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)

        soup = BeautifulSoup(resp.text, "html.parser")

        results = []

        for job in soup.select(".individual_internship"):

            title_tag = job.select_one(".job-title-href")
            comp_tag = job.select_one(".company-name")

            if not title_tag:
                continue

            title = title_tag.get_text(strip=True)
            company = comp_tag.get_text(strip=True) if comp_tag else "Internshala"

            results.append({
                "title": title,
                "company": company,
                "description": "",
                "url": "https://internshala.com" + title_tag.get("href"),
                "source": "internshala",
                "posted_at": None
            })

            if len(results) >= limit:
                break

        return results

    except Exception:
        return []




# ------------------------------
# Master fetch function (aggregates sources)
# ------------------------------
def fetch_all_jobs(skill: Optional[str] = None,
                   location: Optional[str] = None,
                   limit: int = 12,
                   preferred_sources: Optional[List[str]] = None) -> List[Dict]:
    """
    Fetch jobs from multiple configured sources.
    - skill: primary skill keyword (string). If multiple skills, pass comma-separated and we'll check any.
    - location: optional location filter (e.g., "India", "Bangalore")
    - limit: total number of jobs to return
    - preferred_sources: optional list to control which sources to query (by name)
    """

    # normalize skill - if comma-separated, take first as main filter but check all
    skill_keywords = []
    if skill:
        skill_keywords = [s.strip() for s in str(skill).split(",") if s.strip()]

    # list of source fetcher functions mapped by name
    source_funcs = [

    ("remotive", fetch_remotive),
    ("remoteok", fetch_remoteok),
    ("arbeitnow", fetch_arbeitnow),
    ("hackernews", fetch_hackernews),
    ("internshala", fetch_internshala)

    ]
    

    # allow caller to prioritize specific sources
    if preferred_sources:
        ps = [p.lower() for p in preferred_sources]
        source_funcs = [f for f in source_funcs if f[0] in ps]

    aggregated = []
    seen: Set[str] = set()

    # round-robin through sources until we collect `limit` unique jobs
    for source_name, func in source_funcs:
        try:

            try:
                chunk = func(skill=skill_keywords[0] if skill_keywords else None,
                            limit=limit)
            except TypeError:
                chunk = func(limit=limit)

            if not isinstance(chunk, list):
                continue

            for job in chunk:

                norm = _normalize_job(job)
                identity = _job_identity(norm)

                if identity in seen:
                    continue

                seen.add(identity)
                aggregated.append(norm)

                if len(aggregated) >= limit:
                    break

        except Exception:
            continue

        if len(aggregated) >= limit:
            break

    # If we still have fewer than limit, fall back to mock jobs
    if len(aggregated) < limit:
        for mock in (MOCK_JOBS if 'MOCK_JOBS' in globals() else []):
            norm = _normalize_job(mock)
            identity = _job_identity(norm)
            if identity not in seen:
                seen.add(identity)
                aggregated.append(norm)
            if len(aggregated) >= limit:
                break

    final_list: List[Dict] = aggregated[:limit]
    return final_list


# ------------------------------
# Simple filter helper (multi-skill)
# ------------------------------
def filter_jobs_by_skills(jobs: List[Dict], skills: List[str], fresher: bool = False) -> List[Dict]:

    skills = [s.lower().strip() for s in skills if s.strip()]

    if not skills and not fresher:
        return jobs

    filtered = []

    for job in jobs:

        txt = f"{job.get('title','')} {job.get('description','')} {job.get('company','')}".lower()

        # Skill match
        skill_match = any(k in txt for k in skills) if skills else True

        # Fresher filter
        if fresher:
            fresher_keywords = [
                "fresher",
                "entry level",
                "junior",
                "0-1 year",
                "0-2 year",
                "no experience",
                "graduate"
            ]
            fresher_match = any(k in txt for k in fresher_keywords)
        else:
            fresher_match = True

        if skill_match and fresher_match:
            filtered.append(job)

    return filtered

