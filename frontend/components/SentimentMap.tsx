// frontend/components/SentimentMap.tsx
'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Article {
  id: number; title: string; source_name: string;
  bias_score: number; sentiment_score: number;
  emotion: string; url: string;
}

const SOURCE_COLORS: Record<string, string> = {
  'reddit':  '#7C3AED',
  'news':    '#0D9488',
  'blog':    '#EA580C',
};

export default function SentimentMap({ articles }: { articles: Article[] }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !articles.length) return;
    const W = 800, H = 500, M = { top: 40, right: 40, bottom: 50, left: 60 };

    d3.select(svgRef.current).selectAll('*').remove();
    const svg = d3.select(svgRef.current)
      .attr('width', W).attr('height', H);

    // Scales
    const xScale = d3.scaleLinear().domain([-10, 10]).range([M.left, W - M.right]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([H - M.bottom, M.top]);

    // Grid lines
    svg.append('line').attr('x1', xScale(0)).attr('x2', xScale(0))
       .attr('y1', M.top).attr('y2', H - M.bottom)
       .attr('stroke', '#E2E8F0').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
    svg.append('line').attr('x1', M.left).attr('x2', W - M.right)
       .attr('y1', yScale(0)).attr('y2', yScale(0))
       .attr('stroke', '#E2E8F0').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');

    // Axes
    svg.append('g').attr('transform', `translate(0,${H - M.bottom})`)
       .call(d3.axisBottom(xScale).tickFormat(d => `${d > 0 ? '+' : ''}${d}`));
    svg.append('g').attr('transform', `translate(${M.left},0)`)
       .call(d3.axisLeft(yScale).ticks(5));

    // Axis labels
    svg.append('text').attr('x', W / 2).attr('y', H - 5)
       .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', '#64748B')
       .text('← Left Bias    Political Spectrum    Right Bias →');
    svg.append('text').attr('transform', 'rotate(-90)')
       .attr('x', -(H / 2)).attr('y', 16)
       .attr('text-anchor', 'middle').attr('font-size', 12).attr('fill', '#64748B')
       .text('← Negative    Sentiment    Positive →');

    // Dots
    const tooltip = d3.select('body').append('div')
      .style('position', 'absolute').style('pointer-events', 'none')
      .style('background', '#1E293B').style('color', '#fff')
      .style('padding', '8px 12px').style('border-radius', '8px')
      .style('font-size', '12px').style('max-width', '220px')
      .style('opacity', 0);

    svg.selectAll('circle')
      .data(articles)
      .join('circle')
      .attr('cx', d => xScale(d.bias_score ?? 0))
      .attr('cy', d => yScale(d.sentiment_score ?? 0))
      .attr('r', 8)
      .attr('fill', d => SOURCE_COLORS[d.source_type] || '#94A3B8')
      .attr('opacity', 0.8)
      .attr('stroke', '#fff').attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        tooltip.transition().duration(150).style('opacity', 0.95);
        tooltip.html(`<b>${d.source_name}</b><br/>${d.title.slice(0,80)}...`)
          .style('left', (event.pageX + 12) + 'px')
          .style('top',  (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => tooltip.transition().duration(200).style('opacity', 0))
      .on('click', (_, d) => window.open(d.url, '_blank'));

  }, [articles]);

  return <svg ref={svgRef} className='w-full rounded-xl border border-gray-200' />;
}