# backend/scrapers/blog_scraper.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime

BLOG_SOURCES = {
    'TechCrunch': 'https://techcrunch.com/search/{topic}',
    'TheVerge':   'https://www.theverge.com/search?q={topic}',
    'Wired':      'https://www.wired.com/search/?q={topic}',
}

HEADERS = {'User-Agent': 'Mozilla/5.0 (compatible; Refract/1.0)'}

def scrape_blog(topic: str, blog_name: str, url_template: str) -> list[dict]:
    url = url_template.format(topic=topic.replace(' ', '+'))
    resp = requests.get(url, headers=HEADERS, timeout=10)
    soup = BeautifulSoup(resp.text, 'html.parser')

    articles = []
    for link in soup.find_all('a', href=True)[:15]:
        href = link.get('href', '')
        if not href.startswith('http'):
            continue
        try:
            art_resp = requests.get(href, headers=HEADERS, timeout=8)
            art_soup = BeautifulSoup(art_resp.text, 'html.parser')
            title = art_soup.find('h1')
            body_tags = art_soup.find_all('p')[:10]
            if not title: continue
            articles.append({
                'source_type': 'blog',
                'source_name': blog_name,
                'topic': topic,
                'title': title.get_text(strip=True),
                'body': ' '.join(t.get_text(strip=True) for t in body_tags)[:2000],
                'url': href,
                'published_at': datetime.utcnow()
            })
        except Exception:
            continue
    return articles

def scrape_all_blogs(topic: str) -> list[dict]:
    results = []
    for name, url_tmpl in BLOG_SOURCES.items():
        results.extend(scrape_blog(topic, name, url_tmpl))
    return results