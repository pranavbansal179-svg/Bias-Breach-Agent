import os
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))

GROQ_MODELS = [
    "qwen/qwen3.8-27b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "allam-2-7b"
]

def generate_offline_echo_alert(topic: str, analyses: list) -> str:
    """Zero-token heuristic echo chamber synthesis derived directly from article metrics."""
    if not analyses:
        return f"Coverage on '{topic}' is currently sparse. Check back as additional reporting emerges across independent outlets."

    biases = [a.get("bias_score", 0.0) for a in analyses]
    avg_bias = sum(biases) / len(biases) if biases else 0.0
    framings = [a.get("framing", "neutral") for a in analyses]
    dominant_frame = max(set(framings), key=framings.count) if framings else "neutral"

    left_count = sum(1 for b in biases if b < -1.5)
    right_count = sum(1 for b in biases if b > 1.5)
    center_count = len(biases) - left_count - right_count

    if left_count > right_count and left_count > center_count:
        pattern = f"Coverage on '{topic}' skews predominantly progressive, focusing on systemic oversight and institutional critique under a {dominant_frame} framing."
        missing = "Free-market viewpoints and deregulation arguments are largely absent from mainstream discussion."
        rec = "Consider reading conservative or industry-focused analyses to understand countervailing economic perspectives."
    elif right_count > left_count and right_count > center_count:
        pattern = f"Coverage on '{topic}' reflects a notable conservative framing emphasizing deregulation, border integrity, and individual agency."
        missing = "Grassroots labor perspectives and systemic equity arguments receive minimal coverage."
        rec = "Cross-reference wire reporting or investigative progressive publications for balanced contrast."
    else:
        pattern = f"Coverage on '{topic}' displays a balanced distribution across {len(analyses)} sources with a dominant '{dominant_frame}' tone."
        missing = "Deep technical tradeoffs and international non-Western viewpoints are occasionally underrepresented."
        rec = "Review specialized policy briefs or foreign wire services for deeper context."

    return f"{pattern} {missing} {rec}"

def generate_echo_alert(topic: str, analyses: list) -> str:
    summaries = []
    for a in analyses[:8]:
        summaries.append(
            f"- [{a.get('source_name','?')}] "
            f"bias={a.get('bias_score',0):.1f}, "
            f"framing={a.get('framing','?')}: "
            f"{a.get('title','')[:80]}"
        )
    context = "\n".join(summaries)
    prompt = f"""Topic: {topic}
Media coverage summary ({len(analyses)} articles):
{context}

Write a 3-sentence echo-chamber alert:
1. Describe dominant narrative pattern
2. Flag consistently missing viewpoints
3. Recommend what kind of source to seek for balance.
Be direct. No bullet points."""

    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            from groq import Groq
            client = Groq(api_key=groq_key)
            for model_name in GROQ_MODELS:
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.4,
                        max_tokens=180
                    )
                    raw_text = response.choices[0].message.content.strip()
                    clean_text = raw_text.replace('\u2011', '-').replace('\u2014', '--').replace('\u2019', "'").replace('\u2018', "'").replace('\u201c', '"').replace('\u201d', '"')
                    if clean_text:
                        return clean_text
                except Exception:
                    continue
        except Exception:
            pass

    return generate_offline_echo_alert(topic, analyses)