export interface Article {
  id: number;
  source_type: 'reddit' | 'news' | 'blog';
  source_name: string;
  topic: string;
  title: string;
  body: string;
  url: string;
  published_at: string;
  sentiment_score: number;
  bias_score: number;
  emotion: string;
  bias_label: string;
  loaded_words: string[];
  main_claim: string;
  framing: string;
  missing_voices: string;
  bias_reasoning_brief: string;
  bias_reasoning_detailed: string;
  sentiment_reasoning_brief: string;
  sentiment_reasoning_detailed: string;
}

export interface AnalysisResult {
  topic: string;
  count: number;
  articles: Article[];
  echo_alert?: string;
}

export interface BiasDistribution {
  label: string;
  count: number;
  color: string;
}

export interface SourceStats {
  source_type: string;
  count: number;
  avg_bias: number;
  avg_sentiment: number;
}
