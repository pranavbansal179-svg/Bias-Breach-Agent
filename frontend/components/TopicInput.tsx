'use client';
import { Search, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { SUGGESTED_TOPICS } from '@/lib/mock-data';

interface TopicInputProps {
  onAnalyze: (topic: string) => void;
  isLoading: boolean;
}

export default function TopicInput({ onAnalyze, isLoading }: TopicInputProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isLoading) {
      onAnalyze(topic.trim());
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
    onAnalyze(suggestion);
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter a topic to analyze (e.g., Artificial Intelligence)"
            className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="px-6 py-3 bg-accent text-accent-foreground font-medium rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            'Analyze'
          )}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Suggested:</span>
        {SUGGESTED_TOPICS.slice(0, 5).map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => handleSuggestionClick(suggestion)}
            disabled={isLoading}
            className="px-3 py-1.5 text-sm bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
