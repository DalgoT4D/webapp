import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export interface DataProps {
  minimum: number;
  maximum: number;
  mean: number;
  median: number;
  mode: number | null;
  otherModes: null | number[];
}

interface StatsChartProps {
  data: DataProps;
}

export const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data) drawChart();
  }, [data]);

  const drawChart = () => {
    const margin = { top: 20, right: 40, bottom: 20, left: 40 };
    const width = 700 - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    // Clear previous SVG
    d3.select(ref.current).select('svg').remove();

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .style('overflow', 'visible')
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale for positioning
    const xScale = d3.scaleLinear().domain([data.minimum, data.maximum]).range([0, width]);

    // Calculate positions
    const values = [data.mean, data.median];
    if (data.mode) {
      values.push(data.mode);
    }
    const minCentral = Math.min(...values);
    const maxCentral = Math.max(...values);

    // Draw central bar
    svg
      .append('rect')
      .attr('x', xScale(minCentral))
      .attr('width', xScale(maxCentral) - xScale(minCentral))
      .attr('y', height / 2 - 5)
      .attr('height', 10)
      .attr('fill', '#00897b');

    // Draw lines to min and max
    svg
      .append('line')
      .attr('x1', xScale(data.minimum))
      .attr('x2', xScale(minCentral))
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'black')
      .attr('stroke-width', '2');

    svg
      .append('line')
      .attr('x1', xScale(maxCentral))
      .attr('x2', xScale(data.maximum))
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'black')
      .attr('stroke-width', '2');

    // Function to add markers and labels for values
    const addMarker = (value: number, label: string, up = true, distance = 2) => {
      svg
        .append('text')
        .attr('x', xScale(value))
        .attr('y', up ? height / distance - 20 : height / distance)
        .attr('text-anchor', 'middle')
        .text(label + ': ' + Math.trunc(value).toLocaleString());

      svg
        .append('line')
        .attr('x1', xScale(value))
        .attr('x2', xScale(value))
        .attr('y1', height / 2 - 5)
        .attr('y2', height / 2 + 5)
        .attr('stroke', 'black')
        .attr('stroke-width', '2');
    };

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

    // Add markers for all positions
    addMarker(data.minimum, 'Min');
    addMarker(data.maximum, 'Max');
    addMarker(data.mean, 'Mean', false, 1.1);
    addMarker(data.median, 'Median', true, 5);
    if (data.mode) {
      svg
        .append('text')
        .attr('x', xScale(data.mode))
        .attr('y', height / 0.8)
        .attr('text-anchor', 'middle')
        .text('Mode' + ': ' + Math.trunc(data.mode).toLocaleString())
        .on('mouseover', (event) => {
          if (data.otherModes && data.otherModes.length > 0) {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip
              .html(`Other modes: ${data.otherModes?.join(', ')}`)
              .style('left', event.pageX + 5 + 'px')
              .style('top', event.pageY - 28 + 'px');
          }
        })
        .on('mouseout', () => {
          tooltip.transition().duration(500).style('opacity', 0);
        });

      svg
        .append('line')
        .attr('x1', xScale(data.mode))
        .attr('x2', xScale(data.mode))
        .attr('y1', height / 2 - 5)
        .attr('y2', height / 2 + 5)
        .attr('stroke', 'black')
        .attr('stroke-width', '2');
    }
  };

  return <div data-testid="svg-container" ref={ref}></div>;
};
