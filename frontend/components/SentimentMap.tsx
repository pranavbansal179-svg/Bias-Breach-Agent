'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Article } from '@/lib/types';

interface SentimentMapProps {
  articles: Article[];
  onArticleSelect?: (article: Article) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  reddit: '#7c3aed',
  news: '#0d9488',
  blog: '#ea580c',
};

const SOURCE_LABELS: Record<string, string> = {
  reddit: 'Reddit',
  news: 'News',
  blog: 'Blog',
};

export default function SentimentMap({ articles, onArticleSelect }: SentimentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [hoveredArticle, setHoveredArticle] = useState<Article | null>(null);

  // Handle resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({
        width: Math.max(400, width),
        height: Math.max(350, Math.min(500, width * 0.6)),
      });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !articles.length) return;

    const { width: W, height: H } = dimensions;
    const M = { top: 50, right: 30, bottom: 60, left: 60 };

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3
      .select(svgRef.current)
      .attr('width', W)
      .attr('height', H)
      .attr('viewBox', `0 0 ${W} ${H}`);

    // Scales
    const xScale = d3.scaleLinear().domain([-10, 10]).range([M.left, W - M.right]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([H - M.bottom, M.top]);

    // Background quadrants
    const quadrantColors = [
      { x: M.left, y: M.top, w: xScale(0) - M.left, h: yScale(0) - M.top, fill: 'rgba(239, 68, 68, 0.03)' },
      { x: xScale(0), y: M.top, w: W - M.right - xScale(0), h: yScale(0) - M.top, fill: 'rgba(16, 185, 129, 0.03)' },
      { x: M.left, y: yScale(0), w: xScale(0) - M.left, h: H - M.bottom - yScale(0), fill: 'rgba(239, 68, 68, 0.05)' },
      { x: xScale(0), y: yScale(0), w: W - M.right - xScale(0), h: H - M.bottom - yScale(0), fill: 'rgba(249, 115, 22, 0.03)' },
    ];

    svg
      .selectAll('rect.quadrant')
      .data(quadrantColors)
      .join('rect')
      .attr('class', 'quadrant')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('width', (d) => d.w)
      .attr('height', (d) => d.h)
      .attr('fill', (d) => d.fill);

    // Grid lines
    const xGridLines = [-7.5, -5, -2.5, 0, 2.5, 5, 7.5];
    const yGridLines = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75];

    svg
      .selectAll('line.x-grid')
      .data(xGridLines)
      .join('line')
      .attr('class', 'x-grid')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', M.top)
      .attr('y2', H - M.bottom)
      .attr('stroke', d => d === 0 ? '#3f3f46' : '#27272a')
      .attr('stroke-width', d => d === 0 ? 1.5 : 1)
      .attr('stroke-dasharray', d => d === 0 ? 'none' : '4,4');

    svg
      .selectAll('line.y-grid')
      .data(yGridLines)
      .join('line')
      .attr('class', 'y-grid')
      .attr('x1', M.left)
      .attr('x2', W - M.right)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', d => d === 0 ? '#3f3f46' : '#27272a')
      .attr('stroke-width', d => d === 0 ? 1.5 : 1)
      .attr('stroke-dasharray', d => d === 0 ? 'none' : '4,4');

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues([-10, -5, 0, 5, 10])
      .tickFormat((d) => `${Number(d) > 0 ? '+' : ''}${d}`);

    const yAxis = d3.axisLeft(yScale)
      .tickValues([-1, -0.5, 0, 0.5, 1])
      .tickFormat((d) => `${Number(d) > 0 ? '+' : ''}${Number(d).toFixed(1)}`);

    svg
      .append('g')
      .attr('transform', `translate(0,${H - M.bottom})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 11);

    svg
      .append('g')
      .attr('transform', `translate(${M.left},0)`)
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .attr('font-size', 11);

    // Style axis lines
    svg.selectAll('.domain').attr('stroke', '#27272a');
    svg.selectAll('.tick line').attr('stroke', '#27272a');

    // Axis labels
    svg
      .append('text')
      .attr('x', W / 2)
      .attr('y', H - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', '#71717a')
      .text('Left Bias                    Political Spectrum                    Right Bias');

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(H / 2))
      .attr('y', 16)
      .attr('text-anchor', 'middle')
      .attr('font-size', 12)
      .attr('fill', '#71717a')
      .text('Negative         Sentiment         Positive');

    // Corner labels
    const cornerLabels = [
      { x: M.left + 10, y: M.top + 20, text: 'Left + Positive', anchor: 'start' },
      { x: W - M.right - 10, y: M.top + 20, text: 'Right + Positive', anchor: 'end' },
      { x: M.left + 10, y: H - M.bottom - 10, text: 'Left + Negative', anchor: 'start' },
      { x: W - M.right - 10, y: H - M.bottom - 10, text: 'Right + Negative', anchor: 'end' },
    ];

    svg
      .selectAll('text.corner-label')
      .data(cornerLabels)
      .join('text')
      .attr('class', 'corner-label')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('text-anchor', (d) => d.anchor)
      .attr('font-size', 10)
      .attr('fill', '#52525b')
      .attr('font-weight', 500)
      .text((d) => d.text);

    // Data points with animation
    svg
      .selectAll('circle.data-point')
      .data(articles)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.bias_score ?? 0))
      .attr('cy', (d) => yScale(d.sentiment_score ?? 0))
      .attr('r', 0)
      .attr('fill', (d) => SOURCE_COLORS[d.source_type] || '#94A3B8')
      .attr('opacity', 0.85)
      .attr('stroke', '#0a0a0a')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 14)
          .attr('opacity', 1);
        setHoveredArticle(d);
        
        if (tooltipRef.current) {
          const rect = containerRef.current?.getBoundingClientRect();
          if (rect) {
            tooltipRef.current.style.left = `${event.clientX - rect.left + 15}px`;
            tooltipRef.current.style.top = `${event.clientY - rect.top - 10}px`;
          }
        }
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 10)
          .attr('opacity', 0.85);
        setHoveredArticle(null);
      })
      .on('click', (_, d) => {
        if (onArticleSelect) {
          onArticleSelect(d);
        } else {
          window.open(d.url, '_blank');
        }
      })
      .transition()
      .duration(600)
      .delay((_, i) => i * 50)
      .attr('r', 10);

  }, [articles, dimensions, onArticleSelect]);

  return (
    <div className="relative" ref={containerRef}>
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Sentiment Map</h3>
          <div className="flex items-center gap-4">
            {Object.entries(SOURCE_COLORS).map(([key, color]) => (
              <div key={key} className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-muted-foreground">{SOURCE_LABELS[key]}</span>
              </div>
            ))}
          </div>
        </div>
        
        <svg ref={svgRef} className="w-full" />
        
        {/* Tooltip */}
        {hoveredArticle && (
          <div
            ref={tooltipRef}
            className="absolute z-50 pointer-events-none bg-card border border-border rounded-lg shadow-xl p-3 max-w-xs"
            style={{ opacity: hoveredArticle ? 1 : 0 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: SOURCE_COLORS[hoveredArticle.source_type] }}
              />
              <span className="text-xs font-medium text-muted-foreground">
                {hoveredArticle.source_name}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground line-clamp-2 mb-2">
              {hoveredArticle.title}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Bias: {hoveredArticle.bias_score > 0 ? '+' : ''}{hoveredArticle.bias_score.toFixed(1)}</span>
              <span>Sentiment: {hoveredArticle.sentiment_score > 0 ? '+' : ''}{hoveredArticle.sentiment_score.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Click on any point to view the full article. Position indicates bias (X) and sentiment (Y) scores.
      </p>
    </div>
  );
}
