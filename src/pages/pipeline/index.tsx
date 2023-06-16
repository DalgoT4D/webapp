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

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    // Generate random data for bar colors
    const data = Array.from({ length: 50 }, () =>
      Math.random() < 0.2 ? '#C15E5E' : '#00897B'
    );

    const height = 48;

    // Set dimensions and margins for the bars
    const barWidth = 8;
    const barHeight = height;

    // Create the bars
    svg
      .selectAll('rect')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (d, i) => i * (barWidth + 8)) // Adding 10 for t
      .attr('y', 0)
      .attr('width', barWidth)
      .attr('height', barHeight)
      .attr('fill', (d) => d);
  }, []);

  return (
    <div>
      <svg ref={svgRef} width={800} height={48}></svg>
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
              <>
                <Box sx={{ mt: 4 }}>{run.name}</Box>
                <Paper elevation={0} sx={{ p: 4 }}>
                  <Box>Last performed</Box>
                  <BarChart />
                </Paper>
              </>
            );
          })}
        </Box>
      </main>
    </>
  );
}
