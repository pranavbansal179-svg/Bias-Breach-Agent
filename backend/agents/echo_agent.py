# backend/agents/echo_agent.py
from openai import OpenAI
import os

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

def generate_echo_alert(topic: str, analyses: list[dict]) -> str:
    """
    Takes a list of analysis dicts (one per article) and
    generates a plain-English echo-chamber alert paragraph.
    """
    summaries = []
    for a in analyses[:10]:  # cap at 10 articles
        summaries.append(
            f"- [{a['source_name']}] bias={a.get('bias_score',0):.1f}, "
            f"emotion={a.get('emotion','?')}, "
            f"framing={a.get('framing','?')}: {a.get('main_claim','')}"
        )

    context = '\n'.join(summaries)
    prompt = f'''
Topic: {topic}

Here are how {len(analyses)} articles from different sources cover this topic:
{context}

Write a 3-sentence echo-chamber alert for a reader:
1. Describe the dominant narrative pattern you see
2. Flag which perspectives or voices are consistently missing
3. Recommend what kind of source to seek out for balance

Be specific, factual, and direct. Do NOT use bullet points.
'''
    response = client.chat.completions.create(
        model='gpt-4o',
        messages=[{'role': 'user', 'content': prompt}],
        temperature=0.7
    )
    return response.choices[0].message.content.strip()