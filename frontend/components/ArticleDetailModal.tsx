"use client";
import React from "react";
import { X, ExternalLink, ShieldAlert, Sparkles, MessageSquare, VolumeX } from "lucide-react";
import { Article } from "@/lib/demoData";

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
}

export default function ArticleDetailModal({ article, onClose }: ArticleDetailModalProps) {
  if (!article) return null;

  const biasPercent = Math.min(100, Math.max(0, ((article.bias_score + 10) / 20) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/80 bg-[#121620] p-6 sm:p-8 shadow-2xl shadow-purple-950/40 text-slate-100">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-full p-2 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Source metadata */}
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400">
          <span>{article.source_type}</span>
          <span>&bull;</span>
          <span className="text-slate-300">{article.source_name}</span>
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-snug">
          {article.title}
        </h2>

        {/* Action Link */}
        {article.url && (
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-400 hover:text-purple-300 mb-6 group"
          >
            <span>Read full original article</span>
            <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        )}

        {/* AI Bias & Sentiment Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Bias Score Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c101a] p-4">
            <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-2">
              <span>Political Spectrum Score</span>
              <strong className="text-white">
                {article.bias_score > 0 ? `+${article.bias_score.toFixed(1)}` : article.bias_score.toFixed(1)}
              </strong>
            </div>

            {/* Range bar */}
            <div className="relative h-2 w-full rounded-full bg-slate-800 overflow-hidden mb-2">
              <div
                className="absolute top-0 bottom-0 w-3 rounded-full bg-purple-500 shadow-md shadow-purple-500"
                style={{ left: `calc(${biasPercent}% - 6px)` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-10 Far Left</span>
              <span>0 Center</span>
              <span>+10 Far Right</span>
            </div>
            <div className="mt-2 text-xs font-semibold text-purple-300">
              Classification: {article.bias_label}
            </div>
          </div>

          {/* Sentiment & Framing Card */}
          <div className="rounded-2xl border border-slate-800 bg-[#0c101a] p-4 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center text-xs font-medium text-slate-400 mb-1">
                <span>Sentiment & Tone</span>
                <strong className="text-white">
                  {article.sentiment_score > 0 ? `+${article.sentiment_score.toFixed(2)}` : article.sentiment_score.toFixed(2)}
                </strong>
              </div>
              <div className="text-xs text-slate-300 font-medium">
                Dominant Emotion: <span className="text-amber-300">{article.emotion || "Neutral"}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-300 font-medium">
              Narrative Frame: <span className="text-emerald-400">{article.framing || "Neutral"}</span>
            </div>
            {article.sensationalism_score !== undefined && (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-300 font-medium border-t border-slate-800/80 pt-2">
                <span>Sensationalism Index:</span>
                <span className={article.sensationalism_score >= 6.5 ? "text-rose-400 font-bold" : article.sensationalism_score >= 4.0 ? "text-amber-400" : "text-emerald-400"}>
                  {article.sensationalism_score.toFixed(1)} / 10
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Narrative & Evidence Analysis Section */}
        <div className="space-y-4 text-xs sm:text-sm">
          {/* Evidence Quote */}
          {article.evidence_quote && (
            <div className="rounded-2xl border border-blue-500/20 bg-blue-950/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-blue-300 mb-1">
                <MessageSquare className="h-4 w-4" />
                <span>Framing Evidence Quote</span>
              </div>
              <p className="text-slate-200 italic leading-relaxed">
                &ldquo;{article.evidence_quote}&rdquo;
              </p>
            </div>
          )}

          {/* Main claim */}
          {article.main_claim && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-950/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-purple-300 mb-1">
                <Sparkles className="h-4 w-4" />
                <span>Central Narrative Claim</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {article.main_claim}
              </p>
            </div>
          )}

          {/* Missing voices */}
          {article.missing_voices && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4">
              <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                <VolumeX className="h-4 w-4" />
                <span>Missing Voices / Blindspots</span>
              </div>
              <p className="text-slate-200 leading-relaxed">
                {article.missing_voices}
              </p>
            </div>
          )}

          {/* Loaded vocabulary */}
          {article.loaded_words && article.loaded_words.length > 0 && (
            <div className="rounded-2xl border border-slate-800 bg-[#0c101a] p-4">
              <div className="flex items-center gap-2 font-semibold text-slate-300 mb-2">
                <ShieldAlert className="h-4 w-4 text-amber-400" />
                <span>Polarizing & Loaded Vocabulary</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {article.loaded_words.map((w, i) => (
                  <span
                    key={i}
                    className="rounded-lg border border-amber-500/30 bg-[#241a0e] px-2.5 py-1 text-xs font-semibold text-amber-300"
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
