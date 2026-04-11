// frontend/app/page.tsx
'use client';
import { useState } from 'react';
import SentimentMap from '@/components/SentimentMap';
import { analyzeTopic, getResults } from '@/lib/api';

export default function Home() {
  const [topic, setTopic]     = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [alert, setAlert]     = useState('');

  async function handleAnalyze() {
    setLoading(true);
    const { task_id } = await analyzeTopic(topic, ['technology','worldnews','politics']);
    // Poll for results every 3s
    const poll = setInterval(async () => {
      const data = await getResults(topic);
      if (data) {
        setResults(data.articles);
        setAlert(data.echo_alert || '');
        setLoading(false);
        clearInterval(poll);
      }
    }, 3000);
  }

  return (
    <main className='min-h-screen bg-gray-50 p-8'>
      <h1 className='text-4xl font-bold text-purple-700 mb-2'>Refract</h1>
      <p className='text-gray-500 mb-8'>Visualise media bias with AI</p>

      <div className='flex gap-3 mb-8'>
        <input value={topic} onChange={e => setTopic(e.target.value)}
          placeholder='Enter a topic (e.g. Artificial Intelligence)'
          className='flex-1 border rounded-lg px-4 py-2 text-sm' />
        <button onClick={handleAnalyze} disabled={loading || !topic}
          className='bg-purple-600 text-white px-6 py-2 rounded-lg disabled:opacity-50'>
          {loading ? 'Analysing...' : 'Analyse'}
        </button>
      </div>

      {alert && (
        <div className='bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6'>
          <h3 className='font-semibold text-amber-800 mb-1'>Echo Chamber Alert</h3>
          <p className='text-sm text-amber-700'>{alert}</p>
        </div>
      )}

      {results && <SentimentMap articles={results} />}
    </main>
  );
}