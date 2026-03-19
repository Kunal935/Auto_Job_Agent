import os
import json
import time
from typing import Dict, Any

from google import genai
from app.core.resume_parser import extract_resume_llm, read_file, clean_text
from app.core.job_matching import calculate_skill_match


# ==============================
# 🔹 CONFIG
# ==============================

MODEL_NAME = "gemini-2.5-flash"
MAX_RETRIES = 3
RETRY_DELAY = 5  # seconds


# ==============================
# 🔹 Gemini Client Setup
# ==============================

def get_gemini_client():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY not set in environment variables.")
    return genai.Client(api_key=api_key)


# ==============================
# 🔹 Main Cover Letter Function
# ==============================

def generate_cover_letter(
    resume_file_path: str,
    job_description: str,
    company_name: str = "the company",
    tone: str = "professional",
    experience_level: str = "intermediate",
    word_limit: int = 300
) -> Dict[str, Any]:

    # 1️⃣ File Validation
    if not os.path.exists(resume_file_path):
        return {"error": f"Resume file not found: {resume_file_path}"}

    # 2️⃣ Extract Resume Text
    resume_text = read_file(resume_file_path)
    cleaned_resume = clean_text(resume_text)

    # 3️⃣ Extract Structured Resume Data
    resume_data = extract_resume_llm(resume_file_path)
    resume_skills = resume_data.get("skills", []) or []

    # 4️⃣ Clean Job Skills
    job_skills = [
        s.strip().lower()
        for s in job_description.split(",")
        if s.strip()
    ]

    # 5️⃣ Skill Match Score
    match_report = calculate_skill_match(resume_skills, job_skills)
    score = match_report.get("total_score_percent", 0)

    # 6️⃣ Prompt Engineering (Optimized for Quality + Control)
    prompt = f"""
You are an elite AI career strategist and ATS optimization expert.

Generate a highly personalized cover letter based strictly on the configuration below.

=====================================
INPUT CONFIGURATION
=====================================

Applicant Level: {experience_level.upper()}
Tone: {tone.upper()}
Word Limit Range: {word_limit}
Company Name: {company_name}
Skill Match Score: {score}%

Target Job Skills:
{', '.join(job_skills)}

Candidate Resume:
{cleaned_resume}

=====================================
STRICT GENERATION RULES
=====================================

1. WORD COUNT:
- The total word count MUST strictly stay within: {word_limit}.
- Do NOT exceed the maximum.
- Do NOT go below the minimum.
- Adjust sentence length if needed to stay inside the range.

2. TONE CONSISTENCY:
- PROFESSIONAL → Formal, structured, corporate tone.
- CONFIDENT → Assertive, impact-driven, bold but not arrogant.
- FRIENDLY → Warm, approachable, conversational but still polished.
- Tone must remain consistent throughout.

3. STRUCTURE FORMAT (STRICT):

Paragraph 1:
- Strong opening tailored to the company.
- Mention Company Name naturally.
- Avoid generic openings like "I am writing to apply..."

Paragraph 2:
- Align candidate strengths with target job skills.
- Naturally incorporate relevant keywords.

Paragraph 3 (Experience-Level Specific):

BEGINNER:
- Highlight learning mindset, projects, adaptability.
- Emphasize potential and foundational skills.

INTERMEDIATE:
- Highlight measurable achievements.
- Use metrics where possible (%, impact, improvement, efficiency).

ADVANCED:
- Highlight strategic contributions.
- Demonstrate cross-functional collaboration and decision-making.

PROFESSIONAL:
- Emphasize leadership, transformation impact, business outcomes.
- Show industry-level thinking.

Final Paragraph:
- Strong closing statement.
- Express forward-looking intent.
- Avoid clichés.

4. ATS OPTIMIZATION:
- Naturally include important job skills.
- Avoid keyword stuffing.
- Maintain readability.

5. QUALITY CONTROL:
- Avoid repetition.
- Avoid fluff.
- Avoid overused corporate clichés.
- Keep sentences clear and impactful.

6. OUTPUT FORMAT:
- Return only the cover letter text.
- Write in clear paragraphs separated by ONE blank line.
- Each paragraph must appear like normal written text.
- Do NOT include markdown.
- Do NOT include JSON.
- Do NOT include headings.
- Do NOT include bullet points.
- Do NOT include explanations.

Example format:
Paragraph one text here explaining interest in the company.
Paragraph two text here explaining relevant skills and alignment.
Paragraph three text here describing experience and achievements.
Final paragraph closing statement expressing enthusiasm.
"""

    # 7️⃣ Gemini Call with Retry Logic
    client = get_gemini_client()

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "temperature": 0.7,
                }
            )

            # 🔹 FIX: Direct text output instead of JSON parsing
            letter_text = response.text.strip()

            if not letter_text:
                raise ValueError("Empty cover letter returned.")

            # 8️⃣ Word Limit Safety Trim
            words = letter_text.split()
            if len(words) > word_limit:
                letter_text = " ".join(words[:word_limit])

            return {
                "cover_letter": letter_text,
                "word_count": len(letter_text.split()),
                "company": company_name,
                "tone": tone.capitalize(),
                "experience_level": experience_level.capitalize(),
                "skill_match_score": score
            }

        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                wait_time = RETRY_DELAY * (attempt + 1)
                time.sleep(RETRY_DELAY)
            else:
                return {"error": f"Gemini API Error: {str(e)}"}