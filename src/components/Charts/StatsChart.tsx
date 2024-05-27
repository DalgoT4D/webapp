import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataProps {
  min: number;
  max: number;
  mean: number;
  median: number;
  mode: number;
}

interface StatsChartProps {
  data: DataProps;
}

export const StatsChart: React.FC<StatsChartProps> = ({ data }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    drawChart();
  }, [data]);

  const drawChart = () => {
    const margin = { top: 20, right: 30, bottom: 20, left: 30 };
    const width = 700 - margin.left - margin.right;
    const height = 100 - margin.top - margin.bottom;

    // Clear previous SVG
    d3.select(ref.current).select('svg').remove();

    const svg = d3
      .select(ref.current)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale for positioning
    const xScale = d3
      .scaleLinear()
      .domain([data.min, data.max])
      .range([0, width]);

    // Calculate positions
    const values = [data.mean, data.median, data.mode];
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
      .attr('x1', xScale(data.min))
      .attr('x2', xScale(minCentral))
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'black')
      .attr('stroke-width', '2');

    svg
      .append('line')
      .attr('x1', xScale(maxCentral))
      .attr('x2', xScale(data.max))
      .attr('y1', height / 2)
      .attr('y2', height / 2)
      .attr('stroke', 'black')
      .attr('stroke-width', '2');

    // Function to add markers and labels for values
    const addMarker = (value, label, up = true) => {
      svg
        .append('text')
        .attr('x', xScale(value))
        .attr('y', up ? height / 2 - 20 : height / 2 + 20)
        .attr('text-anchor', 'middle')
        .text(label + ': ' + value);

      svg
        .append('line')
        .attr('x1', xScale(value))
        .attr('x2', xScale(value))
        .attr('y1', height / 2 - 5)
        .attr('y2', height / 2 + 5)
        .attr('stroke', 'black')
        .attr('stroke-width', '2');
    };

    // Add markers for all positions
    addMarker(data.min, 'Min');
    addMarker(data.max, 'Max');
    addMarker(data.mean, 'Mean', false);
    addMarker(data.median, 'Median');
    addMarker(data.mode, 'Mode', false);
  };

  return <div ref={ref}></div>;
};
