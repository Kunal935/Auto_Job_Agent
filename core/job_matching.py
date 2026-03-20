import json
from core.resume_parser import extract_resume_llm

# Skill aliases / synonyms mapping
SKILL_ALIASES = {
    "natural language processing": "nlp",
    "nltk": "nltk",
    "tensorflow": "tensorflow",
    "pytorch": "pytorch",
    "xgboost": "xgboost",
    "scikit-learn": "scikit-learn",
    "pandas": "pandas",
    "numpy": "numpy",
    "matplotlib": "matplotlib",
    "seaborn": "seaborn",
    "streamlit": "streamlit",
    "apis": "apis",
    "requests api": "apis",
    "tf-idf": "tf-idf",
    "classification": "classification",
    "regression": "regression",
    "supervised learning": "supervised learning",
    "unsupervised learning": "unsupervised learning",
    "model evaluation": "model evaluation",
    "machine learning": "machine learning",
    "deep learning": "deep learning",
}

def normalize_skills(skills_list):
    """Lowercase, strip whitespace, and map aliases for uniform comparison"""
    normalized = set()
    if not isinstance(skills_list, (list, set, tuple)):
        return normalized
        
    for s in skills_list:
        if not s:
            continue
        # Force string type for robustness
        content = str(s).strip()
        if content:
            key = content.lower()
            mapped = SKILL_ALIASES.get(key, key)
            normalized.add(mapped)
    return normalized

def calculate_skill_match(resume_skills, job_skills, optional_skills=None):
    """
    Advanced skill matching with alias mapping:
    - resume_skills: list of strings from resume
    - job_skills: required skills list
    - optional_skills: optional skills list
    Returns detailed matching report with total score
    """
    resume_set = normalize_skills(resume_skills)
    job_set = normalize_skills(job_skills)
    optional_set = normalize_skills(optional_skills or [])

    core_matched = resume_set.intersection(job_set)
    optional_matched = resume_set.intersection(optional_set)
    missing_core = job_set - resume_set
    missing_optional = optional_set - resume_set

    # Scoring: required = 70%, optional = 30%
    total_core = len(job_set)
    total_optional = len(optional_set) if optional_set else 0
    core_score = (len(core_matched) / total_core * 70) if total_core else 0
    optional_score = (len(optional_matched) / total_optional * 30) if total_optional else 0
    total_score = round(core_score + optional_score, 2)

    return {
        "core_matched": sorted(list(core_matched)),
        "optional_matched": sorted(list(optional_matched)),
        "missing_core": sorted(list(missing_core)),
        "missing_optional": sorted(list(missing_optional)),
        "total_score_percent": total_score
    }


def generate_detailed_match_report(resume_text, job_description):
    """
    Uses Gemini 2.5 Flash to generate a detailed match analysis between resume and job.
    """
    from google import genai
    import os
    import json
    import time

    MODEL_NAME = "gemini-2.5-flash"
    MAX_RETRIES = 3
    RETRY_DELAY = 2

    prompt = f"""
You are a career consultant and ATS expert.
Analyze the following resume against the job description.

MANDATORY OUTPUT FIELDS (JSON):
- score (int 0-100)
- insight (2-3 sentences explaining why it's a match or why not)
- missing_skills (list of technical skills from description not in resume)
- red_flags (list of any major gaps like experience years, industry mismatch)
- strengths (list of top 3 reasons they fit)

Resume Text:
{resume_text}

Job Description:
{job_description}

Return ONLY valid JSON.
No markdown.
No explanations.
"""

    try:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not set.")

        client = genai.Client(api_key=api_key)

        for attempt in range(MAX_RETRIES):
            try:
                response = client.models.generate_content(
                    model=MODEL_NAME,
                    contents=prompt,
                    config={
                        "response_mime_type": "application/json",
                        "temperature": 0.4
                    }
                )

                content = response.text.strip()
                data = json.loads(content)

                return data

            except Exception as inner_error:
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                else:
                    raise inner_error

    except Exception as e:
        return {
            "score": 0,
            "insight": "Failed to analyze match via AI.",
            "missing_skills": [],
            "red_flags": [str(e)],
            "strengths": []
        }