import os
import json
from datetime import datetime
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

RESEARCH_PROMPT = """
You are a senior media intelligence researcher.
A user wants to analyze media coverage on the topic: "{topic}".
Generate 8 diverse, realistic media articles representing how DIFFERENT media bubbles currently frame this topic.

Include perspectives from:
1. Left / Progressive outlets (e.g. MSNBC, The Guardian, Vox, Mother Jones)
2. Centrist / Wire outlets (e.g. Reuters, Associated Press, BBC News, The Hill)
3. Right / Conservative outlets (e.g. Fox News, National Review, The Wall Street Journal Editorial, Washington Examiner)
4. Community & Tech sources (e.g. r/technology, r/politics, TechCrunch, Hacker News)

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "source_type": "news" | "reddit" | "blog",
    "source_name": "BBC News",
    "title": "Clear headline with source framing",
    "body": "2-3 sentences summarizing the article argument, quotes, and framing",
    "url": "https://example.com/article-url"
  }
]
"""

def research_topic_articles(topic: str) -> list[dict]:
    """
    AI Autonomous News Discovery: Synthesizes a representative, multi-bubble
    set of articles across the political spectrum for any novel topic.
    """
    groq_key = os.getenv("GROQ_API_KEY")
    if not groq_key:
        return []

    try:
        from groq import Groq
        client = Groq(api_key=groq_key)
        resp = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": "You are an objective media research tool. Output ONLY valid JSON array."},
                {"role": "user", "content": RESEARCH_PROMPT.format(topic=topic)}
            ],
            temperature=0.3
        )
        content = resp.choices[0].message.content.strip()
        start = content.find("[")
        end = content.rfind("]") + 1
        if start != -1 and end > start:
            raw_articles = json.loads(content[start:end])
            now = datetime.utcnow()
            results = []
            for item in raw_articles:
                results.append({
                    "source_type": item.get("source_type", "news"),
                    "source_name": item.get("source_name", "Media Outlet"),
                    "topic": topic,
                    "title": item.get("title", ""),
                    "body": item.get("body", ""),
                    "url": item.get("url", "https://news.google.com"),
                    "published_at": now
                })
            return results
    except Exception as e:
        print(f"[AI Researcher] Discovery failed: {e}")

    return []
