from openai import OpenAI
from dotenv import load_dotenv
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_echo_alert(topic: str, analyses: list[dict]) -> str:
    summaries = []
    for a in analyses[:10]:
        summaries.append(
            f"- [{a.get('source_name','?')}] "
            f"bias={a.get('bias_score',0):.1f}, "
            f"emotion={a.get('emotion','?')}, "
            f"framing={a.get('framing','?')}: "
            f"{a.get('main_claim','')}"
        )
    context = "\n".join(summaries)
    prompt = f"""
Topic: {topic}

Here is how {len(analyses)} articles from different sources cover this topic:
{context}

Write a 3-sentence echo-chamber alert for a reader:
1. Describe the dominant narrative pattern
2. Flag which perspectives are consistently missing
3. Recommend what kind of source to seek for balance

Be specific and direct. Do NOT use bullet points.
"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Echo alert failed: {e}")
        return "Unable to generate echo alert at this time."
