import os
import sys
from dotenv import load_dotenv

# Load env explicitly
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base

DATABASE_URL = os.getenv("DATABASE_URL")
print(f"Using DB: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
Base = declarative_base()

# Import models directly here
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime

class Article(Base):
    __tablename__ = 'articles'
    id              = Column(Integer, primary_key=True, index=True)
    source_type     = Column(String)
    source_name     = Column(String)
    topic           = Column(String)
    title           = Column(String)
    body            = Column(Text)
    url             = Column(String)
    published_at    = Column(DateTime, default=datetime.utcnow)
    sentiment_score = Column(Float, nullable=True)
    bias_score      = Column(Float, nullable=True)
    emotion         = Column(String, nullable=True)
    bias_label      = Column(String, nullable=True)
    loaded_words    = Column(String, nullable=True)
    main_claim      = Column(String, nullable=True)
    framing         = Column(String, nullable=True)
    missing_voices  = Column(String, nullable=True)
    embedding_id    = Column(String, nullable=True)

print("Creating tables...")
Base.metadata.create_all(bind=engine)
print("✅ Done!")