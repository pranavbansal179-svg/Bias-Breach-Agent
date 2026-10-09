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
    
    # Generic landing page titles and categories to ignore
    ignore_titles = {
        "tech", "reviews", "science", "entertainment", "ai", "policy", "amazon", "apple",
        "facebook", "google", "startups", "venture", "security", "crypto", "apps",
        "techcrunch disrupt 2026", "disrupt 2026", "events", "sponsor", "author"
    }

    noise_words = {"the", "and", "for", "with", "about", "from", "this", "that", "into", "over"}
    keywords = [w.lower() for w in topic.split() if len(w) >= 3 and w.lower() not in noise_words]

    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        soup = BeautifulSoup(resp.text, "html.parser")
        links = [a["href"] for a in soup.find_all("a", href=True)
                 if a["href"].startswith("http")][:10]

        for href in links:
            # Skip authors, events, category landing links
            if any(p in href.lower() for p in ["/author/", "/events/", "/category/", "/tag/", "/exhibit", "/promo"]):
                continue

            try:
                art_resp = requests.get(href, headers=HEADERS, timeout=6)
                art_soup = BeautifulSoup(art_resp.text, "html.parser")
                title_elem = art_soup.find("h1")
                if not title_elem:
                    continue

                clean_title = title_elem.get_text(strip=True)
                if not clean_title or clean_title.lower() in ignore_titles:
                    continue

                paras = art_soup.find_all("p")[:8]
                body_text = " ".join(p.get_text(strip=True) for p in paras)[:1500]

                # Verify keyword relevance
                full_text = f"{clean_title} {body_text}".lower()
                has_match = False
                if not keywords:
                    has_match = True
                elif len(keywords) == 1:
                    has_match = keywords[0] in full_text
                else:
                    title_has_kw = any(kw in clean_title.lower() for kw in keywords)
                    body_matches = sum(1 for kw in keywords if kw in full_text)
                    has_match = title_has_kw or body_matches >= 2

                if not has_match:
                    continue

                articles.append({
                    "source_type": "blog",
                    "source_name": blog_name,
                    "topic": topic,
                    "title": clean_title,
                    "body": body_text if len(body_text) > 40 else clean_title,
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