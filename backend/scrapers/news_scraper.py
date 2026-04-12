# backend/scrapers/news_scraper.py
from newsapi import NewsApiClient
import os

newsapi = NewsApiClient(api_key=os.getenv('NEWSAPI_KEY') or os.getenv('NEWS_API_KEY'))

def scrape_news(topic: str, sources: list[str] = None, limit: int = 20) -> list[dict]:
    resp = newsapi.get_everything(
        q=topic,
        sources=','.join(sources) if sources else None,
        language='en',
        sort_by='publishedAt',
        page_size=limit
    )
    articles = []
    for art in resp.get('articles', []):
        articles.append({
            'source_type': 'news',
            'source_name': art['source']['name'],
            'topic': topic,
            'title': art['title'],
            'body': art.get('content') or art.get('description') or '',
            'url': art['url'],
            'published_at': art['publishedAt']
        })
    return articles
