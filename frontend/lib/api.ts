import { Article, AnalysisResult } from './types';
import { MOCK_ARTICLES, MOCK_ECHO_ALERT } from './mock-data';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
const USE_MOCK = !process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_USE_MOCK === 'true';

// Simulate processing delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generate mock analysis for any topic
function generateMockArticles(topic: string): Article[] {
  // Modify the mock articles to use the provided topic
  return MOCK_ARTICLES.map((article, index) => ({
    ...article,
    id: index + 1,
    topic,
    title: article.title.replace('Artificial Intelligence', topic).replace('AI', topic),
    body: article.body.replace(/artificial intelligence/gi, topic).replace(/AI/g, topic),
    // Add some randomness to make it more realistic
    bias_score: article.bias_score + (Math.random() - 0.5) * 2,
    sentiment_score: Math.max(-1, Math.min(1, article.sentiment_score + (Math.random() - 0.5) * 0.3)),
    published_at: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
  }));
}

function generateEchoAlert(topic: string, articles: Article[]): string {
  const leftCount = articles.filter((a) => a.bias_score < -2.5).length;
  const rightCount = articles.filter((a) => a.bias_score > 2.5).length;
  const centerCount = articles.length - leftCount - rightCount;

  const avgSentiment = articles.reduce((sum, a) => sum + a.sentiment_score, 0) / articles.length;
  const sentimentDesc = avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral';

  const dominantFraming = articles.reduce(
    (acc, a) => {
      acc[a.framing] = (acc[a.framing] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );
  const topFraming = Object.entries(dominantFraming).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

  return `Analysis of "${topic}" coverage reveals a ${leftCount > rightCount ? 'left-leaning' : rightCount > leftCount ? 'right-leaning' : 'balanced'} perspective distribution across ${articles.length} sources. The overall sentiment is ${sentimentDesc}, with "${topFraming}" being the dominant narrative frame. ${
    leftCount > 0 && rightCount > 0
      ? 'Both progressive and conservative viewpoints are represented, though with varying emphasis.'
      : leftCount > rightCount
        ? 'Conservative perspectives appear underrepresented in this coverage.'
        : rightCount > leftCount
          ? 'Progressive perspectives appear underrepresented in this coverage.'
          : 'The coverage appears relatively balanced across the political spectrum.'
  } Consider seeking out ${leftCount > rightCount ? 'center-right publications' : rightCount > leftCount ? 'center-left publications' : 'international news sources'} for alternative perspectives on this topic.`;
}

export async function analyzeTopic(
  topic: string,
  subreddits: string[] = ['technology', 'worldnews', 'politics']
): Promise<{ task_id: string; status: string }> {
  if (USE_MOCK) {
    await delay(500);
    return { task_id: `mock-${Date.now()}`, status: 'queued' };
  }

  const res = await fetch(`${BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, subreddits }),
  });
  return res.json();
}

export async function getResults(topic: string): Promise<AnalysisResult | null> {
  if (USE_MOCK) {
    // Simulate processing time
    await delay(1500);
    const articles = generateMockArticles(topic);
    return {
      topic,
      count: articles.length,
      articles,
      echo_alert: generateEchoAlert(topic, articles),
    };
  }

  const res = await fetch(`${BASE}/results/${encodeURIComponent(topic)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getTopics(): Promise<string[]> {
  if (USE_MOCK) {
    await delay(200);
    return ['Artificial Intelligence', 'Climate Change', 'Election 2024'];
  }

  const res = await fetch(`${BASE}/topics`);
  return res.json();
}

export async function semanticSearch(
  query: string,
  topic?: string
): Promise<{ query: string; results: Partial<Article>[] }> {
  if (USE_MOCK) {
    await delay(300);
    const filtered = MOCK_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(query.toLowerCase()) ||
        a.body.toLowerCase().includes(query.toLowerCase())
    );
    return { query, results: filtered.slice(0, 5) };
  }

  const url = new URL(`${BASE}/search`);
  url.searchParams.set('q', query);
  if (topic) url.searchParams.set('topic', topic);

  const res = await fetch(url.toString());
  return res.json();
}
