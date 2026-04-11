# backend/scrapers/news_scraper.py
from newsapi import NewsApiClient
from dotenv import load_dotenv
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

newsapi = NewsApiClient(api_key=os.getenv("NEWS_API_KEY"))

def scrape_news(topic: str, limit: int = 20) -> list[dict]:
    articles = []
    try:
        resp = newsapi.get_everything(
            q=topic,
            language="en",
            sort_by="publishedAt",
            page_size=limit
        )
        for art in resp.get("articles", []):
            articles.append({
                "source_type": "news",
                "source_name": art["source"]["name"],
                "topic": topic,
                "title": art.get("title", ""),
                "body": art.get("content") or art.get("description") or "",
                "url": art.get("url", ""),
                "published_at": datetime.strptime(
                    art["publishedAt"], "%Y-%m-%dT%H:%M:%SZ"
                ) if art.get("publishedAt") else datetime.utcnow()
            })
    except Exception as e:
        print(f"News scrape failed: {e}")
    return articles