import requests
import xml.etree.ElementTree as ET
import urllib.parse
from datetime import datetime
import re

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
}

def clean_html(raw_html: str) -> str:
    """Strip HTML tags from description."""
    if not raw_html:
        return ""
    clean = re.sub(r"<[^>]+>", " ", raw_html)
    return " ".join(clean.split())

def scrape_google_news_rss(topic: str, limit: int = 12) -> list[dict]:
    """
    Scrapes live Google News RSS feed for any topic.
    Returns structured articles with source attribution, titles, URLs, and descriptions.
    Zero API key required; highly reliable across global news outlets.
    """
    encoded_topic = urllib.parse.quote(topic.strip())
    url = f"https://news.google.com/rss/search?q={encoded_topic}&hl=en-US&gl=US&ceid=US:en"
    articles = []

    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code != 200:
            print(f"[RSS Scraper] Google News returned status {resp.status_code}")
            return []

        root = ET.fromstring(resp.content)
        items = root.findall(".//item")

        for item in items[:limit]:
            raw_title = item.findtext("title", "").strip()
            link = item.findtext("link", "").strip()
            pub_date_str = item.findtext("pubDate", "")
            raw_desc = item.findtext("description", "")
            source_elem = item.find("source")

            # Extract source name
            source_name = ""
            if source_elem is not None and source_elem.text:
                source_name = source_elem.text.strip()
            elif " - " in raw_title:
                parts = raw_title.rsplit(" - ", 1)
                source_name = parts[1].strip()
                raw_title = parts[0].strip()

            if not source_name:
                source_name = "Global News"

            # Clean headline title
            clean_title = raw_title
            if " - " in clean_title and not source_elem:
                clean_title = clean_title.rsplit(" - ", 1)[0].strip()

            clean_desc = clean_html(raw_desc)

            # Parse date
            pub_date = datetime.utcnow()
            if pub_date_str:
                try:
                    # e.g., 'Fri, 10 Apr 2026 14:30:00 GMT'
                    pub_date = datetime.strptime(pub_date_str[:25], "%a, %d %b %Y %H:%M:%S")
                except Exception:
                    pass

            articles.append({
                "source_type": "news",
                "source_name": source_name,
                "topic": topic,
                "title": clean_title,
                "body": clean_desc if len(clean_desc) > 30 else clean_title,
                "url": link,
                "published_at": pub_date
            })

    except Exception as e:
        print(f"[RSS Scraper] Error scraping Google News RSS for '{topic}': {e}")

    return articles
