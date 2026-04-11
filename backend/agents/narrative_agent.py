from openai import OpenAI
from dotenv import load_dotenv
import json, os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

NARRATIVE_PROMPT = """
Extract the core narrative from this article. Return ONLY valid JSON:
{
  "main_claim": "<one sentence summary>",
  "entities": ["<up to 5 key people/orgs/places>"],
  "framing": "<threat|opportunity|conflict|neutral|celebration>",
  "missing_voices": "<whose perspective is absent>"
}
"""

def extract_narrative(title: str, body: str) -> dict:
    text = f"TITLE: {title}\n\nBODY: {body[:1500]}"
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": NARRATIVE_PROMPT},
                {"role": "user",   "content": text}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Narrative extraction failed: {e}")
        return {"main_claim": "", "entities": [], "framing": "neutral", "missing_voices": ""}
