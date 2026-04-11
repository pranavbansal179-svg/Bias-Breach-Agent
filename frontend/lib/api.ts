// frontend/lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export async function analyzeTopic(topic: string, subreddits: string[]) {
  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, subreddits }),
  });
  return res.json();
}

export async function getResults(topic: string) {
  const res = await fetch(`${BASE}/results/${encodeURIComponent(topic)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getTopics() {
  const res = await fetch(`${BASE}/topics`);
  return res.json();
}