# backend/scrapers/reddit_scraper.py
import requests
from datetime import datetime

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; Refract/1.0)'}

def scrape_reddit(topic: str, subreddits: list[str], limit: int = 20) -> list[dict]:
    articles = []
    for sub in subreddits:
        url = f"https://www.reddit.com/r/{sub}/search.json?q={topic}&sort=hot&limit={limit}"
        try:
            resp = requests.get(url, headers=HEADERS, timeout=10)
            data = resp.json()
            posts = data.get('data', {}).get('children', [])
            for post in posts:
                p = post['data']
                articles.append({
                    'source_type': 'reddit',
                    'source_name': f"r/{sub}",
                    'topic': topic,
                    'title': p.get('title', ''),
                    'body': p.get('selftext', '') or p.get('title', ''),
                    'url': f"https://reddit.com{p.get('permalink', '')}",
                    'published_at': datetime.utcfromtimestamp(p.get('created_utc', 0))
                })
        except Exception as e:
            print(f"Reddit scrape failed for r/{sub}: {e}")
            continue
    return articles