import styles from '@/styles/Home.module.css';
import { Box, Paper, Typography } from '@mui/material';
import Pattern from '@/assets/images/pattern.png';
import { PageHead } from '@/components/PageHead';

const orchestrationRuns = [
  {
    name: 'Orchestration Run 1',
    lastRuns: Array(50).fill({ status: 'success' }),
  },
  {
    name: 'Orchestration Run 2',
    lastRuns: Array(50).fill({ status: 'failure' }),
  },
];

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BarChart = () => {
  const svgRef = useRef(null);
  const width = 800;

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const data = Array.from({ length: 50 }, () => {
      const value = Math.random();
      const status = value < 0.2 ? 'failure' : 'success';
      const color = value < 0.2 ? '#C15E5E' : '#00897B';
      const lastRun = Math.floor(Math.random() * 100) + 1; // Random number for the last run
      return { color, status, lastRun };
    });

    // Generate random data for bar colors

    const height = 48;

    // Set dimensions and margins for the bars
    const barWidth = 8;
    const barHeight = height;

    const tooltip = d3
      .select('body')
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', 'white')
      .style('border', '1px solid black')
      .style('border-radius', '10px')
      .style('padding', '8px')
      .style('font-family', 'Arial')
      .style('font-size', '12px');

    // Create the bars
    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * (barWidth + 8)) // Adding 10 for t
      .attr('y', height)
      .attr('width', barWidth)
      .attr('height', 0) // Initially set the height to 0
      .attr('fill', (d) => d.color)
      .on('mouseover', (event, d) => {
        // Show tooltip on mouseover
        tooltip
          .style('visibility', 'visible')
          .html(`Run date: ${d.lastRun}<br>Status: ${d.status}`)
          .style('left', `${event.pageX + 2}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', () => {
        // Hide tooltip on mouseout
        tooltip.style('visibility', 'hidden');
      })
      .transition() // Apply transition animation
      .duration(1000) // Set the duration for the animation in milliseconds
      .attr('y', () => height - barHeight) // Move the bars to their final y position
      .attr('height', barHeight); // Set the

    svg
      .append('line')
      .attr('x1', 0)
      .attr('y1', height + 8) // 8 pixels below the bars
      .attr('x2', width)
      .attr('y2', height + 8)
      .attr('stroke', '#758397')
      .attr('stroke-width', 1);
  }, []);

  return (
    <div>
      <svg ref={svgRef} width={width} height={58}></svg>
    </div>
  );
};

export default function Home() {
  return (
    <>
      <PageHead title="Development Data Platform" />
      <main className={styles.main}>
        <Box
          className={styles.Box}
          sx={{
            position: 'relative',
            minHeight: '95px',
            backgroundImage: `url(${Pattern.src})`,
            backgroundRepeat: 'repeat',
            '::before': {
              content: '""',
              zIndex: 1,
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0.87,
              borderRadius: '16px',
              backgroundColor: '#003d37',
            },
          }}
        >
          <Typography
            variant="h4"
            sx={{
              color: 'white',
              position: 'absolute',
              zIndex: 2,
              mt: 1,
              ml: 1,
              fontWeight: 700,
            }}
          >
            Overview
          </Typography>
        </Box>
        <Box sx={{ mt: 4, mx: 8 }}>
          <Typography
            variant="h6"
            sx={{
              p: 2,
              background: '#00897B',
              borderRadius: 3,

              fontWeight: 600,
              color: 'white',
            }}
          >
            All flows are operational
          </Typography>

          {orchestrationRuns.map((run) => {
            return (
              <React.Fragment key={run.name}>
                <Typography
                  variant="body1"
                  sx={{ mt: 4, fontWeight: 700, pb: 1, color: '#092540BF' }}
                >
                  {run.name}
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    px: 4,
                    py: 2,
                    boxShadow: '0px 1px 5px rgba(0,0,0,0.1)',
                    borderRadius: '12px',
                  }}
                >
                  <Typography variant="subtitle2" mb={2}>
                    last performed at 5:00pm on 5 Feb
                  </Typography>
                  <BarChart />
                </Paper>
              </React.Fragment>
            );
          })}
        </Box>
      </main>
    </>
  );
}
