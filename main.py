# main.py
"""
AutoJobAgent FastAPI App
Author: Kunal
Description:
    - Main entry point for FastAPI backend
    - Includes routers: resume, jobs, match, cover_letter
    - DB setup, CORS, logging
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
# Import routers
from app.routers import resume, jobs, match, cover_letter, auth
from app.core import job_fetcher
from app.db.database import Base, engine

# -----------------------------
# 1️⃣ Logging setup
# -----------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)
logger = logging.getLogger(__name__)

# -----------------------------
# 2️⃣ FastAPI app setup
# -----------------------------
app = FastAPI(
    title="AutoJobAgent API",
    description="AI-powered Resume + Job Matching + Cover Letter Generation",
    version="1.0.0"
)

# -----------------------------
# 3️⃣ CORS setup (Standard for Vite + Windows)
# -----------------------------
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000", # Common alternative
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# 4️⃣ Include Routers
# -----------------------------
app.include_router(resume.router)
app.include_router(jobs.router)
app.include_router(match.router)
app.include_router(cover_letter.router)
app.include_router(auth.router)

# -----------------------------
# 5️⃣ DB initialization
# -----------------------------
@app.on_event("startup")
def startup_event():
    logger.info("Creating all database tables (if not exist)...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("DB tables created successfully.")
    except Exception as e:
        logger.error(f"DB creation failed: {e}")

# -----------------------------
# 6️⃣ Default Route
# -----------------------------
@app.get("/")
def root():
    return {
        "message": "Welcome to AutoJobAgent API 🚀",
        "routes": {
            "/resume": "Resume parsing / extraction",
            "/jobs": "Fetch latest jobs / DB jobs",
            "/match": "AI-based job matching",
            "/cover_letter": "Custom cover letter generation"
        }
    }

# -----------------------------
# 7️⃣ Healthcheck
# -----------------------------
@app.get("/health")
def healthcheck():
    return {"status": "ok", "message": "API is running smoothly"}


# Result of removal
