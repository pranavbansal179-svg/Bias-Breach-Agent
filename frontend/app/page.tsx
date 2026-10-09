"use client";
import React, { useState, useEffect, useCallback } from "react";
import {
  Activity,
  Search,
  Filter,
  LayoutGrid,
  List,
  Sparkles,
  Loader2,
  RefreshCw,
} from "lucide-react";
import SentimentMap from "@/components/SentimentMap";
import ArticleCard from "@/components/ArticleCard";
import EchoAlert from "@/components/EchoAlert";
import KpiMetrics from "@/components/KpiMetrics";
import SidebarAnalytics from "@/components/SidebarAnalytics";
import ArticleDetailModal from "@/components/ArticleDetailModal";
import TrendMemoryDialog from "@/components/TrendMemoryDialog";
import { analyzeTopic, getResults } from "@/lib/api";
import { DEMO_TOPICS, Article, TopicAnalysis } from "@/lib/demoData";

const SUGGESTED_TOPICS = [
  "Artificial Intelligence",
  "Climate Change",
  "Immigration Policy",
  "Economic Policy",
  "Healthcare Reform",
];

export default function Home() {
  const [topic, setTopic] = useState("Artificial Intelligence");
  const [activeTopic, setActiveTopic] = useState("Artificial Intelligence");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TopicAnalysis>(DEMO_TOPICS["Artificial Intelligence"]);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isMemoryOpen, setIsMemoryOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadTopic = useCallback(async (targetTopic: string) => {
    if (!targetTopic.trim()) return;
    setLoading(true);
    setStatusMessage("Fetching media coverage and multi-agent bias analysis...");

    try {
      const res = await getResults(targetTopic);
      if (res && res.count > 0) {
        setData(res);
        setActiveTopic(res.topic);
      } else {
        // Use demo fallback if topic matches one of the suggested topics
        const matchedDemo = Object.keys(DEMO_TOPICS).find(
          (k) => k.toLowerCase() === targetTopic.toLowerCase()
        );
        if (matchedDemo && DEMO_TOPICS[matchedDemo]) {
          setData(DEMO_TOPICS[matchedDemo]);
          setActiveTopic(matchedDemo);
        }
      }
    } catch (err) {
      console.error("Error loading topic:", err);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadTopic("Artificial Intelligence");
  }, [loadTopic]);

  async function handleAnalyze(customTopic?: string) {
    const query = (customTopic || topic).trim();
    if (!query) return;

    setTopic(query);
    setLoading(true);
    setStatusMessage("Triggering scrapers & multi-agent bias pipeline...");

    try {
      // 1. Live multi-feed discovery & parallel bias analysis on backend
      const result = await analyzeTopic(query);
      if (result && result.articles && result.articles.length > 0) {
        setData(result);
        setActiveTopic(result.topic);
        setLoading(false);
        setStatusMessage("");
        return;
      }

      // 2. Fallback to pre-cached demo datasets if backend is unreachable
      const matchedDemo = Object.keys(DEMO_TOPICS).find(
        (k) => k.toLowerCase() === query.toLowerCase()
      );
      if (matchedDemo && DEMO_TOPICS[matchedDemo]) {
        setData(DEMO_TOPICS[matchedDemo]);
        setActiveTopic(matchedDemo);
        setLoading(false);
        setStatusMessage("");
        return;
      }

      // 3. Query getResults
      const res = await getResults(query);
      if (res && res.articles && res.articles.length > 0) {
        setData(res);
        setActiveTopic(res.topic);
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setLoading(false);
      setStatusMessage("");
    }
  }

  // Filter articles by source
  const filteredArticles = data.articles.filter((art) => {
    if (filterSource === "all") return true;
    return (art.source_type || "").toLowerCase() === filterSource.toLowerCase();
  });

  const countReddit = data.articles.filter(
    (a) => (a.source_type || "").toLowerCase() === "reddit"
  ).length;
  const countNews = data.articles.filter(
    (a) => (a.source_type || "").toLowerCase() === "news"
  ).length;
  const countBlog = data.articles.filter(
    (a) => (a.source_type || "").toLowerCase() === "blog"
  ).length;

  return (
    <main className="min-h-screen bg-[#0b0e14] text-slate-100 selection:bg-purple-500 selection:text-white pb-20">
      {/* 1. Header Navbar */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#0b0e14]/90 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-lg shadow-purple-950/40">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Bias Breach Agent
              </h1>
              <p className="text-xs font-medium text-slate-400">
                Echo Chamber Tracker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Trend Memory RAG Button */}
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-purple-500/40 bg-purple-950/30 px-3.5 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-900/40 hover:text-white transition-all shadow-sm"
              title="Query AI Trend Memory"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span className="hidden sm:inline">Ask Trend Memory</span>
            </button>

            {/* GitHub Link */}
            <a
              href="https://github.com/pranavbansal179-svg/Bias-Breach-Agent"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border border-slate-800 bg-[#121620] px-3.5 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-700 transition-all"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* 2. Search & Analyze Bar */}
        <div className="mb-4">
          <div className="relative flex items-center rounded-2xl border border-slate-700/60 bg-[#121620] p-1.5 shadow-lg shadow-black/40 focus-within:border-purple-500/80 transition-colors">
            <div className="pl-3.5 pr-2 text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAnalyze()}
              placeholder="Enter a topic (e.g. Artificial Intelligence)"
              className="flex-1 bg-transparent py-2 px-2 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-900/40 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <span>Analyze</span>
              )}
            </button>
          </div>
        </div>

        {/* 3. Suggested Topic Pills */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none text-xs">
          <span className="font-semibold text-slate-400 shrink-0">Suggested:</span>
          {SUGGESTED_TOPICS.map((t) => {
            const isActive = activeTopic.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                onClick={() => {
                  setTopic(t);
                  handleAnalyze(t);
                }}
                className={`shrink-0 rounded-full px-4 py-1.5 font-medium transition-all ${
                  isActive
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                    : "bg-[#121620] text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* Loading status indicator */}
        {loading && statusMessage && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-purple-500/30 bg-purple-950/20 px-4 py-3 text-xs sm:text-sm text-purple-300">
            <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* 4. Echo Chamber Alert */}
        <EchoAlert topic={activeTopic} alert={data.echo_alert} />

        {/* 5. Top KPI Stat Cards */}
        <KpiMetrics stats={data.stats} />

        {/* 6. Sentiment Map (Left) + Sidebar Analytics (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12 items-start">
          {/* Left Column: D3.js 2D Sentiment Map (7 Cols) */}
          <div className="lg:col-span-8">
            <SentimentMap
              articles={data.articles}
              onSelectArticle={(art) => setSelectedArticle(art)}
            />
          </div>

          {/* Right Column: Sidebar Analytics (4 Cols) */}
          <div className="lg:col-span-4">
            <SidebarAnalytics stats={data.stats} />
          </div>
        </div>

        {/* 7. Articles Section */}
        <div className="mt-8 border-t border-slate-800/80 pt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Articles ({filteredArticles.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click on an article to view detailed analysis
              </p>
            </div>

            {/* Filter and View Switcher */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-[#121620] p-1 text-xs">
                <Filter className="h-3.5 w-3.5 text-slate-500 ml-2" />
                <button
                  onClick={() => setFilterSource("all")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    filterSource === "all"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterSource("reddit")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    filterSource === "reddit"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Reddit ({countReddit})
                </button>
                <button
                  onClick={() => setFilterSource("news")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    filterSource === "news"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  News ({countNews})
                </button>
                <button
                  onClick={() => setFilterSource("blog")}
                  className={`rounded-lg px-2.5 py-1 font-medium transition-all ${
                    filterSource === "blog"
                      ? "bg-purple-600 text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Blog ({countBlog})
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center rounded-xl border border-slate-800 bg-[#121620] p-1 text-slate-400">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-lg p-1.5 transition-all ${
                    viewMode === "grid" ? "bg-slate-800 text-white" : "hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-lg p-1.5 transition-all ${
                    viewMode === "list" ? "bg-slate-800 text-white" : "hover:text-white"
                  }`}
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Articles Grid or List */}
          {filteredArticles.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500">
              No articles match the selected source filter.
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onSelect={(art) => setSelectedArticle(art)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  onSelect={(art) => setSelectedArticle(art)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Article Detail Inspection Modal */}
      <ArticleDetailModal
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />

      {/* Trend Memory RAG Assistant Modal */}
      <TrendMemoryDialog
        topic={activeTopic}
        isOpen={isMemoryOpen}
        onClose={() => setIsMemoryOpen(false)}
      />
    </main>
  );
}