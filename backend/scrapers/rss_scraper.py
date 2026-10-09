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

def calculate_relevance(topic: str, title: str, body: str) -> float:
    """Calculates relevance score of an article to the search topic."""
    noise_words = {"the", "and", "for", "with", "about", "from", "this", "that", "into", "over", "news", "today"}
    keywords = [w.lower() for w in topic.split() if len(w) >= 3 and w.lower() not in noise_words]
    if not keywords:
        return 1.0

    title_lower = title.lower()
    full_text = f"{title} {body}".lower()

    # Exact topic phrase in title is gold standard
    if topic.lower() in title_lower:
        return 20.0

    title_matches = sum(1 for kw in keywords if kw in title_lower)
    body_matches = sum(1 for kw in keywords if kw in full_text)

    if len(keywords) == 1:
        if keywords[0] in title_lower:
            return 15.0
        elif keywords[0] in full_text:
            return 8.0
        return 0.0

    # Multi-keyword topic
    if title_matches >= 1:
        return (title_matches * 4.0) + (body_matches * 1.0)
    elif body_matches >= 2:
        return body_matches * 1.5

    return 0.0

def scrape_google_news_rss(topic: str, limit: int = 12) -> list[dict]:
    """
    Scrapes live Google News RSS feed with strict keyword relevance filtering.
    Only articles verified to discuss the target topic are returned.
    """
    clean_topic = topic.strip()
    encoded_topic = urllib.parse.quote(clean_topic)
    url = f"https://news.google.com/rss/search?q={encoded_topic}&hl=en-US&gl=US&ceid=US:en"
    candidates = []

    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code != 200:
            print(f"[RSS Scraper] Google News returned status {resp.status_code}")
            return []

        root = ET.fromstring(resp.content)
        items = root.findall(".//item")

        for item in items[:30]:
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
            body_text = clean_desc if len(clean_desc) > 30 else clean_title

            # Calculate relevance score
            relevance = calculate_relevance(clean_topic, clean_title, body_text)
            if relevance <= 0.0:
                continue

            # Parse date
            pub_date = datetime.utcnow()
            if pub_date_str:
                try:
                    pub_date = datetime.strptime(pub_date_str[:25], "%a, %d %b %Y %H:%M:%S")
                except Exception:
                    pass

            candidates.append({
                "_relevance": relevance,
                "source_type": "news",
                "source_name": source_name,
                "topic": clean_topic,
                "title": clean_title,
                "body": body_text,
                "url": link,
                "published_at": pub_date
            })

    except Exception as e:
        print(f"[RSS Scraper] Error scraping Google News RSS for '{topic}': {e}")

    # Sort candidates by relevance descending and strip internal relevance flag
    candidates.sort(key=lambda x: x["_relevance"], reverse=True)
    return [{k: v for k, v in c.items() if k != "_relevance"} for c in candidates[:limit]]

