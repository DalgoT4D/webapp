import styles from '@/styles/Home.module.css';
import CheckIcon from '@/assets/icons/check.svg';
import CheckLargeIcon from '@/assets/icons/check-large.svg';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import Pattern from '@/assets/images/pattern.png';
import { PageHead } from '@/components/PageHead';
import moment from 'moment';

import React, { useContext, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { lastRunTime } from '@/utils/common';
import Image from 'next/image';
import { httpGet } from '@/helpers/http';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';

const BarChart = ({ runs }: any) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const data = runs
      .map((run: any) => {
        const status = run.status;
        const color = status === 'FAILED' ? '#C15E5E' : '#00897B';
        const lastRun = moment(new Date(run.startTime)).calendar();
        const totalRunTime = run.totalRunTime;
        return { color, status, lastRun, totalRunTime };
      })
      .reverse();

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
      .style('font-size', '12px')
      .on('mouseout', (d3) => {
        if (tooltip && !tooltip?.node()?.contains(d3.relatedTarget)) {
          tooltip.style('visibility', 'hidden');
        }

        // Hide tooltip on mouseout
      });

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
      .attr('fill', (d: any) => d.color)

      .on('mouseover', (event, d: any) => {
        const [x, y] = d3.pointer(event, d);
        // Show tooltip on mouseover
        tooltip
          .style('visibility', 'visible')
          .html(
            `<strong>Start time:</strong> ${d.lastRun}
            <br><strong>Run time:</strong> ${d.totalRunTime}s
            <br> <strong>Status:</strong> ${d.status}
            <br><a class="log-link" href="/pipeline/orchestrate">Check logs</a>
            `
          )
          .style('left', `${x - 5}px`)
          .style('top', `${y - 95}px`);
      })
      .on('mouseout', (d3) => {
        if (tooltip && !tooltip?.node()?.contains(d3.relatedTarget)) {
          tooltip.style('visibility', 'hidden');
        }
        // Hide tooltip on mouseout
      })
      .transition() // Apply transition animation
      .duration(1000) // Set the duration for the animation in milliseconds
      .attr('y', () => height - barHeight) // Move the bars to their final y position
      .attr('height', barHeight)
      .style('position', 'relative');

    svg
      .append('line')
      .attr('x1', 0)
      .attr('y1', height + 8) // 8 pixels below the bars
      .attr('x2', '100%')
      .attr('y2', height + 8)
      .attr('stroke', '#758397')
      .attr('stroke-width', 1);
  }, []);

  return (
    <div>
      <svg ref={svgRef} width="100%" height={58}></svg>
    </div>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const [flowRuns, setFlowRuns] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const globalContext = useContext(GlobalContext);

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      (async () => {
        try {
          const flowRuns: any = await httpGet(session, 'dashboard/');
          setFlowRuns(flowRuns);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
      setIsLoading(false);
    }
  }, [session]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100% ',
          height: '90vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

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
        <Box sx={{ mt: 3, mx: 12 }}>
          <Typography
            variant="h6"
            sx={{
              p: 2,
              display: 'flex',
              alignItems: 'center',
              background: '#00897B',
              borderRadius: 3,
              fontWeight: 600,
              color: 'white',
            }}
          >
            {flowRuns && flowRuns.length > 0
              ? 'Scheduled flows are operational'
              : 'No flows available. Please create one'}
            {/* <Image
              style={{ marginLeft: 'auto' }}
              src={CheckLargeIcon}
              alt="large check icon"
            /> */}
          </Typography>

          {flowRuns &&
            flowRuns.map((run: any) => {
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
                    {run.runs && run.runs.length > 0 ? (
                      <>
                        <Box display="flex">
                          <Typography
                            variant="subtitle2"
                            sx={{
                              mb: 2,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <Image
                              style={{ marginRight: 8 }}
                              src={CheckIcon}
                              alt="check icon"
                            />{' '}
                            last performed {lastRunTime(run.runs[0].startTime)}
                          </Typography>
                          <Typography
                            variant="subtitle2"
                            fontWeight={600}
                            sx={{ ml: 'auto' }}
                          >
                            {
                              run.runs.filter(
                                (item: any) => item.status === 'COMPLETED'
                              ).length
                            }
                            /{run.runs.length} successful runs
                          </Typography>
                        </Box>
                        <BarChart runs={run.runs} />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Last {run.runs.length} runs
                        </Typography>
                      </>
                    ) : (
                      'No runs found for this flow'
                    )}
                  </Paper>
                </React.Fragment>
              );
            })}
        </Box>
      </main>
    </>
  );
}
