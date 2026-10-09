import json
import os
import hashlib
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

_NARRATIVE_CACHE = {}

NARRATIVE_PROMPT = """Extract narrative from article. Return ONLY valid JSON:
{
  "main_claim": "<one sentence core summary>",
  "entities": ["<up to 3 key entities>"],
  "framing": "<threat|opportunity|conflict|neutral|celebration>",
  "missing_voices": "<perspective absent in 5-8 words>"
}"""

GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "allam-2-7b"
]

def extract_narrative(title: str, body: str) -> dict:
    cache_key = hashlib.md5(f"{title}".encode("utf-8")).hexdigest()
    if cache_key in _NARRATIVE_CACHE:
        return _NARRATIVE_CACHE[cache_key]

    # Compact body text to 350 chars max to minimize prompt tokens
    text = f"TITLE: {title}\nEXCERPT: {body[:350]}"
    groq_key = os.getenv("GROQ_API_KEY")

    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            for model_name in GROQ_MODELS:
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[
                            {"role": "system", "content": NARRATIVE_PROMPT},
                            {"role": "user",   "content": text}
                        ],
                        temperature=0.2,
                        max_tokens=150
                    )
                    content = response.choices[0].message.content
                    start = content.find("{")
                    end = content.rfind("}") + 1
                    if start != -1 and end > start:
                        res = json.loads(content[start:end])
                        _NARRATIVE_CACHE[cache_key] = res
                        return res
                except Exception:
                    continue
        except Exception:
            pass

    # Deterministic zero-token fallback
    lower = f"{title} {body}".lower()
    framing = "neutral"
    if any(w in lower for w in ["threat", "crisis", "danger", "risk", "fear", "fatal", "disaster"]):
        framing = "threat"
    elif any(w in lower for w in ["breakthrough", "growth", "opportunity", "advance", "solution", "boost"]):
        framing = "opportunity"
    elif any(w in lower for w in ["clash", "fight", "battle", "dispute", "slams", "lawsuit", "oppose"]):
        framing = "conflict"

    fallback = {
        "main_claim": title[:120],
        "entities": [],
        "framing": framing,
        "missing_voices": "Independent opposing stakeholder analysis"
    }
    _NARRATIVE_CACHE[cache_key] = fallback
    return fallback