"use client";
import React from "react";
import { BarChart2, AlertTriangle, TrendingUp, Radio } from "lucide-react";
import { TopicStats } from "@/lib/demoData";

interface KpiMetricsProps {
  stats: TopicStats;
}

export default function KpiMetrics({ stats }: KpiMetricsProps) {
  const biasFormatted = stats.avg_bias > 0 ? `+${stats.avg_bias.toFixed(1)}` : `${stats.avg_bias.toFixed(1)}`;
  const sentFormatted = stats.avg_sentiment > 0 ? `+${stats.avg_sentiment.toFixed(2)}` : `${stats.avg_sentiment.toFixed(2)}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* 1. Articles Count */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Articles</span>
          <BarChart2 className="h-4 w-4 text-slate-400" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {stats.articles_count}
        </div>
      </div>

      {/* 2. Avg Bias */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Avg Bias</span>
          <AlertTriangle className="h-4 w-4 text-amber-400/80" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {biasFormatted}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {stats.bias_label}
          </span>
        </div>
      </div>

      {/* 3. Avg Sentiment */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Avg Sentiment</span>
          <TrendingUp className="h-4 w-4 text-emerald-400/80" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white tracking-tight">
            {sentFormatted}
          </span>
          <span className="text-xs font-medium text-slate-400">
            {stats.sentiment_label}
          </span>
        </div>
      </div>

      {/* 4. Dominant Tone */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium uppercase tracking-wider">Dominant Tone</span>
          <Radio className="h-4 w-4 text-purple-400/80" />
        </div>
        <div className="text-2xl font-bold text-white tracking-tight">
          {stats.dominant_tone || "Neutral"}
        </div>
      </div>
    </div>
  );
}
