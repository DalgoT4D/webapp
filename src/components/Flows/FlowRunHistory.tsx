import { httpGet } from '@/helpers/http';
import { Close } from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
  CircularProgress,
  Collapse,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Typography,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { errorToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { flowRunLogsOffsetLimit } from '@/config/constant';
import moment from 'moment';

interface FlowRunHistoryProps {
  deploymentId: string;
  showFlowRunHistory: boolean;
  setShowFlowRunHistory: (...args: any) => any;
}

export type FlowRunLogMessage = {
  message: string;
};

export type FlowRun = {
  id: string;
  name: string;
  status: string;
  logs: Array<FlowRunLogMessage>;
  startTime: string;
  expectedStartTime: string;
};

export const FlowRunHistory = ({
  deploymentId,
  showFlowRunHistory,
  setShowFlowRunHistory,
}: FlowRunHistoryProps) => {
  const { data: session }: any = useSession();
  const [loadingFlowRuns, setLoadingFlowRuns] = useState<boolean>(false);
  const [flowRuns, setFlowRuns] = useState<Array<FlowRun>>([]);
  const [showLogs, setShowLogs] = useState<Array<boolean>>([]);
  const [rerender, setRerender] = useState<boolean>(false);
  const [flowRunsOffset, setFlowRunsOffset] = useState<Array<number>>([]);
  const globalContext = useContext(GlobalContext);
  const handleClose = () => {
    setShowFlowRunHistory(false);
  };

  const lastRunTime = (flowRun: FlowRun) => {
    // When the flow run fails startTime is null, so we look at the expectedStartTime
    return moment(new Date(flowRun?.startTime || flowRun.expectedStartTime)).fromNow();
  };

  const fetchFlowRunLogsAndUpdateOffset = async (
    flowRunId: string,
    offset: number,
    rowIdx: number
  ) => {
    if (flowRunId) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `prefect/flow_runs/${flowRunId}/logs?offset=${offset}`
          );

          if (data?.logs?.logs && data.logs.logs.length >= 0) {
            const tempFlowRuns = flowRuns.slice();
            tempFlowRuns[rowIdx].logs = tempFlowRuns[rowIdx].logs.concat(data.logs.logs);
            setFlowRuns(tempFlowRuns);

            // increment the offset by 200 if we have more to fetch
            // otherwise set it to -1 i.e. no more logs to show
            const tempOffsets = flowRunsOffset.slice();
            let offsetToUpdate = -1;
            if (data.logs.logs.length >= 200)
              offsetToUpdate = tempOffsets[rowIdx] + flowRunLogsOffsetLimit;
            tempOffsets[rowIdx] = offsetToUpdate;
            setFlowRunsOffset(tempOffsets);
            setRerender(!rerender);
          }
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  };

  useEffect(() => {
    if (deploymentId && showFlowRunHistory) {
      (async () => {
        try {
          setLoadingFlowRuns(true);
          const data: Array<FlowRun> =
            (await httpGet(session, `prefect/flows/${deploymentId}/flow_runs/history`)) || [];
          setFlowRuns(data);
          setShowLogs(new Array(data.length).fill(false));

          const initialLogsOffset = data.map((flowRun: FlowRun) =>
            flowRun?.logs.length >= flowRunLogsOffsetLimit ? flowRunLogsOffsetLimit : -1
          );
          setFlowRunsOffset(initialLogsOffset);
          setLoadingFlowRuns(false);
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [showFlowRunHistory, deploymentId]);

  const handleShowMore = (idx: number) => {
    const tempLogs = showLogs.slice();
    tempLogs[idx] = !tempLogs[idx];
    setShowLogs(tempLogs);
  };

  const handleClickFetchMore = (idx: number) => {
    fetchFlowRunLogsAndUpdateOffset(flowRuns[idx].id, flowRunsOffset[idx], idx);
  };

  return (
    <Dialog open={showFlowRunHistory}>
      <DialogTitle>
        <Box sx={{ color: 'black', display: 'flex', alignItems: 'center' }}>
          <Box flexGrow={1}>Pipeline Runs</Box>
          <Box>
            <IconButton onClick={handleClose}>
              <Close data-testid="closebutton" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ marginLeft: '20px', overflowX: 'hidden' }}>
        <Stack width="100rem">
          {loadingFlowRuns && <CircularProgress></CircularProgress>}
          {!loadingFlowRuns && flowRuns.length === 0 && <Typography>No runs to show</Typography>}
          {flowRuns &&
            flowRuns.map((flowRun: FlowRun, idx: number) => (
              <Box display="flex" gap="10px" key={idx}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <Box
                    data-testid={'info-' + idx}
                    sx={{
                      height: '7px',
                      width: '7px',
                      borderRadius: '50%',
                      backgroundColor:
                        flowRun && flowRun.status === 'COMPLETED' ? '#399D47' : '#981F1F',
                    }}
                  >
                    <Typography color="white">i</Typography>
                  </Box>
                  <Divider orientation="vertical" />
                </Box>
                <Box
                  sx={{
                    gap: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    paddingTop: '10px',
                    paddingBottom: '20px',
                    width: '50%',
                    wordWrap: 'break-word',
                  }}
                >
                  <Typography data-testid={'lastrun-' + idx}>{lastRunTime(flowRun)}</Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      gap: '10px',
                      alignItems: 'center',
                    }}
                  >
                    <Typography sx={{ color: 'black', fontWeight: '700' }}>
                      {flowRun?.name}
                    </Typography>
                    {flowRun?.status === 'COMPLETED' ? (
                      <TaskAltIcon
                        data-testid={'taskalticon-' + idx}
                        sx={{
                          alignItems: 'center',
                          fontSize: 'medium',
                          color: '#399D47',
                        }}
                      />
                    ) : (
                      <WarningAmberIcon
                        data-testid={'warningambericon-' + idx}
                        sx={{
                          alignItems: 'center',
                          fontSize: 'medium',
                          color: '#981F1F',
                        }}
                      />
                    )}
                    <Button data-testid={'showlogs-' + idx} onClick={() => handleShowMore(idx)}>
                      {showLogs[idx] ? 'show less' : 'show more'}
                    </Button>
                  </Box>
                  <Collapse
                    sx={{
                      width: '60%',
                      backgroundColor: 'background.default',
                    }}
                    in={showLogs[idx]}
                    timeout="auto"
                    unmountOnExit
                  >
                    <CardContent data-testid={'logmessages-' + idx} sx={{}}>
                      {flowRun?.logs?.map((log: any, idx1: number) => (
                        <Box key={idx1}>- {log?.message}</Box>
                      ))}
                      {flowRunsOffset[idx] >= 0 && (
                        <Button
                          data-testid={'offset-' + idx}
                          onClick={() => handleClickFetchMore(idx)}
                        >
                          Fetch more
                        </Button>
                      )}
                    </CardContent>
                  </Collapse>
                  {showLogs[idx] && (
                    <Box
                      sx={{
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'left',
                      }}
                    >
                      <Button
                        data-testid={'showlogs-after-' + idx}
                        onClick={() => handleShowMore(idx)}
                      >
                        show less
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
