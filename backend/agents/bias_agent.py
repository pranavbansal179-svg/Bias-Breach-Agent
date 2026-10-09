from groq import Groq
from dotenv import load_dotenv
import json, os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

BIAS_SYSTEM_PROMPT = """
You are a media bias analyst. Analyse the given article and return ONLY valid JSON.
Assign a bias_score from -10 (far left) to +10 (far right). 0 = centrist.

Return exactly this JSON:
{
  "bias_score": <float -10 to 10>,
  "bias_label": <"far-left"|"left"|"center-left"|"center"|"center-right"|"right"|"far-right">,
  "loaded_words": ["word1", "word2"],
  "reasoning": "<one sentence>"
}
"""

def detect_bias(title: str, body: str) -> dict:
    text = f"TITLE: {title}\n\nBODY: {body[:1500]}"
    try:
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {"role": "system", "content": BIAS_SYSTEM_PROMPT},
                {"role": "user",   "content": text}
            ],
            temperature=0.2
        )
        content = response.choices[0].message.content
        start = content.find("{")
        end = content.rfind("}") + 1
        return json.loads(content[start:end])
    except Exception as e:
        print(f"Bias detection failed: {e}")
        return {"bias_score": 0.0, "bias_label": "center", "loaded_words": [], "reasoning": str(e)}