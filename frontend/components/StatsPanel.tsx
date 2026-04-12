'use client';
import { Article } from '@/lib/types';
import { useMemo } from 'react';
import { BarChart2, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface StatsPanelProps {
  articles: Article[];
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: '#7c3aed',
  news: '#0d9488',
  blog: '#ea580c',
};

export default function StatsPanel({ articles }: StatsPanelProps) {
  const stats = useMemo(() => {
    if (!articles.length) return null;

    // Source distribution
    const sourceStats = articles.reduce((acc, article) => {
      const type = article.source_type;
      if (!acc[type]) {
        acc[type] = { count: 0, biasSum: 0, sentimentSum: 0 };
      }
      acc[type].count++;
      acc[type].biasSum += article.bias_score;
      acc[type].sentimentSum += article.sentiment_score;
      return acc;
    }, {} as Record<string, { count: number; biasSum: number; sentimentSum: number }>);

    // Bias distribution
    const biasCategories = {
      left: articles.filter((a) => a.bias_score < -2.5).length,
      center: articles.filter((a) => a.bias_score >= -2.5 && a.bias_score <= 2.5).length,
      right: articles.filter((a) => a.bias_score > 2.5).length,
    };

    // Sentiment stats
    const avgSentiment = articles.reduce((sum, a) => sum + a.sentiment_score, 0) / articles.length;
    const avgBias = articles.reduce((sum, a) => sum + a.bias_score, 0) / articles.length;

    // Framing distribution
    const framingCounts = articles.reduce((acc, a) => {
      acc[a.framing] = (acc[a.framing] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Most common emotions
    const emotionCounts = articles.reduce((acc, a) => {
      acc[a.emotion] = (acc[a.emotion] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';

    return {
      total: articles.length,
      sourceStats,
      biasCategories,
      avgSentiment,
      avgBias,
      framingCounts,
      dominantEmotion,
    };
  }, [articles]);

  if (!stats) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-muted-foreground text-sm text-center">No data available</p>
      </div>
    );
  }

  const biasTotal = stats.biasCategories.left + stats.biasCategories.center + stats.biasCategories.right;

  return (
    <div className="space-y-4">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="Articles"
          value={stats.total.toString()}
          icon={<BarChart2 className="w-4 h-4" />}
        />
        <StatCard
          label="Avg Bias"
          value={`${stats.avgBias > 0 ? '+' : ''}${stats.avgBias.toFixed(1)}`}
          subtext={stats.avgBias < -2 ? 'Left leaning' : stats.avgBias > 2 ? 'Right leaning' : 'Balanced'}
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <StatCard
          label="Avg Sentiment"
          value={`${stats.avgSentiment > 0 ? '+' : ''}${stats.avgSentiment.toFixed(2)}`}
          subtext={stats.avgSentiment > 0.2 ? 'Positive' : stats.avgSentiment < -0.2 ? 'Negative' : 'Neutral'}
          icon={stats.avgSentiment > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        />
        <StatCard
          label="Dominant Tone"
          value={stats.dominantEmotion}
          icon={<BarChart2 className="w-4 h-4" />}
        />
      </div>

      {/* Source Distribution */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Source Distribution</h4>
        <div className="space-y-3">
          {Object.entries(stats.sourceStats).map(([source, data]) => {
            const percentage = (data.count / stats.total) * 100;
            return (
              <div key={source}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: SOURCE_COLORS[source] }}
                    />
                    <span className="text-muted-foreground capitalize">{source}</span>
                  </div>
                  <span className="text-foreground font-medium">{data.count}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: SOURCE_COLORS[source],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bias Spectrum */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Political Bias Spectrum</h4>
        <div className="flex items-center gap-1 h-8">
          <div
            className="h-full rounded-l-md bg-blue-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(stats.biasCategories.left / biasTotal) * 100}%` }}
          >
            {stats.biasCategories.left > 0 && (
              <span className="text-xs font-medium text-white">{stats.biasCategories.left}</span>
            )}
          </div>
          <div
            className="h-full bg-zinc-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(stats.biasCategories.center / biasTotal) * 100}%` }}
          >
            {stats.biasCategories.center > 0 && (
              <span className="text-xs font-medium text-white">{stats.biasCategories.center}</span>
            )}
          </div>
          <div
            className="h-full rounded-r-md bg-red-500 transition-all duration-500 flex items-center justify-center"
            style={{ width: `${(stats.biasCategories.right / biasTotal) * 100}%` }}
          >
            {stats.biasCategories.right > 0 && (
              <span className="text-xs font-medium text-white">{stats.biasCategories.right}</span>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>
      </div>

      {/* Framing Distribution */}
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3">Narrative Framing</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(stats.framingCounts).map(([framing, count]) => (
            <div
              key={framing}
              className="px-3 py-1.5 bg-muted rounded-md flex items-center gap-2"
            >
              <span className="text-sm text-foreground capitalize">{framing}</span>
              <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-semibold text-foreground capitalize">{value}</p>
      {subtext && <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>}
    </div>
  );
}
