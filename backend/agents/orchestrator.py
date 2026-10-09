from .sentiment_agent import score_sentiment
from .bias_agent import detect_bias
from .narrative_agent import extract_narrative

def run_full_pipeline(articles: list) -> list:
    enriched = []
    for i, article in enumerate(articles):
        print(f"Processing article {i+1}/{len(articles)}: {article['title'][:50]}")
        title = article.get("title", "")
        body  = article.get("body", "") or title

        sentiment = score_sentiment(body)
        bias      = detect_bias(title, body)
        narrative = extract_narrative(title, body)

        import json
        enriched.append({
            **article,
            "sentiment_score": sentiment["score"],
            "emotion":         sentiment["emotion"],
            "bias_score":      bias.get("bias_score", 0),
            "bias_label":      bias.get("bias_label", "center"),
            "loaded_words":    json.dumps(bias.get("loaded_words", [])),
            "main_claim":      narrative.get("main_claim", ""),
            "framing":         narrative.get("framing", "neutral"),
            "missing_voices":  narrative.get("missing_voices", ""),
        })
    return enriched
