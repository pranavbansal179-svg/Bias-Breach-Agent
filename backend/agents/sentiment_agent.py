from transformers import pipeline
from functools import lru_cache

@lru_cache(maxsize=1)
def get_sentiment_pipeline():
    return pipeline(
        "text-classification",
        model="cardiffnlp/twitter-roberta-base-sentiment-latest",
        return_all_scores=True
    )

def score_sentiment(text: str) -> dict:
    pipe = get_sentiment_pipeline()
    result = pipe(text[:512])[0]
    scores = {r["label"]: r["score"] for r in result}
    neg = scores.get("negative", 0)
    pos = scores.get("positive", 0)
    sentiment_score = pos - neg
    dominant = max(result, key=lambda x: x["score"])
    return {
        "score": round(sentiment_score, 4),
        "emotion": dominant["label"],
        "confidence": round(dominant["score"], 4)
    }
