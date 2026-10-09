# backend/db/models.py
from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from datetime import datetime
from .database import Base

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
    sensationalism_score = Column(Float, nullable=True)
    economic_axis   = Column(Float, nullable=True)
    social_axis     = Column(Float, nullable=True)
    evidence_quote  = Column(Text, nullable=True)
    embedding_id    = Column(String, nullable=True)

class TopicSummary(Base):
    __tablename__ = 'topic_summaries'
    id              = Column(Integer, primary_key=True, index=True)
    topic           = Column(String, unique=True, index=True)
    echo_alert      = Column(Text, nullable=True)
    avg_bias        = Column(Float, nullable=True)
    avg_sentiment   = Column(Float, nullable=True)
    dominant_tone   = Column(String, nullable=True)
    article_count   = Column(Integer, default=0)
    created_at      = Column(DateTime, default=datetime.utcnow)
    updated_at      = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)