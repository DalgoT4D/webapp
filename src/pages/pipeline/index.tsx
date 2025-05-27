import styles from '@/styles/Home.module.css';
import CheckIcon from '@/assets/icons/check.svg';
import { Box, CircularProgress, Paper, Typography } from '@mui/material';
import Pattern from '@/assets/images/pattern.png';
import { PageHead } from '@/components/PageHead';
import moment from 'moment';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import React, { useContext, useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { delay, lastRunTime } from '@/utils/common';
import Image from 'next/image';
import { httpGet } from '@/helpers/http';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { useSession } from 'next-auth/react';
import { SingleFlowRunHistory } from '@/components/Flows/SingleFlowRunHistory';

type FlowRun = {
  id: string;
  name: string;
  color: string;
  status: string;
  lastRun: string;
  totalRunTime: number;
  startTime: string | null;
  expectedStartTime: string;
};

const BarChart = ({ runs, selectFlowRun }: any) => {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = d3.select(svgRef.current);

    const data = runs
      .map((run: any) => {
        const state_name = run.state_name;
        const status = state_name === 'DBT_TEST_FAILED' ? 'dbt tests failed' : run.status;
        const color =
          state_name === 'DBT_TEST_FAILED'
            ? '#df8e14'
            : status === 'COMPLETED'
              ? '#00897B'
              : '#C15E5E';
        const lastRun = moment(new Date(run.startTime)).calendar();
        const lastRunDateFormat = moment(new Date(run.startTime)).format('YYYY-MM-DD HH:mm:ss');
        const totalRunTime = Math.round(run.totalRunTime);
        const runTimeInHours = Math.floor(totalRunTime / 3600);
        const runTimeInMinutes = Math.floor((totalRunTime - runTimeInHours * 3600) / 60);
        const runTimeInSeconds = totalRunTime - runTimeInHours * 3600 - runTimeInMinutes * 60;
        return {
          id: run.id,
          name: run.name,
          color,
          status,
          lastRun,
          lastRunDateFormat,
          totalRunTime,
          runTimeInHours,
          runTimeInMinutes,
          runTimeInSeconds,
        };
      })
      .reverse();

    // Generate random data for bar colors
    const maxRuntime = Math.max(...data.map((item: any) => item.totalRunTime));

    const height = 48;

    // Set dimensions and margins for the bars
    const barWidth = 8;

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
      .attr('x', (d, i) => i * (barWidth + 6)) // Adding 10 for t
      .attr('y', height)
      .attr('width', barWidth)
      .attr('height', 0) // Initially set the height to 0
      .attr('fill', (d: any) => d.color)

      .on('mouseover', (event, d: any) => {
        const [x, y] = d3.pointer(event, d);
        let runTime = `${d.runTimeInHours}hr ${d.runTimeInMinutes}min ${d.runTimeInSeconds}s`;
        if (d.runTimeInHours === 0) {
          runTime = `${d.runTimeInMinutes}min ${d.runTimeInSeconds}s`;
        }
        if (d.runTimeInMinutes === 0 && d.runTimeInHours === 0) {
          runTime = `${d.runTimeInSeconds}s`;
        }
        if (d.runTimeInMinutes === 0 && d.runTimeInHours !== 0) {
          runTime = `${d.runTimeInHours}hr ${d.runTimeInSeconds}s`;
        }
        // Show tooltip on mouseover
        tooltip
          .style('visibility', 'visible')
          .html(
            `<strong>Start time:</strong> ${d.lastRunDateFormat}
            <br><strong>Run time:</strong> ${runTime}
            <br> <strong>Status:</strong> ${d.status}
            <br><a class="log-link" style="cursor:pointer" >Check logs</a>
            `
          )
          .style('left', `${x - 5}px`)
          .style('top', `${y - 95}px`)
          .on('click', (event) => {
            if (event.target.className == 'log-link') selectFlowRun(d);
          });
      })
      .on('mouseout', (d3) => {
        if (tooltip && !tooltip?.node()?.contains(d3.relatedTarget)) {
          tooltip.style('visibility', 'hidden');
        }
        // Hide tooltip on mouseout
      })
      .transition() // Apply transition animation
      .duration(1000) // Set the duration for the animation in milliseconds
      .attr('y', (d: any) => height - (d.totalRunTime / maxRuntime) * height)
      .attr('height', (d: any) => (d.totalRunTime / maxRuntime) * height) // Move the bars to their final y position
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
    <div style={{ overflowX: 'auto' }}>
      {/* runs.length * (barWidth + margin) is the specified width */}
      <svg ref={svgRef} width={runs.length * 14 + 'px'} height={58}></svg>
    </div>
  );
};

export default function Home() {
  const { data: session } = useSession();
  const [flowRuns, setFlowRuns] = useState<Array<any>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFlowRun, setSelectedFlowRun] = useState<FlowRun | null>(null);
  const globalContext = useContext(GlobalContext);

  const fetchFlowRuns = async (showLoadingIndicator: boolean) => {
    try {
      if (showLoadingIndicator) {
        setIsLoading(true);
      }
      const flowRuns: any = await httpGet(session, 'dashboard/v1');
      setFlowRuns(flowRuns);
      if (flowRuns.some((run: any) => run.lock)) {
        await delay(3000);
        fetchFlowRuns(false);
      }
      if (showLoadingIndicator) {
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  useEffect(() => {
    if (session) {
      fetchFlowRuns(true);
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

  const selectFlowRun = async (flowRun: FlowRun) => {
    setSelectedFlowRun(null);
    await delay(1000);
    setSelectedFlowRun(flowRun);
  };

  return (
    <>
      <PageHead title="Dalgo | Pipeline Overview" />
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
            Pipeline Overview
          </Typography>
        </Box>
        <Box sx={{ mt: 3, mx: 12 }}>
          {flowRuns && flowRuns.length === 0 && (
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
              No pipelines available. Please create one
            </Typography>
          )}

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
                            {run.lock && (
                              <>
                                <CircularProgress
                                  style={{
                                    width: 20,
                                    height: 20,
                                    marginRight: 10,
                                  }}
                                ></CircularProgress>
                                Currently running
                              </>
                            )}
                            {!run.lock && (
                              <>
                                {run.runs[0].status == 'FAILED' ? (
                                  <WarningAmberIcon
                                    sx={{
                                      paddingBottom: '3px',
                                      fontWeight: 800,
                                      fontSize: '25px',
                                      color: '#981F1F',
                                      marginRight: '5px',
                                    }}
                                  />
                                ) : (
                                  <Image
                                    style={{ marginRight: 8 }}
                                    src={CheckIcon}
                                    alt="check icon"
                                  />
                                )}
                                last run performed {lastRunTime(run.runs[0].startTime)}
                              </>
                            )}
                          </Typography>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ ml: 'auto' }}>
                            {run.runs.filter((item: any) => item.status === 'COMPLETED').length}/
                            {run.runs.length} successful runs
                          </Typography>
                        </Box>
                        <BarChart runs={run.runs} selectFlowRun={selectFlowRun} />
                        <Typography variant="subtitle2" fontWeight={600}>
                          Last {run.runs.length} runs
                        </Typography>
                      </>
                    ) : (
                      'No runs found for this pipeline'
                    )}
                  </Paper>
                </React.Fragment>
              );
            })}
        </Box>
        <SingleFlowRunHistory
          flowRun={
            selectedFlowRun
              ? {
                  id: selectedFlowRun.id,
                  name: selectedFlowRun.name,
                  status: selectedFlowRun.status,
                  lastRun: selectedFlowRun.lastRun,
                  startTime: selectedFlowRun.startTime,
                  expectedStartTime: selectedFlowRun.expectedStartTime,
                }
              : null
          }
        />
      </main>
    </>
  );
}
