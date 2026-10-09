"use client";
import React from "react";
import { ExternalLink, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Article } from "@/lib/demoData";

interface ArticleCardProps {
  article: Article;
  onSelect?: (article: Article) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: "bg-[#8B5CF6]",
  news: "bg-[#0D9488]",
  blog: "bg-[#EA580C]",
};

export default function ArticleCard({ article, onSelect }: ArticleCardProps) {
  const type = (article.source_type || "").toLowerCase();
  const dotColor = SOURCE_COLORS[type] || "bg-slate-400";

  // Sentiment icon & color
  let SentimentIcon = Minus;
  let sentimentColor = "text-slate-400 border-slate-700/60 bg-slate-800/40";
  const sent = article.sentiment_score ?? 0;
  const emotion = (article.emotion || "neutral").toLowerCase();

  if (sent < -0.15 || emotion === "outrage" || emotion === "negative") {
    SentimentIcon = TrendingDown;
    sentimentColor = "text-rose-400 border-rose-500/20 bg-rose-950/30";
  } else if (sent > 0.15 || emotion === "positive") {
    SentimentIcon = TrendingUp;
    sentimentColor = "text-emerald-400 border-emerald-500/20 bg-emerald-950/30";
  }

  // Framing badge color
  const rawFraming = article.framing || "Neutral";
  const framing = rawFraming.charAt(0).toUpperCase() + rawFraming.slice(1);
  let framingColor = "text-slate-300 border-slate-700/60 bg-slate-800/40";
  if (framing === "Opportunity") {
    framingColor = "text-emerald-400 border-emerald-500/20 bg-emerald-950/30";
  } else if (framing === "Threat") {
    framingColor = "text-rose-400 border-rose-500/20 bg-rose-950/30";
  } else if (framing === "Conflict") {
    framingColor = "text-purple-400 border-purple-500/20 bg-purple-950/30";
  }

  // Bias badge color
  const biasLabel = article.bias_label || "Center";
  let biasColor = "text-slate-300";
  if (biasLabel.toLowerCase().includes("left")) {
    biasColor = "text-blue-400";
  } else if (biasLabel.toLowerCase().includes("right")) {
    biasColor = "text-red-400";
  }

  const loadedWords = Array.isArray(article.loaded_words)
    ? article.loaded_words
    : [];

  return (
    <div
      onClick={() => onSelect && onSelect(article)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#121620] p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-950/20 cursor-pointer"
    >
      <div>
        {/* Header: Source and External Link */}
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${dotColor}`} />
            <span className="text-xs font-semibold text-slate-300">
              {article.source_name}
            </span>
          </div>
          {article.url && (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-lg p-1 text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Open original article"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white line-clamp-2 leading-snug mb-3 group-hover:text-purple-200 transition-colors">
          {article.title}
        </h3>

        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mb-3.5">
          {/* Bias pill */}
          <span className={`flex items-center gap-1.5 text-xs font-medium ${biasColor}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {biasLabel}
          </span>

          {/* Sentiment pill */}
          <span
            className={`flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-medium ${sentimentColor}`}
          >
            <SentimentIcon className="h-3 w-3" />
            {article.emotion || "Neutral"}
          </span>

          {/* Framing pill */}
          <span
            className={`rounded-lg border px-2 py-0.5 text-[11px] font-medium ${framingColor}`}
          >
            {framing}
          </span>
        </div>
      </div>

      {/* Loaded Words Section */}
      {loadedWords.length > 0 && (
        <div className="border-t border-slate-800/60 pt-3 mt-1">
          <span className="text-[11px] font-medium text-slate-400 block mb-1.5">
            Loaded words:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {loadedWords.map((word, idx) => (
              <span
                key={idx}
                className="rounded-md border border-amber-500/30 bg-[#241a0e] px-2 py-0.5 text-[11px] font-medium text-amber-300"
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
