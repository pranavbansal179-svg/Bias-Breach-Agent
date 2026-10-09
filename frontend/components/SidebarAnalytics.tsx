"use client";
import React from "react";
import { TopicStats } from "@/lib/demoData";

interface SidebarAnalyticsProps {
  stats: TopicStats;
}

export default function SidebarAnalytics({ stats }: SidebarAnalyticsProps) {
  const totalSources =
    (stats.source_distribution.news || 0) +
    (stats.source_distribution.reddit || 0) +
    (stats.source_distribution.blog || 0) || 1;

  const newsPct = Math.round(((stats.source_distribution.news || 0) / totalSources) * 100);
  const redditPct = Math.round(((stats.source_distribution.reddit || 0) / totalSources) * 100);
  const blogPct = Math.round(((stats.source_distribution.blog || 0) / totalSources) * 100);

  const totalBias =
    (stats.bias_spectrum.left || 0) +
    (stats.bias_spectrum.center || 0) +
    (stats.bias_spectrum.right || 0) || 1;

  const leftPct = ((stats.bias_spectrum.left || 0) / totalBias) * 100;
  const centerPct = ((stats.bias_spectrum.center || 0) / totalBias) * 100;
  const rightPct = ((stats.bias_spectrum.right || 0) / totalBias) * 100;

  return (
    <div className="flex flex-col gap-4">
      {/* 1. Source Distribution Card */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">
          Source Distribution
        </h3>
        <div className="space-y-3.5">
          {/* News */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#0D9488]" />
                News
              </span>
              <span className="text-white font-semibold">{stats.source_distribution.news}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-[#0D9488] transition-all duration-500"
                style={{ width: `${newsPct}%` }}
              />
            </div>
          </div>

          {/* Reddit */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" />
                Reddit
              </span>
              <span className="text-white font-semibold">{stats.source_distribution.reddit}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-[#8B5CF6] transition-all duration-500"
                style={{ width: `${redditPct}%` }}
              />
            </div>
          </div>

          {/* Blog */}
          <div>
            <div className="flex justify-between text-xs font-medium mb-1.5">
              <span className="flex items-center gap-2 text-slate-300">
                <span className="h-2 w-2 rounded-full bg-[#EA580C]" />
                Blog
              </span>
              <span className="text-white font-semibold">{stats.source_distribution.blog}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-[#EA580C] transition-all duration-500"
                style={{ width: `${blogPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Political Bias Spectrum */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-3 tracking-wide">
          Political Bias Spectrum
        </h3>

        {/* Segmented multi-color bar */}
        <div className="flex h-8 w-full overflow-hidden rounded-xl border border-slate-700/40 bg-slate-800/60 font-semibold text-xs text-white">
          {stats.bias_spectrum.left > 0 && (
            <div
              className="flex items-center justify-center bg-[#3B82F6] transition-all"
              style={{ width: `${leftPct}%` }}
              title={`Left: ${stats.bias_spectrum.left}`}
            >
              {stats.bias_spectrum.left}
            </div>
          )}
          {stats.bias_spectrum.center > 0 && (
            <div
              className="flex items-center justify-center bg-[#64748B] transition-all"
              style={{ width: `${centerPct}%` }}
              title={`Center: ${stats.bias_spectrum.center}`}
            >
              {stats.bias_spectrum.center}
            </div>
          )}
          {stats.bias_spectrum.right > 0 && (
            <div
              className="flex items-center justify-center bg-[#EF4444] transition-all"
              style={{ width: `${rightPct}%` }}
              title={`Right: ${stats.bias_spectrum.right}`}
            >
              {stats.bias_spectrum.right}
            </div>
          )}
        </div>

        {/* Labels below */}
        <div className="flex justify-between text-[11px] font-medium text-slate-400 mt-2 px-1">
          <span>Left</span>
          <span>Center</span>
          <span>Right</span>
        </div>
      </div>

      {/* 3. Narrative Framing Badges */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#121620] p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-white mb-3 tracking-wide">
          Narrative Framing
        </h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-400">
            <span>Opportunity</span>
            <span className="font-bold text-white bg-emerald-500/20 px-1.5 py-0.2 rounded-md">
              {stats.framing_distribution.Opportunity || 0}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-950/30 px-3 py-1.5 text-xs font-medium text-rose-400">
            <span>Threat</span>
            <span className="font-bold text-white bg-rose-500/20 px-1.5 py-0.2 rounded-md">
              {stats.framing_distribution.Threat || 0}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300">
            <span>Neutral</span>
            <span className="font-bold text-white bg-slate-700/40 px-1.5 py-0.2 rounded-md">
              {stats.framing_distribution.Neutral || 0}
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/20 bg-purple-950/30 px-3 py-1.5 text-xs font-medium text-purple-400">
            <span>Conflict</span>
            <span className="font-bold text-white bg-purple-500/20 px-1.5 py-0.2 rounded-md">
              {stats.framing_distribution.Conflict || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
