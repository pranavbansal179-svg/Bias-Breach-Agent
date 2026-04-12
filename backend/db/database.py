# backend/db/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://localhost:5432/refract')

# Handle special postgres:// vs postgresql:// URL schemes
if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for FastAPI routes to get a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
