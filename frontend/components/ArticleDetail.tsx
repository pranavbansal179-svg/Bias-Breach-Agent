'use client';
import { useState } from 'react';
import { Article } from '@/lib/types';
import { X, TrendingUp, TrendingDown, Minus, Brain, ChevronDown, ChevronUp } from 'lucide-react';

interface ArticleDetailProps {
  article: Article;
  onClose: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: '#7c3aed',
  news: '#0d9488',
  blog: '#ea580c',
};

const BIAS_LABELS: Record<string, { label: string; color: string }> = {
  'far-left': { label: 'Far Left', color: '#3b82f6' },
  left: { label: 'Left', color: '#60a5fa' },
  'center-left': { label: 'Center Left', color: '#93c5fd' },
  center: { label: 'Center', color: '#a1a1aa' },
  'center-right': { label: 'Center Right', color: '#fca5a5' },
  right: { label: 'Right', color: '#f87171' },
  'far-right': { label: 'Far Right', color: '#ef4444' },
};

function getBiasInfo(label: string) {
  return BIAS_LABELS[label] || { label: 'Unknown', color: '#71717a' };
}

function getSentimentDisplay(score: number) {
  if (score > 0.2) return { label: 'Positive', icon: <TrendingUp className="w-4 h-4" />, color: '#10b981' };
  if (score < -0.2) return { label: 'Negative', icon: <TrendingDown className="w-4 h-4" />, color: '#ef4444' };
  return { label: 'Neutral', icon: <Minus className="w-4 h-4" />, color: '#71717a' };
}

export default function ArticleDetail({ article, onClose }: ArticleDetailProps) {
  const [showDetailedBias, setShowDetailedBias] = useState(false);
  const [showDetailedSentiment, setShowDetailedSentiment] = useState(false);
  
  const biasInfo = getBiasInfo(article.bias_label);
  const sentimentInfo = getSentimentDisplay(article.sentiment_score);
  const sourceColor = SOURCE_COLORS[article.source_type] || '#71717a';

  // Calculate bias position on scale (0-100%)
  const biasPosition = ((article.bias_score + 10) / 20) * 100;

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: sourceColor }}
          />
          <span className="text-sm font-medium text-muted-foreground">
            {article.source_name}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(article.published_at).toLocaleDateString()}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <h2 className="text-xl font-semibold text-foreground mb-4">{article.title}</h2>

      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{article.body}</p>

      {/* Bias Scale Visualization */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-foreground mb-2">Political Bias</h4>
        <div className="relative">
          <div className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-zinc-500 to-red-500" />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-foreground border-2 border-background shadow-lg transition-all"
            style={{ left: `calc(${biasPosition}% - 8px)` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>Far Left (-10)</span>
          <span>Center (0)</span>
          <span>Far Right (+10)</span>
        </div>
        <p className="text-center mt-2">
          <span
            className="text-sm font-medium px-2 py-1 rounded"
            style={{ backgroundColor: `${biasInfo.color}20`, color: biasInfo.color }}
          >
            {biasInfo.label} ({article.bias_score > 0 ? '+' : ''}{article.bias_score.toFixed(1)})
          </span>
        </p>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
          <div className="flex items-center gap-2" style={{ color: sentimentInfo.color }}>
            {sentimentInfo.icon}
            <span className="font-medium">{sentimentInfo.label}</span>
            <span className="text-muted-foreground text-sm">
              ({article.sentiment_score > 0 ? '+' : ''}{article.sentiment_score.toFixed(2)})
            </span>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Emotional Tone</p>
          <p className="font-medium text-foreground capitalize">{article.emotion}</p>
        </div>

        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Narrative Framing</p>
          <p className="font-medium text-foreground capitalize">{article.framing}</p>
        </div>

        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Source Type</p>
          <p className="font-medium text-foreground capitalize">{article.source_type}</p>
        </div>
      </div>

      {/* AI Analysis Reasoning Section */}
      <div className="mb-6 border border-accent/30 rounded-lg overflow-hidden">
        <div className="bg-accent/10 px-4 py-3 border-b border-accent/30">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            <h4 className="text-sm font-medium text-foreground">AI Agent Analysis Reasoning</h4>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Transparent explanation of how our unbiased AI agents scored this article
          </p>
        </div>
        
        {/* Bias Reasoning */}
        {article.bias_reasoning_brief && (
          <div className="p-4 border-b border-accent/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 via-zinc-500 to-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">B</span>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-foreground mb-1">Bias Score Reasoning</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.bias_reasoning_brief}
                </p>
                
                {article.bias_reasoning_detailed && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowDetailedBias(!showDetailedBias)}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                    >
                      {showDetailedBias ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show detailed analysis
                        </>
                      )}
                    </button>
                    
                    {showDetailedBias && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {article.bias_reasoning_detailed}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Sentiment Reasoning */}
        {article.sentiment_reasoning_brief && (
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: sentimentInfo.color }}
              >
                <span className="text-xs font-bold text-white">S</span>
              </div>
              <div className="flex-1">
                <h5 className="text-sm font-medium text-foreground mb-1">Sentiment Score Reasoning</h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {article.sentiment_reasoning_brief}
                </p>
                
                {article.sentiment_reasoning_detailed && (
                  <div className="mt-3">
                    <button
                      onClick={() => setShowDetailedSentiment(!showDetailedSentiment)}
                      className="flex items-center gap-1 text-xs text-accent hover:text-accent/80 transition-colors font-medium"
                    >
                      {showDetailedSentiment ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Show less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          Show detailed analysis
                        </>
                      )}
                    </button>
                    
                    {showDetailedSentiment && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {article.sentiment_reasoning_detailed}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Claim */}
      {article.main_claim && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Main Claim</h4>
          <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3">
            {article.main_claim}
          </p>
        </div>
      )}

      {/* Missing Voices */}
      {article.missing_voices && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Missing Perspectives</h4>
          <p className="text-sm text-warning bg-warning/10 rounded-lg p-3">
            {article.missing_voices}
          </p>
        </div>
      )}

      {/* Loaded Words */}
      {article.loaded_words && article.loaded_words.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-foreground mb-2">Loaded Language Detected</h4>
          <div className="flex flex-wrap gap-2">
            {article.loaded_words.map((word, i) => (
              <span
                key={i}
                className="text-sm px-3 py-1 bg-warning/10 text-warning rounded-full"
              >
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
