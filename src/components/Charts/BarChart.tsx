import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export type BarChartData = {
  label: string;
  value: number;
  barTopLabel?: string;
};

export type BarChartProps = {
  data: BarChartData[];
};

const trimString = (label: string) => {
  const maxLength = 10; // Trim to 10 characters
  return label.length > maxLength
    ? label.substring(0, maxLength) + '...'
    : label;
};

export const BarChart: React.FC<BarChartProps> = ({ data }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (data && ref.current) {
      const svg = d3.select(ref.current);
      svg.selectAll('*').remove(); // Clear svg content before adding new elements

      const margin = { top: 20, right: 0, bottom: 20, left: 0 };
      const width = 700 - margin.left - margin.right;
      const height = 100 - margin.top - margin.bottom;

      const x = d3
        .scaleBand()
        .range([0, width])
        .domain(data.map((d) => trimString(d.label)))
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) as number])
        .range([height, 0]);

      const xAxis = d3.axisBottom(x);

      const chart = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      chart
        .append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .call((g) => g.select('.domain').remove()) // Remove the axis line
        .call((g) => g.selectAll('.tick line').remove()); // Remove tick lines

      chart
        .selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', (d) => x(trimString(d.label))!)
        .attr('y', (d) => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', (d) => height - y(d.value))
        .attr('fill', '#00897b');

      chart
        .selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .text((d) => `${d.barTopLabel ? d.barTopLabel : d.value}`)
        .attr('x', (d) => x(trimString(d.label))! + x.bandwidth() / 2)
        .attr('y', (d) => y(d.value) - 5)
        .attr('text-anchor', 'middle')
        .style('fill', '#000');

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

      // Add tooltip functionality to the x-axis labels
      svg
        .selectAll('.tick text')
        .on('mouseover', (event, d) => {
          const originalLabel = data.find(
            (item) => trimString(item.label) === d
          )?.label;

          if (originalLabel && originalLabel?.length > 10) {
            tooltip.transition().duration(200).style('opacity', 0.9);
            tooltip
              .html(`${originalLabel}`)
              .style('left', event.pageX + 5 + 'px')
              .style('top', event.pageY - 28 + 'px');
          }
        })
        .on('mouseout', () => {
          tooltip.transition().duration(500).style('opacity', 0);
        });
    }
  }, [data]);

  return <svg data-testid="barchart-svg" ref={ref} width={700} height={100} />;
};
