# backend/agents/bias_agent.py
from openai import OpenAI
import json, os

client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))

BIAS_SYSTEM_PROMPT = '''
You are a media bias analyst. Analyse the given article and return ONLY valid JSON.
Assign a bias_score from -10 (far left / progressive) to +10 (far right / conservative).
A score of 0 means centrist / balanced.

Evaluate based on:
1. Loaded vocabulary (e.g. 'invasion' vs 'migration', 'regime' vs 'government')
2. Which voices are centered vs. marginalised
3. Framing of cause-and-effect
4. Emotional language choices

Return exactly this JSON:
{
  "bias_score": <float -10 to 10>,
  "bias_label": <"far-left" | "left" | "center-left" | "center" | "center-right" | "right" | "far-right">,
  "loaded_words": [<up to 5 most biased words or phrases>],
  "reasoning": <one sentence explanation>
}
'''

def detect_bias(title: str, body: str) -> dict:
    """Returns bias analysis dict from LLM."""
    text = f'TITLE: {title}\n\nBODY: {body[:1500]}'
    try:
        response = client.chat.completions.create(
            model='gpt-4o-mini',   # Use gpt-4o for higher accuracy
            messages=[
                {'role': 'system', 'content': BIAS_SYSTEM_PROMPT},
                {'role': 'user',   'content': text}
            ],
            response_format={'type': 'json_object'},
            temperature=0.2
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {'bias_score': 0.0, 'bias_label': 'center', 'loaded_words': [], 'reasoning': str(e)}