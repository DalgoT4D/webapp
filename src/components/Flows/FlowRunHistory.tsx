import { httpGet } from '@/helpers/http';
import { Close } from '@mui/icons-material';
import {
  Box,
  Button,
  CardContent,
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
  const [flowRuns, setFlowRuns] = useState<Array<FlowRun>>([]);
  const [showLogs, setShowLogs] = useState<Array<boolean>>([]);
  const globalContext = useContext(GlobalContext);
  const handleClose = () => {
    setShowFlowRunHistory(false);
  };

  const lastRunTime = (flowRun: FlowRun) => {
    // When the flow run fails startTime is null, so we look at the expectedStartTime
    return moment(
      new Date(flowRun?.startTime || flowRun.expectedStartTime)
    ).fromNow();
  };

  useEffect(() => {
    if (deploymentId && showFlowRunHistory) {
      (async () => {
        try {
          const data = await httpGet(
            session,
            `prefect/flows/${deploymentId}/flow_runs/history`
          );
          setFlowRuns(data);
          setShowLogs(new Array(data.length).fill(false));
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

  return (
    <Dialog open={showFlowRunHistory}>
      <DialogTitle>
        <Box sx={{ color: 'black', display: 'flex', alignItems: 'center' }}>
          <Box flexGrow={1}>Flow Runs</Box>
          <Box>
            <IconButton onClick={handleClose}>
              <Close data-testid="closebutton" />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ marginLeft: '20px', overflowX: 'hidden' }}>
        <Stack width="100rem">
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
                        flowRun && flowRun.status === 'COMPLETED'
                          ? '#399D47'
                          : '#981F1F',
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
                  <Typography data-testid={'lastrun-' + idx}>
                    {lastRunTime(flowRun)}
                  </Typography>
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
                    <Button
                      data-testid={'showlogs-' + idx}
                      onClick={() => handleShowMore(idx)}
                    >
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
                    </CardContent>
                  </Collapse>
                </Box>
              </Box>
            ))}
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
