
import json
import re
from pypdf import PdfReader
from docx import Document
import os
from google import genai
import logging
import time

MODEL_NAME = "gemini-2.5-flash"
MAX_RETRIES = 3
RETRY_DELAY = 2


def clean_text(text) -> str:
    """Simple text cleaning: removes extra spaces/newlines/tabs."""
    if not text:
        return ""
    if not isinstance(text, str):
        text = str(text)
    clean = " ".join(text.split())
    return clean


def read_file(file_path: str) -> str:
    """Reads PDF or DOCX resumes safely."""
    text = ""

    if not os.path.exists(file_path):
        print(f"⚠️ File not found: {file_path}")
        return ""

    if file_path.endswith(".pdf"):
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + " "
        except Exception as e:
            print("❌ PDF read error:", e)

    elif file_path.endswith(".docx"):
        try:
            doc = Document(file_path)
            for p in doc.paragraphs:
                text += p.text + " "
        except Exception as e:
            print("❌ DOCX read error:", e)

    else:
        print("⚠️ Unsupported file type. Treating input as plain text.")
        return file_path

    return text.strip()


# ==============================
# 🔹 Gemini Call Function
# ==============================

def call_gemini(prompt: str) -> str:
    """Call Gemini 2.5 Flash and return clean JSON string."""
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
                        "temperature": 0.3
                    }
                )

                return response.text.strip()

            except Exception as inner_error:
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)
                else:
                    raise inner_error

    except Exception as e:
        print("❌ Gemini error:", e)
        return "{}"


def sanitize_json(raw_output: str) -> dict:
    """Force valid JSON output by stripping comments, markdown, and mangled keys."""
    if not raw_output:
        return {"error": "Empty response"}

    clean = re.sub(r"```json|```", "", raw_output, flags=re.IGNORECASE).strip()

    if "{" in clean:
        start = clean.find("{")
        end = clean.rfind("}") + 1
        clean = clean[start:end]

    clean = re.sub(r"^\s*//.*$", "", clean, flags=re.MULTILINE)
    clean = re.sub(r"\s*//.*$", "", clean)

    try:
        data = json.loads(clean)

        if isinstance(data, list):
            data = {"extracted_data": data}

        cleaned_data = {}
        for k, v in data.items():
            flat_key = str(k).replace(" ", "").lower()

            if "summary" in flat_key:
                cleaned_data["summary"] = v
            elif "skill" in flat_key:
                cleaned_data["skills"] = v
            elif "exp" in flat_key:
                cleaned_data["experience"] = v
            elif "edu" in flat_key:
                cleaned_data["education"] = v
            elif "mail" in flat_key:
                cleaned_data["email"] = v
            elif "name" in flat_key:
                cleaned_data["name"] = v
            elif "phone" in flat_key or "mobile" in flat_key:
                cleaned_data["phone"] = v
            elif "project" in flat_key:
                cleaned_data["projects"] = v
            elif "cert" in flat_key:
                cleaned_data["certifications"] = v
            else:
                cleaned_data[k] = v

        core_fields = [
            "name",
            "email",
            "phone",
            "skills",
            "education",
            "projects",
            "experience",
            "certifications",
            "summary",
        ]

        for field in core_fields:
            if field not in cleaned_data:
                cleaned_data[field] = "" if field in ["name", "email", "phone", "summary"] else []

        return cleaned_data

    except Exception as e:
        print(f"❌ JSON Sanitization failed: {e}")
        return {"error": "Invalid JSON mapping", "raw_output": raw_output[:500]}


# ==============================
# 🔹 Resume Extraction
# ==============================

def extract_resume_llm(input_data: str) -> dict:
    """
    Smart function:
    - If file path provided → Read file
    - If raw text provided → Use directly
    """

    logger = logging.getLogger(__name__)

    if isinstance(input_data, str) and os.path.exists(input_data):
        logger.info(f"Reading file: {input_data}")
        text = read_file(input_data)
    else:
        logger.info("Using provided raw text")
        text = input_data

    if not text:
        logger.warning("No text extracted from resume!")
        return {"error": "No text extracted from resume"}

    logger.info(f"Extracted {len(text)} characters. Sending to Gemini...")

    cleaned_text = clean_text(text)

    prompt = f"""
You are a top ATS AI. Extract ONLY the correct data present in resume.
Return valid formatted JSON strictly.

MANDATORY FIELDS:
- name (string)
- email (string)
- phone (string)
- skills (list of ONLY technical skills)
- education (list)
- projects (list)
- experience (list)
- certifications (list)

Rules:
- Skills = BOTH Skill Section + Project Tech Stack + Tools mentioned
- No duplicate skills
- Return VALID JSON ONLY

Resume Text:
{cleaned_text}
"""

    try:
        raw = call_gemini(prompt)
        logger.info("Received response from Gemini")
        data = sanitize_json(raw)
        return data
    except Exception as e:
        logger.error(f"Gemini extraction failed: {e}")
        return {"error": str(e)}