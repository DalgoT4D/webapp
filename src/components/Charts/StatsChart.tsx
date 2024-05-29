import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { Box } from '@mui/material';
import Image from 'next/image';
import switchIcon from '@/assets/icons/switch-chart.svg';

interface DataProps {
  minimum: number;
  maximum: number;
  mean: number;
  median: number;
  mode: number;
}

interface StatsChartProps {
  data: DataProps;
  type: 'chart' | 'numbers';
}

export const StatsChart: React.FC<StatsChartProps> = ({ data, type }) => {
  const [chartType, setChartType] = useState(type);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (data && chartType === 'chart') drawChart();
  }, [data, chartType]);

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
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Scale for positioning
    const xScale = d3
      .scaleLinear()
      .domain([data.minimum, data.maximum])
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
    const addMarker = (value, label, up = true, distance = 2) => {
      svg
        .append('text')
        .attr('x', xScale(value))
        .attr('y', up ? height / distance - 20 : height / distance )
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
    addMarker(data.minimum, 'Min');
    addMarker(data.maximum, 'Max');
    addMarker(data.mean, 'Mean', false, 1.1);
    addMarker(data.median, 'Median', true, 5);
    addMarker(data.mode, 'Mode', false, 0.8);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '110px',
      }}
    >
      {chartType === 'chart' ? (
        <div ref={ref}></div>
      ) : (
        <Box sx={{ minWidth: '700px', display: 'flex', alignItems: 'center' }}>
          {Object.keys(data).map((key) => (
            <Box key={key} sx={{ mr: '50px' }}>
              <Box sx={{ color: 'rgba(15, 36, 64, 0.57)' }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Box>
              <Box
                sx={{
                  mt: 1,
                  width: '84px',
                  background: '#F5FAFA',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ ml: 1 }}> {data[key]}</Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Image
        style={{ marginLeft: '20px', cursor: 'pointer' }}
        src={switchIcon}
        onClick={() =>
          setChartType(chartType === 'chart' ? 'numbers' : 'chart')
        }
        alt="switch icon"
      />
    </Box>
  );
};
