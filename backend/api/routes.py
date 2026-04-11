# backend/api/routes.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import Article
from ..celery_tasks import run_analysis_task
from ..db.vector_store import semantic_search
from pydantic import BaseModel

router = APIRouter()

class AnalyzeRequest(BaseModel):
    topic: str
    subreddits: list[str] = ['technology', 'worldnews', 'politics']
    news_sources: list[str] = []

@router.post('/analyze')
async def start_analysis(req: AnalyzeRequest):
    """Kick off async analysis pipeline — returns a task ID."""
    task = run_analysis_task.delay(req.topic, req.subreddits, req.news_sources)
    return {'task_id': task.id, 'status': 'queued'}

@router.get('/results/{topic}')
def get_results(topic: str, db: Session = Depends(get_db)):
    """Return all analysed articles for a topic."""
    articles = db.query(Article).filter(Article.topic == topic).all()
    if not articles:
        raise HTTPException(404, 'No results found for this topic')
    return {'topic': topic, 'count': len(articles), 'articles': articles}

@router.get('/search')
def semantic_query(q: str, topic: str = None):
    """RAG semantic search across stored articles."""
    results = semantic_search(q, topic_filter=topic)
    return {'query': q, 'results': results}

@router.get('/topics')
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(Article.topic).distinct().all()
    return [t[0] for t in topics]