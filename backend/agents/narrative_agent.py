from groq import Groq
from dotenv import load_dotenv
import json, os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

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
    for model_name in ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
        try:
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": NARRATIVE_PROMPT},
                    {"role": "user",   "content": text}
                ],
                temperature=0.3
            )
            content = response.choices[0].message.content
            start = content.find("{")
            end = content.rfind("}") + 1
            if start != -1 and end > start:
                return json.loads(content[start:end])
        except Exception as e:
            print(f"[Narrative Agent] Model {model_name} failed: {e}")
            continue

    return {"main_claim": "", "entities": [], "framing": "neutral", "missing_voices": ""}