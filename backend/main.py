from fastapi import FastAPI, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

from db.database import engine, Base, get_db, SessionLocal
from db.models import Article
from scrapers.reddit_scraper import scrape_reddit
from scrapers.news_scraper import scrape_news
from scrapers.blog_scraper import scrape_all_blogs
from agents.orchestrator import run_full_pipeline
from agents.echo_agent import generate_echo_alert

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Refract API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://refract.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"]
)

class AnalyzeRequest(BaseModel):
    topic: str
    subreddits: list = ["technology", "worldnews", "politics"]

def run_pipeline(topic: str, subreddits: list):
    print(f"Starting pipeline for topic: {topic}")
    raw = []
    raw += scrape_reddit(topic, subreddits)
    raw += scrape_news(topic)
    raw += scrape_all_blogs(topic)
    print(f"Total articles scraped: {len(raw)}")

    enriched = run_full_pipeline(raw)
    print(f"Analysis complete for {len(enriched)} articles")

    alert = generate_echo_alert(topic, enriched)
    print(f"Echo alert generated")

    db = SessionLocal()
    try:
        for art in enriched:
            article = Article(
                source_type     = art.get("source_type", ""),
                source_name     = art.get("source_name", ""),
                topic           = art.get("topic", ""),
                title           = art.get("title", ""),
                body            = art.get("body", ""),
                url             = art.get("url", ""),
                published_at    = art.get("published_at", datetime.utcnow()),
                sentiment_score = art.get("sentiment_score"),
                bias_score      = art.get("bias_score"),
                emotion         = art.get("emotion"),
                bias_label      = art.get("bias_label"),
                loaded_words    = art.get("loaded_words"),
                main_claim      = art.get("main_claim"),
                framing         = art.get("framing"),
                missing_voices  = art.get("missing_voices"),
            )
            db.add(article)
        db.commit()
        print(f"Saved {len(enriched)} articles to database")
    finally:
        db.close()

    return {"articles": enriched, "echo_alert": alert}

@app.get("/")
def root():
    return {"message": "Refract API is running!"}

@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_pipeline, req.topic, req.subreddits)
    return {"status": "started", "topic": req.topic}

@app.get("/api/v1/results/{topic}")
def get_results(topic: str, db: Session = Depends(get_db)):
    articles = db.query(Article).filter(Article.topic == topic).all()
    if not articles:
        return {"topic": topic, "count": 0, "articles": [], "echo_alert": ""}
    enriched = [
        {
            "id":              a.id,
            "source_type":     a.source_type,
            "source_name":     a.source_name,
            "title":           a.title,
            "url":             a.url,
            "sentiment_score": a.sentiment_score,
            "bias_score":      a.bias_score,
            "emotion":         a.emotion,
            "bias_label":      a.bias_label,
            "framing":         a.framing,
            "main_claim":      a.main_claim,
            "missing_voices":  a.missing_voices,
        }
        for a in articles
    ]
    return {"topic": topic, "count": len(enriched), "articles": enriched}

@app.get("/api/v1/topics")
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(Article.topic).distinct().all()
    return {"topics": [t[0] for t in topics]}
