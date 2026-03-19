from sqlalchemy.orm import Session
from app.db import models


### User CRUD ###
def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user_data: dict):
    db_user = models.User(**user_data)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user_resume_parsed(db: Session, user_id: int):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.resume_parsed = 1
        db.commit()
    return user


### Resume CRUD ###
def create_resume(db: Session, resume_data: dict, user_id: int | None = None):
    db_resume = models.Resume(**resume_data, user_id=user_id)
    db.add(db_resume)
    db.commit()
    db.refresh(db_resume)
    return db_resume


def get_resume_by_id(db: Session, resume_id: int):
    return db.query(models.Resume).filter(models.Resume.id == resume_id).first()


### Jobs CRUD ###
def create_job(db: Session, job_data: dict):
    db_job = models.Job(**job_data)
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job


def get_job_by_id(db: Session, job_id: int):
    return db.query(models.Job).filter(models.Job.id == job_id).first()



def get_all_jobs(db: Session):
    return db.query(models.Job).all()
