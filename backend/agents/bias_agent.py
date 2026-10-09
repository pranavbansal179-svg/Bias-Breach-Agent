import os
import json
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

BIAS_SYSTEM_PROMPT = """
You are an expert computational media bias analyst trained on methodologies from AllSides, Ad Fontes Media, and linguistic framing research.

Analyze the given news article and evaluate:
1. POLITICAL SPECTRUM (-10.0 to +10.0):
   - -10 to -7: Far Left (revolutionary, radical critique of capitalism/tradition)
   - -6.9 to -2.5: Left / Progressive (focus on systemic injustice, collective regulation, progressive reform)
   - -2.4 to -0.6: Center-Left (slight liberal lean, institutional reform)
   - -0.5 to +0.5: Center (balanced, neutral attribution, multiple opposing viewpoints presented equally)
   - +0.6 to +2.4: Center-Right (slight conservative lean, market preference)
   - +2.5 to +6.9: Right / Conservative (emphasis on individual liberty, free markets, traditional values, border/security)
   - +7 to +10: Far Right (hyper-partisan nationalism, populist anti-statism)

2. SENSATIONALISM INDEX (0.0 to 10.0):
   - 0-3: Dry, strictly factual, neutral verbs
   - 4-6: Mildly provocative headline, subjective adjectives
   - 7-10: Emotionally manipulative, outrage-inducing, sensationalist spin

3. DIMENSIONS:
   - economic_axis: -10 (socialist/state control) to +10 (unregulated free market)
   - social_axis: -10 (progressive/secular) to +10 (traditional/conservative)

4. EVIDENCE & LOADED WORDS:
   - Identify up to 5 loaded or partisan vocabulary choices (e.g., 'catastrophic', 'monopoly', 'cripple', 'overreaching', 'woke', 'threatens').
   - Extract 1 representative evidence quote showing the framing.

Return ONLY valid JSON with this exact schema:
{
  "bias_score": <float -10.0 to 10.0>,
  "bias_label": <"Far Left" | "Left" | "Center-Left" | "Center" | "Center-Right" | "Right" | "Far Right">,
  "sensationalism_score": <float 0.0 to 10.0>,
  "economic_axis": <float -10.0 to 10.0>,
  "social_axis": <float -10.0 to 10.0>,
  "loaded_words": ["word1", "word2"],
  "evidence_quote": "<short excerpt or sentence illustrating bias>",
  "reasoning": "<1-2 sentences explaining why this score was assigned>",
  "confidence": <float 0.5 to 1.0>
}
"""

# Known media outlet baseline biases (AllSides / Ad Fontes media ratings)
OUTLET_BASELINES = {
    "msnbc": -6.0, "the guardian": -5.0, "vox": -5.5, "mother jones": -7.5,
    "cnn": -4.0, "new york times": -3.5, "washington post": -3.0, "politico": -1.5,
    "reuters": 0.0, "associated press": 0.0, "ap": 0.0, "bbc": -0.5, "the hill": 0.0,
    "bloomberg": 0.0, "c-span": 0.0, "wall street journal": 2.0, "fox news": 5.5,
    "national review": 6.5, "washington examiner": 5.0, "new york post": 4.5,
    "daily wire": 7.0, "breitbart": 8.0, "the federalist": 7.5
}

def get_outlet_baseline(source_name: str) -> float | None:
    s = source_name.lower().strip()
    for outlet, score in OUTLET_BASELINES.items():
        if outlet in s:
            return score
    return None

def detect_bias(title: str, body: str, source_name: str = "") -> dict:
    """
    Advanced Multi-Dimensional Media Bias Analysis.
    Evaluates political spectrum, sensationalism, multi-axis lean, and loaded vocabulary.
    Grounded in linguistic framing and empirical media monitoring baselines.
    """
    baseline = get_outlet_baseline(source_name)
    baseline_context = f"\nOUTLET BASELINE ESTIMATE: {baseline} (-10 Left to +10 Right)" if baseline is not None else ""
    text = f"SOURCE: {source_name or 'Unknown Outlet'}{baseline_context}\nTITLE: {title}\n\nBODY EXCERPT: {body[:500]}"
    groq_key = os.getenv("GROQ_API_KEY")

    if groq_key:
        from groq import Groq
        client = Groq(api_key=groq_key)
        for model_name in ["qwen/qwen3.8-27b", "openai/gpt-oss-20b"]:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=[
                        {"role": "system", "content": BIAS_SYSTEM_PROMPT},
                        {"role": "user", "content": text}
                    ],
                    temperature=0.1
                )
                content = response.choices[0].message.content.strip()
                start = content.find("{")
                end = content.rfind("}") + 1
                if start != -1 and end > start:
                    data = json.loads(content[start:end])
                    score = float(data.get("bias_score", 0.0))
                    # Ground with known outlet baseline if available
                    if baseline is not None and abs(score - baseline) > 4.5:
                        score = round(score * 0.7 + baseline * 0.3, 2)

                    return {
                        "bias_score": round(score, 2),
                        "bias_label": str(data.get("bias_label", "Center")),
                        "sensationalism_score": round(float(data.get("sensationalism_score", 3.0)), 1),
                        "economic_axis": round(float(data.get("economic_axis", 0.0)), 1),
                        "social_axis": round(float(data.get("social_axis", 0.0)), 1),
                        "loaded_words": [str(w) for w in data.get("loaded_words", [])][:5],
                        "evidence_quote": str(data.get("evidence_quote", title))[:200],
                        "reasoning": str(data.get("reasoning", "Standard balanced reporting."))[:250],
                        "confidence": round(float(data.get("confidence", 0.88)), 2)
                    }
            except Exception as e:
                print(f"[Bias Agent] Model {model_name} failed: {e}")
                continue

    # Smart journalistic heuristic fallback when API quota is exhausted
    title_lower = f"{title} {body}".lower()

    # Detect known loaded and polarized terms
    polarized_terms = [
        "crisis", "threat", "monopoly", "killed", "cripple", "overreaching",
        "woke", "censorship", "surge", "catastrophe", "crackdown", "scandal",
        "slashes", "soaring", "favoritism", "backlash", "tyranny", "authoritarian",
        "rigged", "radical", "unprecedented", "collusion", "disaster", "looming",
        "slams", "blasts", "outrage", "fury", "greed", "destroying", "war on"
    ]
    found_loaded = [w for w in polarized_terms if w in title_lower][:5]

    # Calculate sensationalism (scale 0-10)
    sensationalism = min(10.0, 1.5 + len(found_loaded) * 1.6 + (1.5 if "!" in title or "?" in title else 0.0))

    # Directional lean heuristics
    left_signals = ["inequality", "climate crisis", "civil rights", "monopoly", "worker", "labor", "undocumented", "lgbtq", "corporate greed", "universal", "systemic"]
    right_signals = ["border security", "illegal", "free market", "woke", "regulation", "overreach", "tax relief", "second amendment", "traditional", "deficit", "sovereignty"]

    left_hits = sum(1 for w in left_signals if w in title_lower)
    right_hits = sum(1 for w in right_signals if w in title_lower)

    bias_score = 0.0
    if baseline is not None:
        bias_score = baseline
    elif left_hits > right_hits:
        bias_score = round(-1.5 - min(4.5, left_hits * 1.5), 2)
    elif right_hits > left_hits:
        bias_score = round(1.5 + min(4.5, right_hits * 1.5), 2)

    if bias_score <= -4.0:
        bias_label = "Far Left"
    elif bias_score <= -1.5:
        bias_label = "Left"
    elif bias_score <= -0.5:
        bias_label = "Center-Left"
    elif bias_score <= 0.5:
        bias_label = "Center"
    elif bias_score <= 1.5:
        bias_label = "Center-Right"
    elif bias_score <= 4.0:
        bias_label = "Right"
    else:
        bias_label = "Far Right"

    return {
        "bias_score": bias_score,
        "bias_label": bias_label,
        "sensationalism_score": round(sensationalism, 1),
        "economic_axis": round(bias_score * 0.7, 1),
        "social_axis": round(bias_score * 0.8, 1),
        "loaded_words": found_loaded,
        "evidence_quote": title[:140],
        "reasoning": f"Assigned {bias_label} based on source baseline ({source_name or 'General'}), loaded terms ({', '.join(found_loaded) if found_loaded else 'minimal'}), and lexical framing.",
        "confidence": 0.82
    }