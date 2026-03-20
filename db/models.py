from sqlalchemy import Column, Integer, String, Text
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True)
    hashed_password = Column(String(255))
    resume_parsed = Column(Integer, default=0) # Using 0/1 for boolean compatibility with some SQLite setups


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer) # For linking to user if needed
    name = Column(String(255), default="")
    email = Column(String(255), default="")
    phone = Column(String(50), default="")
    skills = Column(Text)  # comma separated skills
    raw_text = Column(Text)


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    company = Column(String(255))
    description = Column(Text)
    url = Column(String(255))
