# backend/agents/orchestrator.py
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI
from .sentiment_agent import score_sentiment
from .bias_agent import detect_bias
from .narrative_agent import extract_narrative
from .echo_agent import generate_echo_alert

llm = ChatOpenAI(model='gpt-4o-mini', temperature=0.2)

# Define agents
sentiment_agent = Agent(
    role='Sentiment Analyst',
    goal='Score the emotional tone of media articles accurately',
    backstory='Expert in NLP sentiment analysis with HuggingFace models.',
    llm=llm, verbose=True
)

bias_agent = Agent(
    role='Media Bias Detector',
    goal='Identify political framing and bias in news articles',
    backstory='Seasoned media critic trained to spot loaded language.',
    llm=llm, verbose=True
)

narrative_agent = Agent(
    role='Narrative Analyst',
    goal='Extract the core narrative and missing voices from articles',
    backstory='Academic researcher specialising in media framing.',
    llm=llm, verbose=True
)

def run_full_pipeline(articles: list[dict]) -> list[dict]:
    """Runs all three agents on each article and returns enriched dicts."""
    enriched = []
    for article in articles:
        text = article['body']
        title = article['title']
        
        sentiment = score_sentiment(text)
        bias      = detect_bias(title, text)
        narrative = extract_narrative(title, text)
        
        enriched.append({
            **article,
            'sentiment_score': sentiment['score'],
            'emotion':         sentiment['emotion'],
            'bias_score':      bias.get('bias_score', 0),
            'bias_label':      bias.get('bias_label', 'center'),
            'loaded_words':    bias.get('loaded_words', []),
            'main_claim':      narrative.get('main_claim', ''),
            'framing':         narrative.get('framing', 'neutral'),
            'missing_voices':  narrative.get('missing_voices', ''),
        })
    return enriched