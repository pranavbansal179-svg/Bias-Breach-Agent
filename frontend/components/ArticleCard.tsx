'use client';
import { Article } from '@/lib/types';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  isSelected?: boolean;
  onClick?: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: '#7c3aed',
  news: '#0d9488',
  blog: '#ea580c',
};

const BIAS_LABELS: Record<string, { label: string; color: string }> = {
  'far-left': { label: 'Far Left', color: '#3b82f6' },
  'left': { label: 'Left', color: '#60a5fa' },
  'center-left': { label: 'Center Left', color: '#93c5fd' },
  'center': { label: 'Center', color: '#a1a1aa' },
  'center-right': { label: 'Center Right', color: '#fca5a5' },
  'right': { label: 'Right', color: '#f87171' },
  'far-right': { label: 'Far Right', color: '#ef4444' },
};

function getBiasInfo(label: string) {
  return BIAS_LABELS[label] || { label: 'Unknown', color: '#71717a' };
}

function getSentimentIcon(score: number) {
  if (score > 0.2) return <TrendingUp className="w-4 h-4 text-success" />;
  if (score < -0.2) return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
}

export default function ArticleCard({ article, isSelected, onClick }: ArticleCardProps) {
  const biasInfo = getBiasInfo(article.bias_label);
  const sourceColor = SOURCE_COLORS[article.source_type] || '#71717a';
  
  return (
    <div
      className={`p-4 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'bg-accent/10 border-accent'
          : 'bg-card border-border hover:border-muted-foreground/50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: sourceColor }}
          />
          <span className="text-xs font-medium text-muted-foreground">
            {article.source_name}
          </span>
        </div>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
      
      <h4 className="font-medium text-foreground text-sm leading-snug mb-3 line-clamp-2">
        {article.title}
      </h4>
      
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: biasInfo.color }}
          />
          <span className="text-xs text-muted-foreground">{biasInfo.label}</span>
        </div>
        
        <div className="flex items-center gap-1">
          {getSentimentIcon(article.sentiment_score)}
          <span className="text-xs text-muted-foreground capitalize">
            {article.emotion}
          </span>
        </div>
        
        <span
          className="text-xs px-2 py-0.5 rounded-full capitalize"
          style={{
            backgroundColor: `${sourceColor}20`,
            color: sourceColor,
          }}
        >
          {article.framing}
        </span>
      </div>
      
      {article.loaded_words && article.loaded_words.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1.5">Loaded words:</p>
          <div className="flex flex-wrap gap-1.5">
            {article.loaded_words.slice(0, 3).map((word, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 bg-warning/10 text-warning rounded"
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
