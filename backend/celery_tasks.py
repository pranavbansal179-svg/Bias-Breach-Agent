# backend/celery_tasks.py
from celery import Celery
from .scrapers.reddit_scraper import scrape_reddit
from .scrapers.news_scraper import scrape_news
from .scrapers.blog_scraper import scrape_all_blogs
from .agents.orchestrator import run_full_pipeline
from .agents.echo_agent import generate_echo_alert
from .db.database import SessionLocal
from .db.models import Article
from .db.vector_store import upsert_article
import os

celery_app = Celery('refract', broker=os.getenv('CELERY_BROKER_URL'))

@celery_app.task(bind=True)
def run_analysis_task(self, topic: str, subreddits: list, news_sources: list):
    self.update_state(state='SCRAPING')
    
    # 1. Scrape all sources
    raw = []
    raw += scrape_reddit(topic, subreddits)
    raw += scrape_news(topic, news_sources)
    raw += scrape_all_blogs(topic)
    
    self.update_state(state='ANALYSING')
    
    # 2. Run agent pipeline
    enriched = run_full_pipeline(raw)
    
    # 3. Persist to DB + vector store
    db = SessionLocal()
    try:
        for art in enriched:
            article = Article(**{k: art[k] for k in Article.__table__.columns.keys() if k in art})
            db.add(article)
            db.flush()
            vec_id = upsert_article(art)
            article.embedding_id = vec_id
        db.commit()
    finally:
        db.close()
    
    # 4. Generate echo alert
    alert = generate_echo_alert(topic, enriched)
    return {'topic': topic, 'articles_processed': len(enriched), 'echo_alert': alert}