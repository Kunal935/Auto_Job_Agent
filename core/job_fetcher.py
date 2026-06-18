"""
core/job_fetcher.py
India-focused multi-source job fetcher for AutoJobAgent.

What this file does:
- Fetches real jobs from open/public sources where possible.
- Adds India job-board search cards for LinkedIn, Naukri, Indeed India, Foundit.
- Fetches Internshala using best-effort HTML parsing with safe fallback search cards.
- Normalizes every result so the React UI can display the same fields.
- Supports skill matching, location/nearby sorting, dedupe, and fallback demo jobs.

Note:
LinkedIn/Naukri do not provide a simple public jobs API for this use case.
So this code uses reliable search links for those sources instead of fragile scraping.
"""

from __future__ import annotations

import hashlib
import re
import time
from datetime import datetime
from typing import Dict, List, Optional, Set, Tuple
from urllib.parse import quote_plus, urlencode

import requests
from bs4 import BeautifulSoup

REQUEST_TIMEOUT = 10
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0 Safari/537.36"
    ),
    "Accept-Language": "en-IN,en;q=0.9",
}

INDIA_CITIES = [
    "india", "delhi", "new delhi", "noida", "gurgaon", "gurugram", "faridabad",
    "mumbai", "thane", "pune", "bangalore", "bengaluru", "hyderabad", "chennai",
    "kolkata", "ahmedabad", "jaipur", "lucknow", "indore", "bhopal", "chandigarh",
    "mohali", "kochi", "cochin", "trivandrum", "thiruvananthapuram", "surat",
    "nagpur", "vadodara", "coimbatore", "patna", "dehradun", "remote",
]

COMMON_SKILLS = [
    "python", "fastapi", "django", "flask", "sql", "mysql", "postgresql", "mongodb",
    "react", "node", "node.js", "javascript", "typescript", "java", "spring boot",
    "machine learning", "deep learning", "nlp", "computer vision", "opencv", "tensorflow",
    "pytorch", "pandas", "numpy", "scikit-learn", "sklearn", "rag", "langchain",
    "llm", "generative ai", "genai", "rest api", "api", "docker", "kubernetes",
    "aws", "azure", "gcp", "git", "linux", "html", "css", "tailwind",
]

MOCK_JOBS = [
    {
        "id": "demo-python-delhi-001",
        "title": "Python Backend Developer",
        "company": "TechNova India",
        "location": "Delhi NCR, India",
        "url": "https://www.naukri.com/python-backend-developer-jobs-in-delhi-ncr",
        "source": "Naukri Search",
        "skills_required": ["Python", "FastAPI", "SQL", "REST API"],
        "salary": "6-10 LPA",
        "posted_at": "Active Now",
        "description": "Search card for Python backend roles in Delhi NCR.",
    },
    {
        "id": "demo-ml-bangalore-002",
        "title": "Machine Learning Engineer",
        "company": "AI Hiring India",
        "location": "Bengaluru, India",
        "url": "https://www.linkedin.com/jobs/search/?keywords=machine%20learning%20engineer&location=Bengaluru%2C%20India",
        "source": "LinkedIn Search",
        "skills_required": ["Python", "Machine Learning", "NLP", "Pandas"],
        "salary": "Market Rate",
        "posted_at": "Active Now",
        "description": "Search card for ML roles in Bengaluru.",
    },
    {
        "id": "demo-internshala-ai-003",
        "title": "AI / GenAI Internship",
        "company": "Internshala Opportunities",
        "location": "Remote / India",
        "url": "https://internshala.com/jobs/keywords-generative%20ai/",
        "source": "Internshala",
        "skills_required": ["Python", "LLM", "GenAI", "API"],
        "salary": "Stipend / Entry Level",
        "posted_at": "Active Now",
        "description": "Search card for AI and GenAI fresher opportunities.",
    },
]


def clean_html(html_content: str) -> str:
    if not html_content or not isinstance(html_content, str):
        return ""
    if "<" not in html_content or ">" not in html_content:
        return re.sub(r"\s+", " ", html_content).strip()
    try:
        soup = BeautifulSoup(html_content, "html.parser")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()
        text = soup.get_text(" ")
        return re.sub(r"\s+", " ", text).strip()
    except Exception:
        return re.sub(r"\s+", " ", html_content).strip()


def _safe_text(node) -> str:
    return node.get_text(" ", strip=True) if node else ""


def _safe_attr(node, attr: str) -> str:
    return node.get(attr, "") if node else ""


def _split_skills(skill: Optional[str]) -> List[str]:
    if not skill:
        return []
    parts = re.split(r"[,|/]+", str(skill))
    return [p.strip() for p in parts if p.strip()]


def _main_skill(skill: Optional[str]) -> str:
    skills = _split_skills(skill)
    return skills[0] if skills else "python developer"


def _slug(text: Optional[str]) -> str:
    text = (text or "india").lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-") or "india"


def _hash_id(*values: str) -> str:
    raw = "|".join([v or "" for v in values])
    return hashlib.md5(raw.encode("utf-8")).hexdigest()[:12]


def extract_skills_from_text(text: str, max_skills: int = 8) -> List[str]:
    text_l = (text or "").lower()
    found = []
    for skill in COMMON_SKILLS:
        if skill in text_l and skill not in found:
            found.append(skill)
        if len(found) >= max_skills:
            break
    return found


def _normalize_job(job: Dict) -> Dict:
    title = (job.get("title") or job.get("position") or "Job Opportunity").strip()
    company = (job.get("company") or job.get("company_name") or "Unknown Company").strip()
    description = clean_html(job.get("description") or job.get("summary") or "")
    url = job.get("url") or job.get("link") or ""
    source = job.get("source") or job.get("site") or "Job Board"
    location = job.get("location") or job.get("candidate_required_location") or "India / Remote"
    skills_required = job.get("skills_required") or job.get("tags") or []

    if isinstance(skills_required, str):
        skills_required = _split_skills(skills_required)
    if not skills_required:
        skills_required = extract_skills_from_text(f"{title} {description}")

    return {
        "id": job.get("id") or _hash_id(title, company, url, source),
        "title": title,
        "company": company,
        "description": description,
        "url": url,
        "source": source,
        "posted_at": job.get("posted_at") or job.get("date") or job.get("publication_date") or "Active Now",
        "location": location,
        "salary": job.get("salary") or job.get("salary_range") or "Market Rate",
        "experience": job.get("experience") or "Entry / Relevant",
        "skills_required": skills_required,
        "tags": job.get("tags") or skills_required[:4],
        "logo": job.get("logo"),
        "is_search_card": bool(job.get("is_search_card", False)),
    }


def _job_identity(job: Dict) -> str:
    return f"{job.get('title','').lower()}|{job.get('company','').lower()}|{job.get('url','').lower()}"


def deduplicate(jobs: List[Dict]) -> List[Dict]:
    seen: Set[str] = set()
    unique: List[Dict] = []
    for job in jobs:
        norm = _normalize_job(job)
        identity = _job_identity(norm)
        if identity in seen:
            continue
        seen.add(identity)
        unique.append(norm)
    return unique


def _location_score(job_location: str, preferred_location: Optional[str]) -> int:
    if not preferred_location:
        return 0

    job_l = (job_location or "").lower()
    pref_l = preferred_location.lower().strip()

    if not job_l:
        return 0
    if pref_l and pref_l in job_l:
        return 100
    if "remote" in job_l:
        return 65
    if "india" in job_l or any(city in job_l for city in INDIA_CITIES):
        return 50
    return 10


def _skill_score(job: Dict, skills: List[str]) -> int:
    if not skills:
        return 25
    text = f"{job.get('title','')} {job.get('description','')} {' '.join(job.get('skills_required', []))}".lower()
    matches = sum(1 for s in skills if s.lower() in text)
    return min(100, int((matches / max(len(skills), 1)) * 100))


def sort_jobs(jobs: List[Dict], skills: Optional[str] = None, location: Optional[str] = None) -> List[Dict]:
    skill_list = [s.lower() for s in _split_skills(skills)]

    def score(job: Dict) -> Tuple[int, int, int]:
        loc = _location_score(job.get("location", ""), location)
        skill = _skill_score(job, skill_list)
        search_card_penalty = -10 if job.get("is_search_card") else 0
        return (loc + skill + search_card_penalty, skill, loc)

    return sorted(jobs, key=score, reverse=True)


def _make_search_card(source: str, query: Optional[str], location: Optional[str], url: str) -> Dict:
    role = _main_skill(query).title()
    loc = location or "India"
    return _normalize_job({
        "title": f"Search {role} jobs on {source}",
        "company": f"{source} Jobs",
        "location": loc,
        "url": url,
        "source": source,
        "posted_at": "Live Search",
        "salary": "Depends on listing",
        "experience": "Freshers / Experienced",
        "skills_required": _split_skills(query) or extract_skills_from_text(role),
        "description": f"Open latest {role} job listings on {source} for {loc}.",
        "is_search_card": True,
    })


# -------------------------
# Real/public source fetchers
# -------------------------

def fetch_remotive(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 10) -> List[Dict]:
    url = "https://remotive.com/api/remote-jobs"
    params = {}
    if skill:
        params["search"] = _main_skill(skill)
    try:
        r = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception:
        return []

    jobs: List[Dict] = []
    for item in data.get("jobs", [])[: limit * 2]:
        title = item.get("title", "")
        desc = clean_html(item.get("description", ""))
        jobs.append(_normalize_job({
            "title": title,
            "company": item.get("company_name", "Unknown"),
            "description": desc,
            "url": item.get("url", ""),
            "source": "Remotive",
            "posted_at": item.get("publication_date"),
            "location": item.get("candidate_required_location") or "Remote",
            "salary": item.get("salary") or "Market Rate",
            "skills_required": extract_skills_from_text(f"{title} {desc}"),
            "logo": item.get("company_logo"),
        }))
        if len(jobs) >= limit:
            break
    return jobs


def fetch_remoteok(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 10) -> List[Dict]:
    try:
        r = requests.get("https://remoteok.com/api", headers=HEADERS, timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception:
        return []

    skills = [s.lower() for s in _split_skills(skill)]
    jobs: List[Dict] = []
    for item in data[1:]:
        title = item.get("position") or item.get("title") or ""
        desc = clean_html(item.get("description", ""))
        tags = item.get("tags") or []
        text = f"{title} {desc} {' '.join(tags)}".lower()
        if skills and not any(s in text for s in skills):
            continue
        jobs.append(_normalize_job({
            "title": title,
            "company": item.get("company", "Unknown"),
            "description": desc,
            "url": item.get("url") or item.get("apply_url") or "",
            "source": "RemoteOK",
            "posted_at": item.get("date"),
            "location": "Remote",
            "salary": item.get("salary_min") or "Market Rate",
            "skills_required": tags or extract_skills_from_text(text),
            "logo": item.get("company_logo"),
        }))
        if len(jobs) >= limit:
            break
    return jobs


def fetch_arbeitnow(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 10) -> List[Dict]:
    try:
        r = requests.get("https://www.arbeitnow.com/api/job-board-api", timeout=REQUEST_TIMEOUT)
        r.raise_for_status()
        data = r.json()
    except Exception:
        return []

    skills = [s.lower() for s in _split_skills(skill)]
    jobs: List[Dict] = []
    for item in data.get("data", []):
        title = item.get("title") or ""
        desc = clean_html(item.get("description", ""))
        text = f"{title} {desc}".lower()
        if skills and not any(s in text for s in skills):
            continue
        jobs.append(_normalize_job({
            "title": title,
            "company": item.get("company_name", "Unknown"),
            "description": desc,
            "url": item.get("url", ""),
            "source": "ArbeitNow",
            "posted_at": item.get("created_at"),
            "location": ", ".join(item.get("location", []) or []) or "Remote / Europe",
            "skills_required": extract_skills_from_text(text),
        }))
        if len(jobs) >= limit:
            break
    return jobs


def fetch_hackernews(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 10) -> List[Dict]:
    try:
        ids = requests.get(
            "https://hacker-news.firebaseio.com/v0/jobstories.json",
            timeout=REQUEST_TIMEOUT,
        ).json()[: max(limit * 3, 20)]
    except Exception:
        return []

    skills = [s.lower() for s in _split_skills(skill)]
    jobs: List[Dict] = []
    for job_id in ids:
        try:
            item = requests.get(
                f"https://hacker-news.firebaseio.com/v0/item/{job_id}.json",
                timeout=REQUEST_TIMEOUT,
            ).json()
        except Exception:
            continue
        if not item:
            continue
        title = item.get("title") or ""
        desc = clean_html(item.get("text", ""))
        text = f"{title} {desc}".lower()
        if skills and not any(s in text for s in skills):
            continue
        jobs.append(_normalize_job({
            "title": title,
            "company": "Hacker News Hiring",
            "description": desc,
            "url": item.get("url") or f"https://news.ycombinator.com/item?id={job_id}",
            "source": "HackerNews",
            "posted_at": item.get("time"),
            "location": "Remote / Global",
            "skills_required": extract_skills_from_text(text),
        }))
        if len(jobs) >= limit:
            break
    return jobs


# -------------------------
# India source helpers
# -------------------------

def fetch_internshala(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 12) -> List[Dict]:
    query = _main_skill(skill)
    location_slug = _slug(location or "india")

    candidate_urls = [
        f"https://internshala.com/jobs/keywords-{quote_plus(query)}/",
        f"https://internshala.com/internships/keywords-{quote_plus(query)}/",
    ]
    if location and location.lower() not in ["india", "remote"]:
        candidate_urls.insert(0, f"https://internshala.com/jobs/keywords-{quote_plus(query)}/location-{location_slug}/")

    results: List[Dict] = []
    for url in candidate_urls:
        try:
            r = requests.get(url, headers=HEADERS, timeout=REQUEST_TIMEOUT)
            if r.status_code >= 400:
                continue
            soup = BeautifulSoup(r.text, "html.parser")
            cards = soup.select(".individual_internship, .internship_meta, .container-fluid.individual_internship")
            for card in cards:
                title_tag = (
                    card.select_one(".job-title-href")
                    or card.select_one(".profile a")
                    or card.select_one("h3 a")
                    or card.select_one("a.view_detail_button")
                    or card.select_one("a[href*='/job/']")
                    or card.select_one("a[href*='/internship/']")
                )
                if not title_tag:
                    continue
                company_tag = (
                    card.select_one(".company-name")
                    or card.select_one(".company_name")
                    or card.select_one(".company a")
                )
                loc_tag = (
                    card.select_one(".locations")
                    or card.select_one(".location_link")
                    or card.select_one(".individual_internship_details .item_body")
                )
                href = _safe_attr(title_tag, "href")
                if href and href.startswith("/"):
                    href = "https://internshala.com" + href
                title = _safe_text(title_tag)
                company = _safe_text(company_tag) or "Internshala Company"
                loc = _safe_text(loc_tag) or location or "India / Remote"
                text = _safe_text(card)
                results.append(_normalize_job({
                    "title": title,
                    "company": company,
                    "description": text[:900],
                    "url": href or url,
                    "source": "Internshala",
                    "location": loc,
                    "posted_at": "Recent",
                    "salary": "Stipend / As listed",
                    "experience": "Fresher / Internship / Entry",
                    "skills_required": extract_skills_from_text(text),
                }))
                if len(results) >= limit:
                    return deduplicate(results)[:limit]
        except Exception:
            continue

    # Fallback: at least provide correct Internshala search card.
    return [
        _make_search_card(
            "Internshala",
            skill,
            location or "India",
            f"https://internshala.com/jobs/keywords-{quote_plus(query)}/",
        )
    ]


def fetch_linkedin(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 3) -> List[Dict]:
    query = _main_skill(skill)
    loc = location or "India"
    url = "https://www.linkedin.com/jobs/search/?" + urlencode({"keywords": query, "location": loc})
    return [_make_search_card("LinkedIn", skill, loc, url)]


def fetch_naukri(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 3) -> List[Dict]:
    query = _main_skill(skill)
    loc = location or "India"
    url = f"https://www.naukri.com/{_slug(query)}-jobs-in-{_slug(loc)}"
    return [_make_search_card("Naukri", skill, loc, url)]


def fetch_indeed_india(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 3) -> List[Dict]:
    query = _main_skill(skill)
    loc = location or "India"
    url = "https://in.indeed.com/jobs?" + urlencode({"q": query, "l": loc, "sort": "date"})
    return [_make_search_card("Indeed India", skill, loc, url)]


def fetch_foundit(skill: Optional[str] = None, location: Optional[str] = None, limit: int = 3) -> List[Dict]:
    query = _main_skill(skill)
    loc = location or "India"
    url = f"https://www.foundit.in/srp/results?query={quote_plus(query)}&locations={quote_plus(loc)}"
    return [_make_search_card("Foundit", skill, loc, url)]


SOURCE_FETCHERS = {
    "remotive": fetch_remotive,
    "remoteok": fetch_remoteok,
    "arbeitnow": fetch_arbeitnow,
    "hackernews": fetch_hackernews,
    "hn": fetch_hackernews,
    "internshala": fetch_internshala,
    "linkedin": fetch_linkedin,
    "naukri": fetch_naukri,
    "indeed": fetch_indeed_india,
    "foundit": fetch_foundit,
}


def fetch_all_jobs(
    skill: Optional[str] = None,
    location: Optional[str] = "India",
    limit: int = 24,
    preferred_sources: Optional[List[str]] = None,
) -> List[Dict]:
    skill = skill or "python developer"
    location = location or "India"

    if preferred_sources:
        sources = [s.lower().strip() for s in preferred_sources if s.strip()]
    else:
        # India sources first, then remote/public APIs.
        sources = [
            "internshala",
            "naukri",
            "linkedin",
            "indeed",
            "foundit",
            "remotive",
            "remoteok",
            "arbeitnow",
            "hackernews",
        ]

    aggregated: List[Dict] = []
    for source in sources:
        func = SOURCE_FETCHERS.get(source)
        if not func:
            continue
        try:
            chunk = func(skill=skill, location=location, limit=max(6, limit // 2))
            if isinstance(chunk, list):
                aggregated.extend(chunk)
        except Exception:
            continue
        # Small delay to avoid hammering public endpoints.
        time.sleep(0.05)

    jobs = deduplicate(aggregated)

    if len(jobs) < 6:
        jobs.extend(deduplicate(MOCK_JOBS))
        jobs = deduplicate(jobs)

    jobs = sort_jobs(jobs, skills=skill, location=location)
    return jobs[:limit]


def filter_jobs_by_skills(jobs: List[Dict], skills: List[str], fresher: bool = False) -> List[Dict]:
    skills = [s.lower().strip() for s in skills if s and s.strip()]
    if not skills and not fresher:
        return jobs

    filtered: List[Dict] = []
    for job in jobs:
        text = (
            f"{job.get('title','')} {job.get('description','')} {job.get('company','')} "
            f"{' '.join(job.get('skills_required', []))} {' '.join(job.get('tags', []))}"
        ).lower()
        skill_match = any(skill in text for skill in skills) if skills else True

        if fresher:
            fresher_keywords = [
                "fresher", "entry", "entry level", "junior", "0-1", "0-2",
                "graduate", "intern", "internship", "trainee",
            ]
            fresher_match = any(k in text for k in fresher_keywords)
        else:
            fresher_match = True

        # Keep source search cards even if description is short; they are meant to open live searches.
        if (skill_match and fresher_match) or job.get("is_search_card"):
            filtered.append(job)

    return filtered
