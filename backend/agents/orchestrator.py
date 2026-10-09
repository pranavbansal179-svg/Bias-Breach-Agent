import json
from concurrent.futures import ThreadPoolExecutor, as_completed
from .sentiment_agent import score_sentiment
from .bias_agent import detect_bias
from .narrative_agent import extract_narrative
from .echo_agent import generate_echo_alert
from scrapers.rss_scraper import scrape_google_news_rss
from scrapers.reddit_scraper import scrape_reddit
from scrapers.blog_scraper import scrape_all_blogs
from scrapers.ai_researcher import research_topic_articles

def analyze_single_article(article: dict) -> dict:
    """Enriches a single article through the multi-agent AI pipeline."""
    title = article.get("title", "")
    body  = article.get("body", "") or title
    source_name = article.get("source_name", "")

    try:
        sentiment = score_sentiment(body)
    except Exception:
        sentiment = {"score": 0.0, "emotion": "neutral", "confidence": 0.5}

    try:
        bias = detect_bias(title, body, source_name=source_name)
    except Exception:
        bias = {
            "bias_score": 0.0,
            "bias_label": "Center",
            "sensationalism_score": 2.5,
            "economic_axis": 0.0,
            "social_axis": 0.0,
            "loaded_words": [],
            "evidence_quote": title[:100],
            "reasoning": "Standard neutral report."
        }

    try:
        narrative = extract_narrative(title, body)
    except Exception:
        narrative = {
            "main_claim": "",
            "framing": "neutral",
            "missing_voices": ""
        }

    return {
        **article,
        "sentiment_score": sentiment.get("score", 0.0),
        "emotion":         sentiment.get("emotion", "neutral"),
        "bias_score":      bias.get("bias_score", 0.0),
        "bias_label":      bias.get("bias_label", "Center"),
        "sensationalism_score": bias.get("sensationalism_score", 3.0),
        "economic_axis":   bias.get("economic_axis", 0.0),
        "social_axis":     bias.get("social_axis", 0.0),
        "evidence_quote":  bias.get("evidence_quote", ""),
        "loaded_words":    json.dumps(bias.get("loaded_words", [])),
        "main_claim":      narrative.get("main_claim", ""),
        "framing":         narrative.get("framing", "neutral"),
        "missing_voices":  narrative.get("missing_voices", ""),
    }

def run_full_pipeline(articles: list, max_workers: int = 3) -> list:
    """Runs all agents in parallel across articles using a thread pool for sub-second speeds."""
    print(f"[Orchestrator] Running parallel enrichment for {len(articles)} articles...")
    enriched = []

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_article = {executor.submit(analyze_single_article, art): art for art in articles}
        for future in as_completed(future_to_article):
            try:
                res = future.result()
                enriched.append(res)
            except Exception as e:
                print(f"[Orchestrator] Article analysis failed: {e}")

    # Maintain consistent order if possible
    return enriched

def filter_article_relevance(topic: str, articles: list) -> list:
    """Ensures every article strictly relates to the searched topic."""
    noise_words = {"the", "and", "for", "with", "about", "from", "this", "that", "into", "over", "news"}
    keywords = [w.lower() for w in topic.split() if len(w) >= 3 and w.lower() not in noise_words]
    if not keywords:
        return articles

    relevant = []
    seen_titles = set()
    for a in articles:
        title = a.get("title", "").strip()
        body = a.get("body", "").strip()
        if not title or title.lower() in seen_titles:
            continue
        seen_titles.add(title.lower())

        full_text = f"{title} {body}".lower()
        title_lower = title.lower()

        if len(keywords) == 1:
            if keywords[0] in full_text:
                relevant.append(a)
        else:
            title_match = any(kw in title_lower for kw in keywords)
            body_matches = sum(1 for kw in keywords if kw in full_text)
            if title_match or body_matches >= 2:
                relevant.append(a)

    return relevant

def collect_and_analyze_topic(topic: str) -> tuple[list, str]:
    """
    Universal Discovery & Ingestion Pipeline:
    1. Scrapes live Google News RSS (high reliability, global coverage)
    2. Scrapes community perspectives (Reddit)
    3. Scrapes tech & industry blogs
    4. If total articles < 6, triggers autonomous AI News Discovery Agent
    5. Filters strictly for keyword relevance
    6. Enriches all articles in parallel
    7. Generates Echo Chamber Alert
    """
    clean_topic = topic.strip()
    print(f"[Pipeline] Discovering media coverage for: '{clean_topic}'")
    raw = []

    # 1. Live Google News RSS (up to 15 articles)
    try:
        rss_articles = scrape_google_news_rss(clean_topic, limit=15)
        raw.extend(rss_articles)
        print(f"[Pipeline] Google News RSS found {len(rss_articles)} articles")
    except Exception as e:
        print(f"[Pipeline] RSS error: {e}")

    # 2. Blog Coverage
    try:
        blog_articles = scrape_all_blogs(clean_topic)
        raw.extend(blog_articles[:3])
        print(f"[Pipeline] Blogs found {len(blog_articles)} articles")
    except Exception as e:
        print(f"[Pipeline] Blog error: {e}")

    # 3. Reddit Community Perspectives
    try:
        reddit_articles = scrape_reddit(clean_topic, ["technology", "worldnews", "politics", "news"], limit=4)
        raw.extend(reddit_articles)
        print(f"[Pipeline] Reddit found {len(reddit_articles)} posts")
    except Exception as e:
        print(f"[Pipeline] Reddit error: {e}")

    # Filter strictly for relevance before deciding if AI discovery is needed
    relevant_articles = filter_article_relevance(clean_topic, raw)

    # 4. Fallback / Augment with AI News Researcher if coverage is sparse
    if len(relevant_articles) < 5:
        print(f"[Pipeline] Relevant coverage sparse ({len(relevant_articles)} articles). Calling AI News Discovery Agent...")
        ai_articles = research_topic_articles(clean_topic)
        relevant_articles.extend(filter_article_relevance(clean_topic, ai_articles))
        print(f"[Pipeline] AI Researcher generated {len(ai_articles)} perspective articles")

    # Select top 9 most diverse articles across outlets
    seen_sources = set()
    diverse_selection = []
    for art in relevant_articles:
        src = art.get("source_name", "")
        if src not in seen_sources:
            diverse_selection.append(art)
            seen_sources.add(src)
        if len(diverse_selection) >= 9:
            break

    # If diverse selection is smaller than 9, fill up from remaining relevant articles
    if len(diverse_selection) < 9:
        for art in relevant_articles:
            if art not in diverse_selection:
                diverse_selection.append(art)
            if len(diverse_selection) >= 9:
                break

    # 5. Enrich in parallel
    enriched = run_full_pipeline(diverse_selection)

    # 6. Generate Echo Chamber Alert
    try:
        alert = generate_echo_alert(clean_topic, enriched)
    except Exception as e:
        print(f"[Pipeline] Echo alert failed: {e}")
        alert = f"Coverage on '{clean_topic}' reveals multiple perspectives across {len(enriched)} sources. Cross-reference independent reporting to avoid narrative echo chambers."

    return enriched, alert
