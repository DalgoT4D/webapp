import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export interface CharacterData {
  name: string;
  percentage: string;
  count: number;
}

interface RangeChartProps {
  data: CharacterData[];
  colors?: string[];
  barHeight?: number;
}
const chartColors = [
  '#00897b',
  '#33a195',
  '#66b8b0',
  '#98d0c9',
  '#cce7e4',
  '#c7d8d7',
];

export const RangeChart: React.FC<RangeChartProps> = ({
  data,
  colors = chartColors,
  barHeight = 16,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    d3.select(ref.current).select('svg').remove();
    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', 700)
      .attr('height', 100); // Height adjusted for legends and text

    const xScale = d3
      .scaleLinear()
      .domain([0, d3.sum(data, (d) => d.count)])
      .range([0, 700]);

    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('text-align', 'center')
      .style('width', '150px')
      .style('padding', '2px')
      .style('z-index', '2000')
      .style('font', '12px sans-serif')
      .style('background', 'white')
      .style('border', '1px solid black')
      .style('border-radius', '8px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    const onMouseOver = (event: any, d: CharacterData) => {
      tooltip.transition().duration(200).style('opacity', 0.9);
      tooltip
        .html(
          `<strong>${d.name}</strong>: ${d.percentage}%  |  <strong>Count</strong>: ${d.count}`
        )
        .style('left', event.pageX + 5 + 'px')
        .style('top', event.pageY - 28 + 'px');
    };

    let offsetX = 0;
    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d) => {
        const x = offsetX;
        offsetX += xScale(d.count);
        return x;
      })
      .attr('y', 30)
      .attr('width', (d) => xScale(d.count))
      .attr('height', barHeight)
      .attr('fill', (d, i) => colors[i % colors.length])
      .on('mouseover', onMouseOver)
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    offsetX = 0; // Reset for text placement
    svg
      .selectAll('text.value')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (d) => {
        const x = offsetX + xScale(d.count) / 2;
        offsetX += xScale(d.count);
        return x;
      })
      .attr('y', 25)
      .style('text-anchor', 'middle')
      .text((d) =>
        xScale(d.count) > 50 ? `${d.percentage}% | ${d.count}` : ''
      )
      .classed('hidden-text', (d) => xScale(d.count) <= 50);

    // Legend section
    const legend = svg.append('g').attr('transform', 'translate(0, 60)');

    offsetX = 0; // Reset for legend placement
    legend
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (_, i) => {
        const x = offsetX;
        offsetX += 110; // Space out legends
        return x;
      })
      .attr('y', 0)
      .attr('width', 16)
      .attr('height', 8)
      .attr('fill', (d, i) => colors[i % colors.length])
      .on('mouseover', onMouseOver)
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });
    offsetX = 0; // Reset for text placement in legend
    legend
      .selectAll('text')
      .data(data)
      .enter()
      .append('text')
      .attr('x', (_, i) => {
        const x = offsetX + 25;
        offsetX += 110; // Space out legends
        return x;
      })
      .attr('y', 8)
      .text((d) => {
        const maxLength = 10; // Trim to 10 characters
        return d.name.length > maxLength
          ? d.name.substring(0, maxLength) + '...'
          : d.name;
      })
      .on('mouseover', onMouseOver)
      .on('mouseout', () => {
        tooltip.transition().duration(200).style('opacity', 0);
      });

    return () => {
      tooltip.remove();
    };
  }, [data]);

  return <div data-testid ="range-chart-container" ref={ref}></div>;
};

export default RangeChart;
