# backend/agents/sentiment_agent.py
from transformers import pipeline
from functools import lru_cache

# Load once — reuse across requests
@lru_cache(maxsize=1)
def get_sentiment_pipeline():
    return pipeline(
        'text-classification',
        model='cardiffnlp/twitter-roberta-base-sentiment-latest',
        return_all_scores=True
    )

EMOTION_LABELS = {
    'LABEL_0': 'negative',
    'LABEL_1': 'neutral',
    'LABEL_2': 'positive',
}

def score_sentiment(text: str) -> dict:
    """Returns {'score': float(-1 to 1), 'emotion': str, 'confidence': float}"""
    pipe = get_sentiment_pipeline()
    # Truncate to 512 tokens
    result = pipe(text[:512])[0]
    scores = {r['label']: r['score'] for r in result}
    
    # Map to -1 to +1 scale
    neg = scores.get('negative', 0)
    pos = scores.get('positive', 0)
    sentiment_score = pos - neg
    
    # Determine dominant emotion
    dominant = max(result, key=lambda x: x['score'])
    label = EMOTION_LABELS.get(dominant['label'], dominant['label'])
    
    return {
        'score': round(sentiment_score, 4),
        'emotion': label,
        'confidence': round(dominant['score'], 4)
    }