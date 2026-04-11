# backend/db/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Article(Base):
    __tablename__ = 'articles'
    id              = Column(Integer, primary_key=True, index=True)
    source_type     = Column(String)   # 'reddit' | 'news' | 'blog'
    source_name     = Column(String)   # 'r/technology' | 'BBC' | 'TechCrunch'
    topic           = Column(String)   # e.g. 'Artificial Intelligence'
    title           = Column(String)
    body            = Column(Text)
    url             = Column(String)
    published_at    = Column(DateTime, default=datetime.utcnow)
    sentiment_score = Column(Float, nullable=True)
    bias_score      = Column(Float, nullable=True)   # -10 to +10
    emotion         = Column(String, nullable=True)  # 'outrage' | 'calm' | ...
    embedding_id    = Column(String, nullable=True)  # Pinecone vector ID