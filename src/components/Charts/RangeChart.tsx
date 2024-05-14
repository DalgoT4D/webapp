import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export const RangeChart = ({ data }) => {
  const colors = d3
    .scaleOrdinal()
    .domain(data.map((d) => d.character))
    .range(['#8BC34A', '#4CAF50', '#388E3C', '#2E7D32', '#1B5E20']); // Shades of green

  const d3Container = useRef(null);

  useEffect(() => {
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);
      svg.selectAll('*').remove(); // Clear svg content before adding new elements

      const margin = { top: 20, right: 20, bottom: 30, left: 40 };
      const width = 960 - margin.left - margin.right;
      const height = 500 - margin.top - margin.bottom;

      const x = d3.scaleLinear().rangeRound([0, width]).domain([0, 100]); // as percentage

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      let cumulative = 0;
      g.selectAll('.bar')
        .data(data)
        .enter()
        .append('rect')
        .attr('x', (d) => {
          let x0 = cumulative;
          cumulative += x(d.percent);
          return x0;
        })
        .attr('y', height / 2 - 50) // adjust position and height of the bar
        .attr('width', (d) => x(d.percent))
        .attr('height', 100)
        .attr('fill', (d) => colors(d.character));
    }
  }, [data]);

  return (
    <svg className="d3-component" width={960} height={500} ref={d3Container} />
  );
};
