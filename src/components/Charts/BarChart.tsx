import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export type BarChartData = {
  label: string;
  value: number;
};

export type BarChartProps = {
  data: BarChartData[];
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
        .domain(data.map((d) => d.label))
        .padding(0.1);

      const y = d3
        .scaleLinear()
        .domain([0, d3.max(data, (d) => d.value) as number])
        .range([height, 0]);

      const yAxis = d3.axisLeft(y);
      const xAxis = d3.axisBottom(x);

      const chart = svg
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

      //   chart.append('g').call(yAxis);

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
        .attr('x', (d) => x(d.label)!)
        .attr('y', (d) => y(d.value))
        .attr('width', x.bandwidth())
        .attr('height', (d) => height - y(d.value))
        .attr('fill', '#00897b');

      chart
        .selectAll('.label')
        .data(data)
        .enter()
        .append('text')
        .text((d) => `${d.value}`)
        .attr('x', (d) => x(d.label)! + x.bandwidth() / 2)
        .attr('y', (d) => y(d.value) - 5)
        .attr('text-anchor', 'middle')
        .style('fill', '#000');
    }
  }, [data]);

  return <svg ref={ref} width={700} height={100} />;
};
