# backend/scrapers/blog_scraper.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; Refract/1.0)"}

BLOG_SOURCES = {
    "TechCrunch": "https://techcrunch.com/search/{topic}",
    "TheVerge":   "https://www.theverge.com/search?q={topic}",
}

def scrape_blog(topic: str, blog_name: str, url_template: str) -> list[dict]:
    url = url_template.format(topic=topic.replace(" ", "+"))
    articles = []
    try:
        resp = requests.get(url, headers=HEADERS, timeout=10)
        soup = BeautifulSoup(resp.text, "html.parser")
        links = [a["href"] for a in soup.find_all("a", href=True)
                 if a["href"].startswith("http")][:10]

        for href in links:
            try:
                art_resp = requests.get(href, headers=HEADERS, timeout=8)
                art_soup = BeautifulSoup(art_resp.text, "html.parser")
                title = art_soup.find("h1")
                paras = art_soup.find_all("p")[:10]
                if not title:
                    continue
                articles.append({
                    "source_type": "blog",
                    "source_name": blog_name,
                    "topic": topic,
                    "title": title.get_text(strip=True),
                    "body": " ".join(p.get_text(strip=True) for p in paras)[:2000],
                    "url": href,
                    "published_at": datetime.utcnow()
                })
            except Exception:
                continue
    except Exception as e:
        print(f"Blog scrape failed for {blog_name}: {e}")
    return articles

def scrape_all_blogs(topic: str) -> list[dict]:
    results = []
    for name, url_tmpl in BLOG_SOURCES.items():
        results.extend(scrape_blog(topic, name, url_tmpl))
    return results