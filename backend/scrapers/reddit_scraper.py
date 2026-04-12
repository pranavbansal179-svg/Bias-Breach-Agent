# backend/scrapers/reddit_scraper.py
import praw, os
from datetime import datetime

reddit = praw.Reddit(
    client_id=os.getenv('REDDIT_CLIENT_ID'),
    client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
    user_agent=os.getenv('REDDIT_USER_AGENT', 'BiasBreach/1.0 (Media Bias Analysis Agent)')
)

def scrape_reddit(topic: str, subreddits: list[str], limit: int = 20) -> list[dict]:
    articles = []
    for sub in subreddits:
        for post in reddit.subreddit(sub).search(topic, limit=limit, sort='hot'):
            articles.append({
                'source_type': 'reddit',
                'source_name': f'r/{sub}',
                'topic': topic,
                'title': post.title,
                'body': post.selftext[:2000] or post.title,
                'url': f'https://reddit.com{post.permalink}',
                'published_at': datetime.utcfromtimestamp(post.created_utc)
            })
    return articles
