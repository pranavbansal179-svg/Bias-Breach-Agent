"use client";
import React, { useEffect, useRef } from "react";
import * as d3 from "d3";
import { Article } from "@/lib/demoData";

interface SentimentMapProps {
  articles: Article[];
  onSelectArticle?: (article: Article) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: "#8B5CF6", // Neon purple
  news: "#0D9488",   // Teal
  blog: "#EA580C",   // Orange
};

export default function SentimentMap({ articles, onSelectArticle }: SentimentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !articles.length) return;

    // Responsive dimensions
    const width = 720;
    const height = 460;
    const margin = { top: 35, right: 35, bottom: 50, left: 60 };

    // Clear previous elements
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%");

    // Scales
    const xScale = d3
      .scaleLinear()
      .domain([-10, 10])
      .range([margin.left, width - margin.right]);

    const yScale = d3
      .scaleLinear()
      .domain([-1.0, 1.0])
      .range([height - margin.bottom, margin.top]);

    // Background Canvas
    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "#0c101a")
      .attr("rx", 12);

    // Quadrant Watermark Background Labels
    const quadrantLabels = [
      { text: "Left + Positive", x: margin.left + 20, y: margin.top + 28, anchor: "start" },
      { text: "Right + Positive", x: width - margin.right - 20, y: margin.top + 28, anchor: "end" },
      { text: "Left + Negative", x: margin.left + 20, y: height - margin.bottom - 20, anchor: "start" },
      { text: "Right + Negative", x: width - margin.right - 20, y: height - margin.bottom - 20, anchor: "end" },
    ];

    quadrantLabels.forEach((q) => {
      svg
        .append("text")
        .attr("x", q.x)
        .attr("y", q.y)
        .attr("text-anchor", q.anchor)
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .attr("fill", "#334155")
        .attr("letter-spacing", "0.5px")
        .text(q.text);
    });

    // Crosshairs Grid Lines (Zero lines)
    // Vertical Zero Axis
    svg
      .append("line")
      .attr("x1", xScale(0))
      .attr("x2", xScale(0))
      .attr("y1", margin.top)
      .attr("y2", height - margin.bottom)
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4");

    // Horizontal Zero Axis
    svg
      .append("line")
      .attr("x1", margin.left)
      .attr("x2", width - margin.right)
      .attr("y1", yScale(0))
      .attr("y2", yScale(0))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "4,4");

    // Subtle Outer Border
    svg
      .append("rect")
      .attr("x", margin.left)
      .attr("y", margin.top)
      .attr("width", width - margin.left - margin.right)
      .attr("height", height - margin.top - margin.bottom)
      .attr("fill", "none")
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1)
      .attr("rx", 12);

    // X Axis
    const xAxis = d3
      .axisBottom(xScale)
      .tickValues([-10, -5, 0, 5, 10])
      .tickFormat((d) => (Number(d) > 0 ? `+${d}` : `${d}`));

    svg
      .append("g")
      .attr("transform", `translate(0, ${height - margin.bottom})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#1e293b"))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "11px").attr("font-weight", "500")
      );

    // Y Axis
    const yAxis = d3.axisLeft(yScale).tickValues([-1.0, -0.5, 0.0, 0.5, 1.0]).tickFormat((d) => {
      const val = Number(d);
      return val > 0 ? `+${val.toFixed(1)}` : `${val.toFixed(1)}`;
    });

    svg
      .append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll(".tick line").attr("stroke", "#1e293b"))
      .call((g) =>
        g.selectAll(".tick text").attr("fill", "#64748b").attr("font-size", "11px").attr("font-weight", "500")
      );

    // Axis Labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .text("Left Bias Political Spectrum Right Bias");

    svg
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("x", -(height / 2))
      .attr("y", 18)
      .attr("text-anchor", "middle")
      .attr("font-size", "12px")
      .attr("font-weight", "500")
      .attr("fill", "#64748b")
      .text("Negative Sentiment Positive");

    // Tooltip
    let tooltip: any = d3.select("#sentiment-map-tooltip");
    if (tooltip.empty()) {
      tooltip = d3
        .select("body")
        .append("div")
        .attr("id", "sentiment-map-tooltip")
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("background", "rgba(15, 20, 31, 0.95)")
        .style("border", "1px solid rgba(255, 255, 255, 0.12)")
        .style("backdrop-filter", "blur(8px)")
        .style("color", "#f8fafc")
        .style("padding", "10px 14px")
        .style("border-radius", "12px")
        .style("font-size", "12px")
        .style("max-width", "280px")
        .style("box-shadow", "0 12px 30px rgba(0,0,0,0.5)")
        .style("opacity", "0")
        .style("z-index", "9999")
        .style("transition", "opacity 0.15s ease-out");
    }

    // Render Data Dots
    const dots = svg
      .append("g")
      .attr("class", "dots")
      .selectAll("circle")
      .data(articles)
      .join("circle")
      .attr("cx", (d) => xScale(d.bias_score ?? 0))
      .attr("cy", (d) => yScale(d.sentiment_score ?? 0))
      .attr("r", 7.5)
      .attr("fill", (d) => {
        const type = (d.source_type || "").toLowerCase();
        return SOURCE_COLORS[type] || "#0D9488";
      })
      .attr("opacity", 0.9)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");

    // Interactive Hover & Click
    dots
      .on("mouseenter", function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 11)
          .attr("stroke-width", 2.5);

        const biasFormat = d.bias_score > 0 ? `+${d.bias_score.toFixed(1)}` : d.bias_score.toFixed(1);
        const sentFormat = d.sentiment_score > 0 ? `+${d.sentiment_score.toFixed(2)}` : d.sentiment_score.toFixed(2);

        tooltip
          .style("opacity", "1")
          .html(`
            <div class="space-y-1">
              <div class="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-1 mb-1.5">
                <span class="font-semibold text-white">${d.source_name}</span>
                <span class="text-[11px] text-slate-400 capitalize">${d.source_type}</span>
              </div>
              <div class="font-medium text-slate-200 line-clamp-2 leading-snug">${d.title}</div>
              <div class="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                <span>Bias: <strong class="text-white">${biasFormat}</strong></span>
                <span>Sentiment: <strong class="text-white">${sentFormat}</strong></span>
              </div>
              <div class="text-[10px] text-purple-400 font-medium pt-0.5">Click to inspect article details &rarr;</div>
            </div>
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", `${event.pageX + 14}px`)
          .style("top", `${event.pageY - 34}px`);
      })
      .on("mouseleave", function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr("r", 7.5)
          .attr("stroke-width", 1.5);

        tooltip.style("opacity", "0");
      })
      .on("click", (event, d) => {
        if (onSelectArticle) {
          onSelectArticle(d);
        } else if (d.url) {
          window.open(d.url, "_blank");
        }
      });

    return () => {
      tooltip.style("opacity", "0");
    };
  }, [articles, onSelectArticle]);

  return (
    <div ref={containerRef} className="w-full">
      {/* Top Title & Legend Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-white tracking-wide">
          Sentiment Map
        </h2>
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#8B5CF6]" />
            Reddit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#0D9488]" />
            News
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#EA580C]" />
            Blog
          </span>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden rounded-2xl border border-slate-800/80 bg-[#121620] p-2">
        <svg ref={svgRef} className="w-full aspect-[720/460]" />
      </div>

      {/* Footnote matching screenshot */}
      <p className="text-center text-xs text-slate-500 mt-3 font-medium">
        Click on any point to view the full article. Position indicates bias (X) and sentiment (Y) scores.
      </p>
    </div>
  );
}