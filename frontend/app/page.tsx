'use client';
import { useState, useCallback } from 'react';
import Header from '@/components/Header';
import TopicInput from '@/components/TopicInput';
import SentimentMap from '@/components/SentimentMap';
import ArticleCard from '@/components/ArticleCard';
import ArticleDetail from '@/components/ArticleDetail';
import StatsPanel from '@/components/StatsPanel';
import EchoAlert from '@/components/EchoAlert';
import { analyzeTopic, getResults } from '@/lib/api';
import { Article, AnalysisResult } from '@/lib/types';
import { Loader2, LayoutGrid, List, Filter } from 'lucide-react';

type SourceFilter = 'all' | 'reddit' | 'news' | 'blog';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = useCallback(async (topic: string) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setSelectedArticle(null);

    try {
      await analyzeTopic(topic);
      const data = await getResults(topic);
      
      if (data) {
        setResults(data);
      } else {
        setError('No results found for this topic. Please try a different topic.');
      }
    } catch (err) {
      setError('Failed to analyze topic. Please check your connection and try again.');
      console.error('[v0] Analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredArticles = results?.articles.filter(
    (article) => sourceFilter === 'all' || article.source_type === sourceFilter
  ) || [];

  const sourceStats = results?.articles.reduce((acc, article) => {
    acc[article.source_type] = (acc[article.source_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Topic Input Section */}
          <div className="mb-8">
            <TopicInput onAnalyze={handleAnalyze} isLoading={loading} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-accent animate-spin mb-4" />
              <p className="text-lg text-foreground font-medium">Analyzing media coverage...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Scraping sources, running sentiment analysis, and detecting bias patterns
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
              <p className="text-destructive">{error}</p>
            </div>
          )}

          {/* Results */}
          {results && !loading && (
            <div className="space-y-6">
              {/* Echo Alert */}
              {results.echo_alert && (
                <EchoAlert alert={results.echo_alert} topic={results.topic} />
              )}

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Map & Stats */}
                <div className="lg:col-span-2 space-y-6">
                  <SentimentMap
                    articles={filteredArticles}
                    onArticleSelect={(article) => setSelectedArticle(article)}
                  />

                  {/* Article Detail Panel (if selected) */}
                  {selectedArticle && (
                    <ArticleDetail
                      article={selectedArticle}
                      onClose={() => setSelectedArticle(null)}
                    />
                  )}
                </div>

                {/* Right Column - Stats */}
                <div className="space-y-6">
                  <StatsPanel articles={results.articles} />
                </div>
              </div>

              {/* Articles List Section */}
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Articles ({filteredArticles.length})
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Click on an article to view detailed analysis
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Source Filter */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                      <Filter className="w-4 h-4 text-muted-foreground ml-2" />
                      {(['all', 'reddit', 'news', 'blog'] as SourceFilter[]).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSourceFilter(filter)}
                          className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors ${
                            sourceFilter === filter
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {filter}
                          {filter !== 'all' && sourceStats[filter] && (
                            <span className="ml-1 opacity-70">({sourceStats[filter]})</span>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-muted rounded-lg p-1">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'grid'
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-label="Grid view"
                      >
                        <LayoutGrid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition-colors ${
                          viewMode === 'list'
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                        aria-label="List view"
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {filteredArticles.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No articles found for the selected filter.
                  </p>
                ) : (
                  <div
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4'
                        : 'space-y-3'
                    }
                  >
                    {filteredArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        isSelected={selectedArticle?.id === article.id}
                        onClick={() => setSelectedArticle(article)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !results && !error && (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
                <Filter className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Enter a topic to analyze
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                Search for any topic to see how different media sources cover it. 
                The AI will analyze sentiment, detect political bias, and identify echo chamber patterns.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Bias Breach Agent - Breaking the Echo Chamber
            </p>
            <p className="text-xs text-muted-foreground">
              Built with AI SDK, HuggingFace BERT, and LangChain
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
