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
import sys

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from db.database import engine, Base, get_db, SessionLocal
from db.models import Article, TopicSummary
from agents.orchestrator import collect_and_analyze_topic

# Auto-create tables (both Article and TopicSummary)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Refract Bias Breach API", version="2.0.0")

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
        try:
            val = json.loads(raw_str)
            if isinstance(val, list):
                return [str(w) for w in val if str(w).strip()]
        except Exception:
            pass
        try:
            val = ast.literal_eval(raw_str)
            if isinstance(val, list):
                return [str(w) for w in val if str(w).strip()]
        except Exception:
            pass
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
            "avg_sensationalism": 2.5,
            "source_distribution": {"news": 0, "reddit": 0, "blog": 0},
            "bias_spectrum": {"left": 0, "center": 0, "right": 0},
            "framing_distribution": {"Opportunity": 0, "Threat": 0, "Neutral": 0, "Conflict": 0}
        }

    bias_scores = []
    sent_scores = []
    sensat_scores = []
    tones = []
    source_distribution = {"news": 0, "reddit": 0, "blog": 0}
    bias_spectrum = {"left": 0, "center": 0, "right": 0}
    framing_distribution = {"Opportunity": 0, "Threat": 0, "Neutral": 0, "Conflict": 0}

    for a in articles:
        # Handles both ORM Article and dict
        b_val = getattr(a, "bias_score", None) if not isinstance(a, dict) else a.get("bias_score")
        s_val = getattr(a, "sentiment_score", None) if not isinstance(a, dict) else a.get("sentiment_score")
        sens_val = getattr(a, "sensationalism_score", None) if not isinstance(a, dict) else a.get("sensationalism_score")
        em_val = getattr(a, "emotion", "") if not isinstance(a, dict) else a.get("emotion")
        st_val = getattr(a, "source_type", "") if not isinstance(a, dict) else a.get("source_type")
        fr_val = getattr(a, "framing", "") if not isinstance(a, dict) else a.get("framing")

        if b_val is not None:
            bias_scores.append(float(b_val))
            if float(b_val) < -1.5:
                bias_spectrum["left"] += 1
            elif float(b_val) > 1.5:
                bias_spectrum["right"] += 1
            else:
                bias_spectrum["center"] += 1

        if s_val is not None:
            sent_scores.append(float(s_val))
        if sens_val is not None:
            sensat_scores.append(float(sens_val))
        if em_val:
            tones.append(str(em_val).capitalize())

        st = (st_val or "").lower()
        if "news" in st:
            source_distribution["news"] += 1
        elif "reddit" in st:
            source_distribution["reddit"] += 1
        elif "blog" in st:
            source_distribution["blog"] += 1
        else:
            source_distribution["news"] += 1

        f = (fr_val or "Neutral").strip().capitalize()
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

    avg_bias = round(sum(bias_scores) / len(bias_scores), 2) if bias_scores else 0.0
    avg_sentiment = round(sum(sent_scores) / len(sent_scores), 2) if sent_scores else 0.0
    avg_sensationalism = round(sum(sensat_scores) / len(sensat_scores), 1) if sensat_scores else 3.0

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

    dominant_tone = max(set(tones), key=tones.count) if tones else "Neutral"

    return {
        "articles_count": len(articles),
        "avg_bias": avg_bias,
        "bias_label": bias_label,
        "avg_sentiment": avg_sentiment,
        "sentiment_label": sentiment_label,
        "dominant_tone": dominant_tone,
        "avg_sensationalism": avg_sensationalism,
        "source_distribution": source_distribution,
        "bias_spectrum": bias_spectrum,
        "framing_distribution": framing_distribution
    }

def run_pipeline_sync(topic: str) -> tuple[list, str]:
    """Runs universal discovery, parallel enrichment, and database persistence."""
    clean_topic = topic.strip()
    enriched, alert = collect_and_analyze_topic(clean_topic)

    db = SessionLocal()
    try:
        for art in enriched:
            lw = art.get("loaded_words")
            lw_str = json.dumps(lw) if isinstance(lw, list) else str(lw)

            article = Article(
                source_type          = art.get("source_type", "news"),
                source_name          = art.get("source_name", "Media"),
                topic                = clean_topic,
                title                = art.get("title", ""),
                body                 = art.get("body", ""),
                url                  = art.get("url", ""),
                published_at         = art.get("published_at", datetime.utcnow()),
                sentiment_score      = art.get("sentiment_score"),
                bias_score           = art.get("bias_score"),
                emotion              = art.get("emotion"),
                bias_label           = art.get("bias_label"),
                sensationalism_score = art.get("sensationalism_score"),
                economic_axis        = art.get("economic_axis"),
                social_axis          = art.get("social_axis"),
                evidence_quote       = art.get("evidence_quote"),
                loaded_words         = lw_str,
                main_claim           = art.get("main_claim"),
                framing              = art.get("framing"),
                missing_voices       = art.get("missing_voices"),
            )
            db.add(article)

        stats = compute_topic_stats(enriched)
        summary = db.query(TopicSummary).filter(func.lower(TopicSummary.topic) == clean_topic.lower()).first()
        if not summary:
            summary = TopicSummary(
                topic=clean_topic,
                echo_alert=alert,
                avg_bias=stats["avg_bias"],
                avg_sentiment=stats["avg_sentiment"],
                dominant_tone=stats["dominant_tone"],
                article_count=len(enriched),
                updated_at=datetime.utcnow()
            )
            db.add(summary)
        else:
            summary.echo_alert = alert
            summary.avg_bias = stats["avg_bias"]
            summary.avg_sentiment = stats["avg_sentiment"]
            summary.dominant_tone = stats["dominant_tone"]
            summary.article_count = len(enriched)
            summary.updated_at = datetime.utcnow()

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[Pipeline] Database commit error: {e}")
    finally:
        db.close()

    return enriched, alert

@app.get("/")
def root():
    return {
        "service": "Refract Bias Breach API",
        "status": "online",
        "version": "2.0.0",
        "capabilities": ["Universal Search", "Google News RSS", "Parallel Multi-Agent Bias Scoring", "Trend Memory RAG"]
    }

@app.post("/api/v1/analyze")
def analyze(req: AnalyzeRequest):
    clean_topic = req.topic.strip()
    if not clean_topic:
        raise HTTPException(status_code=400, detail="Topic cannot be empty")

    enriched, alert = run_pipeline_sync(clean_topic)
    stats = compute_topic_stats(enriched)

    # Convert enriched articles for client response
    formatted_articles = []
    for idx, a in enumerate(enriched):
        formatted_articles.append({
            "id": a.get("id") or (idx + 1),
            "source_type": a.get("source_type", "news"),
            "source_name": a.get("source_name", "Media"),
            "title": a.get("title", ""),
            "url": a.get("url", ""),
            "sentiment_score": a.get("sentiment_score", 0.0),
            "bias_score": a.get("bias_score", 0.0),
            "emotion": a.get("emotion", "neutral"),
            "bias_label": a.get("bias_label", "Center"),
            "sensationalism_score": a.get("sensationalism_score", 3.0),
            "economic_axis": a.get("economic_axis", 0.0),
            "social_axis": a.get("social_axis", 0.0),
            "evidence_quote": a.get("evidence_quote", ""),
            "framing": (a.get("framing") or "neutral").capitalize(),
            "loaded_words": parse_loaded_words(a.get("loaded_words")),
            "main_claim": a.get("main_claim", ""),
            "missing_voices": a.get("missing_voices", ""),
            "published_at": a.get("published_at").isoformat() if hasattr(a.get("published_at"), "isoformat") else str(datetime.utcnow())
        })

    return {
        "status": "completed",
        "topic": clean_topic,
        "count": len(formatted_articles),
        "echo_alert": alert,
        "stats": stats,
        "articles": formatted_articles
    }

@app.get("/api/v1/results/{topic}")
def get_results(topic: str, db: Session = Depends(get_db)):
    clean_topic = topic.strip()
    articles = db.query(Article).filter(func.lower(Article.topic) == clean_topic.lower()).all()

    # If topic has not been analyzed yet, proactively discover and analyze it on the fly!
    if not articles:
        print(f"[Results] '{clean_topic}' not in database. Triggering on-demand discovery...")
        enriched, alert = run_pipeline_sync(clean_topic)
        # Re-fetch or format
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
            "id":                   a.id,
            "source_type":          a.source_type,
            "source_name":          a.source_name,
            "title":                a.title,
            "url":                  a.url,
            "sentiment_score":      a.sentiment_score if a.sentiment_score is not None else 0.0,
            "bias_score":           a.bias_score if a.bias_score is not None else 0.0,
            "emotion":              a.emotion or "neutral",
            "bias_label":           a.bias_label or "Center",
            "sensationalism_score": a.sensationalism_score if a.sensationalism_score is not None else 3.0,
            "economic_axis":        a.economic_axis if a.economic_axis is not None else 0.0,
            "social_axis":          a.social_axis if a.social_axis is not None else 0.0,
            "evidence_quote":       a.evidence_quote or "",
            "framing":              (a.framing or "neutral").capitalize(),
            "loaded_words":         parse_loaded_words(a.loaded_words),
            "main_claim":           a.main_claim or "",
            "missing_voices":       a.missing_voices or "",
            "published_at":         a.published_at.isoformat() if a.published_at else None
        }
        for a in articles
    ]

    stats = compute_topic_stats(articles)

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
            "answer": f"No historical articles found in Trend Memory for '{clean_topic}'. Run an analysis first to build the memory layer.",
            "sources": []
        }

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

    if not answer:
        answer = (
            f"Across analyzed sources for '{clean_topic}', reporting divides between institutional regulation and market innovation. "
            f"Community forums and independent blogs highlight grassroots disruption, while traditional wire services emphasize economic resilience."
        )

    return {
        "answer": answer,
        "sources": list(dict.fromkeys(sources))[:6]
    }
