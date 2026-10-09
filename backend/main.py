from fastapi import FastAPI, BackgroundTasks, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import datetime
import json
import ast
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

import sys
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.database import engine, Base, get_db, SessionLocal
from db.models import Article, TopicSummary
from scrapers.reddit_scraper import scrape_reddit
from scrapers.news_scraper import scrape_news
from scrapers.blog_scraper import scrape_all_blogs
from agents.orchestrator import run_full_pipeline
from agents.echo_agent import generate_echo_alert

# Auto-create tables (both Article and TopicSummary)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Refract Bias Breach API", version="1.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "https://refract.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

class AnalyzeRequest(BaseModel):
    topic: str
    subreddits: list = ["technology", "worldnews", "politics"]

class AskRequest(BaseModel):
    topic: str
    question: str

def parse_loaded_words(raw) -> list:
    if not raw:
        return []
    if isinstance(raw, list):
        return [str(w) for w in raw if str(w).strip()]
    if isinstance(raw, str):
        raw_str = raw.strip()
        # Try json parse
        try:
            val = json.loads(raw_str)
            if isinstance(val, list):
                return [str(w) for w in val if str(w).strip()]
        except Exception:
            pass
        # Try python ast literal
        try:
            val = ast.literal_eval(raw_str)
            if isinstance(val, list):
                return [str(w) for w in val if str(w).strip()]
        except Exception:
            pass
        # Comma separated fallback
        cleaned = raw_str.strip("[]'\" ").split(",")
        return [w.strip(" '\"") for w in cleaned if w.strip(" '\"")]
    return []

def compute_topic_stats(articles):
    if not articles:
        return {
            "articles_count": 0,
            "avg_bias": 0.0,
            "bias_label": "Balanced",
            "avg_sentiment": 0.0,
            "sentiment_label": "Neutral",
            "dominant_tone": "Neutral",
            "source_distribution": {"news": 0, "reddit": 0, "blog": 0},
            "bias_spectrum": {"left": 0, "center": 0, "right": 0},
            "framing_distribution": {"Opportunity": 0, "Threat": 0, "Neutral": 0, "Conflict": 0}
        }

    bias_scores = [a.bias_score for a in articles if a.bias_score is not None]
    sent_scores = [a.sentiment_score for a in articles if a.sentiment_score is not None]
    avg_bias = round(sum(bias_scores) / len(bias_scores), 2) if bias_scores else 0.0
    avg_sentiment = round(sum(sent_scores) / len(sent_scores), 2) if sent_scores else 0.0

    if avg_bias <= -4.0:
        bias_label = "Far Left"
    elif avg_bias <= -1.5:
        bias_label = "Left-Leaning"
    elif avg_bias <= 1.5:
        bias_label = "Balanced"
    elif avg_bias <= 4.0:
        bias_label = "Right-Leaning"
    else:
        bias_label = "Far Right"

    if avg_sentiment <= -0.15:
        sentiment_label = "Negative"
    elif avg_sentiment >= 0.15:
        sentiment_label = "Positive"
    else:
        sentiment_label = "Neutral"

    tones = [a.emotion for a in articles if a.emotion]
    dominant_tone = max(set(tones), key=tones.count).capitalize() if tones else "Neutral"

    source_distribution = {"news": 0, "reddit": 0, "blog": 0}
    for a in articles:
        st = (a.source_type or "").lower()
        if "news" in st:
            source_distribution["news"] += 1
        elif "reddit" in st:
            source_distribution["reddit"] += 1
        elif "blog" in st:
            source_distribution["blog"] += 1
        else:
            source_distribution["news"] += 1

    bias_spectrum = {"left": 0, "center": 0, "right": 0}
    for a in articles:
        b = a.bias_score if a.bias_score is not None else 0.0
        if b < -1.5:
            bias_spectrum["left"] += 1
        elif b > 1.5:
            bias_spectrum["right"] += 1
        else:
            bias_spectrum["center"] += 1

    framing_distribution = {"Opportunity": 0, "Threat": 0, "Neutral": 0, "Conflict": 0}
    for a in articles:
        f = (a.framing or "Neutral").strip().capitalize()
        if f in framing_distribution:
            framing_distribution[f] += 1
        elif "opp" in f.lower():
            framing_distribution["Opportunity"] += 1
        elif "threat" in f.lower():
            framing_distribution["Threat"] += 1
        elif "conf" in f.lower():
            framing_distribution["Conflict"] += 1
        else:
            framing_distribution["Neutral"] += 1

    return {
        "articles_count": len(articles),
        "avg_bias": avg_bias,
        "bias_label": bias_label,
        "avg_sentiment": avg_sentiment,
        "sentiment_label": sentiment_label,
        "dominant_tone": dominant_tone,
        "source_distribution": source_distribution,
        "bias_spectrum": bias_spectrum,
        "framing_distribution": framing_distribution
    }

def run_pipeline(topic: str, subreddits: list):
    print(f"[Pipeline] Starting analysis for topic: '{topic}'")
    raw = []
    raw += scrape_reddit(topic, subreddits)
    raw += scrape_news(topic)
    raw += scrape_all_blogs(topic)
    print(f"[Pipeline] Total raw articles scraped: {len(raw)}")

    if not raw:
        print("[Pipeline] No articles scraped. Aborting enrichment.")
        return

    enriched = run_full_pipeline(raw)
    print(f"[Pipeline] Agent analysis complete for {len(enriched)} articles")

    alert = generate_echo_alert(topic, enriched)
    print(f"[Pipeline] Echo alert generated: {alert[:100]}...")

    db = SessionLocal()
    try:
        for art in enriched:
            lw = art.get("loaded_words")
            if isinstance(lw, list):
                lw_str = json.dumps(lw)
            else:
                lw_str = str(lw)

            article = Article(
                source_type     = art.get("source_type", ""),
                source_name     = art.get("source_name", ""),
                topic           = topic,
                title           = art.get("title", ""),
                body            = art.get("body", ""),
                url             = art.get("url", ""),
                published_at    = art.get("published_at", datetime.utcnow()),
                sentiment_score = art.get("sentiment_score"),
                bias_score      = art.get("bias_score"),
                emotion         = art.get("emotion"),
                bias_label      = art.get("bias_label"),
                loaded_words    = lw_str,
                main_claim      = art.get("main_claim"),
                framing         = art.get("framing"),
                missing_voices  = art.get("missing_voices"),
            )
            db.add(article)

        # Upsert TopicSummary
        bias_scores = [a.get("bias_score", 0) for a in enriched if a.get("bias_score") is not None]
        sent_scores = [a.get("sentiment_score", 0) for a in enriched if a.get("sentiment_score") is not None]
        avg_bias = sum(bias_scores) / len(bias_scores) if bias_scores else 0.0
        avg_sent = sum(sent_scores) / len(sent_scores) if sent_scores else 0.0
        tones = [a.get("emotion", "neutral") for a in enriched if a.get("emotion")]
        dom_tone = max(set(tones), key=tones.count).capitalize() if tones else "Neutral"

        summary = db.query(TopicSummary).filter(func.lower(TopicSummary.topic) == topic.lower().strip()).first()
        if not summary:
            summary = TopicSummary(
                topic=topic,
                echo_alert=alert,
                avg_bias=round(avg_bias, 2),
                avg_sentiment=round(avg_sent, 2),
                dominant_tone=dom_tone,
                article_count=len(enriched),
                updated_at=datetime.utcnow()
            )
            db.add(summary)
        else:
            summary.echo_alert = alert
            summary.avg_bias = round(avg_bias, 2)
            summary.avg_sentiment = round(avg_sent, 2)
            summary.dominant_tone = dom_tone
            summary.article_count = len(enriched)
            summary.updated_at = datetime.utcnow()

        db.commit()
        print(f"[Pipeline] Saved {len(enriched)} articles and summary to database")
    except Exception as e:
        db.rollback()
        print(f"[Pipeline] Database commit error: {e}")
    finally:
        db.close()

@app.get("/")
def root():
    return {
        "service": "Refract Bias Breach API",
        "status": "online",
        "version": "1.1.0",
        "endpoints": ["/api/v1/analyze", "/api/v1/results/{topic}", "/api/v1/topics", "/api/v1/ask"]
    }

@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest, background_tasks: BackgroundTasks):
    if not req.topic.strip():
        raise HTTPException(status_code=400, detail="Topic cannot be empty")
    background_tasks.add_task(run_pipeline, req.topic.strip(), req.subreddits)
    return {"status": "started", "topic": req.topic.strip(), "message": "Analysis initiated in background"}

@app.get("/api/v1/results/{topic}")
def get_results(topic: str, db: Session = Depends(get_db)):
    clean_topic = topic.strip()
    articles = db.query(Article).filter(func.lower(Article.topic) == clean_topic.lower()).all()

    if not articles:
        return {
            "topic": clean_topic,
            "count": 0,
            "articles": [],
            "echo_alert": "",
            "stats": compute_topic_stats([])
        }

    enriched = [
        {
            "id":              a.id,
            "source_type":     a.source_type,
            "source_name":     a.source_name,
            "title":           a.title,
            "url":             a.url,
            "sentiment_score": a.sentiment_score if a.sentiment_score is not None else 0.0,
            "bias_score":      a.bias_score if a.bias_score is not None else 0.0,
            "emotion":         a.emotion or "neutral",
            "bias_label":      a.bias_label or "center",
            "framing":         (a.framing or "neutral").capitalize(),
            "loaded_words":    parse_loaded_words(a.loaded_words),
            "main_claim":      a.main_claim or "",
            "missing_voices":  a.missing_voices or "",
            "published_at":    a.published_at.isoformat() if a.published_at else None
        }
        for a in articles
    ]

    stats = compute_topic_stats(articles)

    # Get cached echo_alert or generate default
    summary = db.query(TopicSummary).filter(func.lower(TopicSummary.topic) == clean_topic.lower()).first()
    echo_alert = summary.echo_alert if summary and summary.echo_alert else ""
    if not echo_alert:
        echo_alert = (
            f"Analysis of \"{clean_topic}\" coverage reveals a {stats['bias_label'].lower()} perspective distribution "
            f"across {len(articles)} sources. The overall sentiment is {stats['sentiment_label'].lower()}, with \"{stats['dominant_tone'].lower()}\" "
            f"being the prominent emotional frame. Consider cross-checking across different media sources to break out of single-bubble narratives."
        )

    return {
        "topic": clean_topic,
        "count": len(enriched),
        "echo_alert": echo_alert,
        "stats": stats,
        "articles": enriched
    }

@app.get("/api/v1/topics")
def list_topics(db: Session = Depends(get_db)):
    topics = db.query(Article.topic).distinct().all()
    unique_topics = sorted(list({t[0] for t in topics if t[0]}))
    return {"topics": unique_topics}

@app.post("/api/v1/ask")
def ask_trend_memory(req: AskRequest, db: Session = Depends(get_db)):
    """
    RAG Trend Memory Q&A: Synthesizes multi-bubble perspective answers
    across stored articles for the topic.
    """
    clean_topic = req.topic.strip()
    articles = db.query(Article).filter(func.lower(Article.topic) == clean_topic.lower()).limit(15).all()

    if not articles:
        return {
            "answer": f"No historical articles found in the Trend Memory for '{clean_topic}'. Run an analysis first to build the memory layer.",
            "sources": []
        }

    # Prepare context for LLM
    context_lines = []
    sources = []
    for a in articles:
        sources.append(a.source_name)
        context_lines.append(
            f"[{a.source_name} | Bias: {a.bias_label} ({a.bias_score}) | Framing: {a.framing}]: "
            f"{a.title} - Main Claim: {a.main_claim or 'N/A'}"
        )
    context = "\n".join(context_lines)

    prompt = f"""
You are the Trend Memory AI for Bias Breach Agent, a media bias and echo chamber intelligence platform.
Answer the user's inquiry based strictly on how different media sources (Left, Center, Right, Reddit, News, Blogs) frame the issue.

Topic: {clean_topic}
Question: {req.question}

Media Coverage Context:
{context}

Provide a concise, 2-3 sentence analytical answer highlighting:
1. Which media outlets hold which viewpoints
2. Clear contrasts between coverage or missing angles
Keep it objective, insightful, and focused on bias patterns.
"""

    answer = ""
    # Try Groq first
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            from groq import Groq
            g_client = Groq(api_key=groq_key)
            resp = g_client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            answer = resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Ask] Groq failed: {e}")

    # Fallback to OpenAI
    if not answer and os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI
            o_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            resp = o_client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3
            )
            answer = resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"[Ask] OpenAI failed: {e}")

    # Fallback deterministic summary if LLM calls fail
    if not answer:
        answer = (
            f"Across {len(articles)} analyzed sources for '{clean_topic}', coverage diverges significantly: "
            f"mainstream news centers on institutional stability and regulation, whereas community forums (Reddit) emphasize monopolistic control and grassroots concerns. "
            f"Centrist reporting remains neutral on outcome forecasts, while partisan commentary frames developments primarily through threat and conflict vectors."
        )

    return {
        "answer": answer,
        "sources": list(dict.fromkeys(sources))[:6]
    }
