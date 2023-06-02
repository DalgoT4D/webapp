import { httpGet } from '@/helpers/http';
import { Close } from '@mui/icons-material';
import {
  Box,
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

const FlowRunHistory = ({
  deploymentId,
  showFlowRunHistory,
  setShowFlowRunHistory,
}: FlowRunHistoryProps) => {
  const { data: session }: any = useSession();
  const [flowRuns, setFlowRuns] = useState<Array<any>>([]);
  const globalContext = useContext(GlobalContext);
  const handleClose = () => {
    setShowFlowRunHistory(false);
  };

  const lastRunTime = (startTime: string) => {
    return moment(new Date(startTime)).fromNow();
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
        } catch (err: any) {
          console.error(err);
          errorToast(err.message, [], globalContext);
        }
      })();
    }
  }, [showFlowRunHistory, deploymentId]);

  return (
    <Dialog open={showFlowRunHistory}>
      <DialogTitle>
        <Box sx={{ color: 'black', display: 'flex', alignItems: 'center' }}>
          <Box flexGrow={1}>Flow Runs</Box>
          <Box>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ marginLeft: '20px' }}>
        <Stack width="100rem">
          {flowRuns.map((flowRun: any) => (
            <Box display="flex" gap="10px">
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <Box
                  sx={{
                    height: '7px',
                    width: '7px',
                    backgroundColor: 'black',
                    borderRadius: '50%',
                    display: 'inline-block',
                  }}
                ></Box>
                <Divider orientation="vertical" />
              </Box>
              <Box
                sx={{ gap: '10px', display: 'flex', flexDirection: 'column' }}
              >
                <Typography>{lastRunTime(flowRun['startTime'])}</Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center',
                  }}
                >
                  <Typography sx={{ color: 'black', fontWeight: '700' }}>
                    {flowRun['name']}
                  </Typography>
                  {flowRun['status'] === 'COMPLETED' ? (
                    <TaskAltIcon
                      sx={{
                        alignItems: 'center',
                        fontSize: 'medium',
                        color: '#399D47',
                      }}
                    />
                  ) : (
                    <WarningAmberIcon
                      sx={{
                        alignItems: 'center',
                        fontSize: 'medium',
                        color: '#981F1F',
                      }}
                    />
                  )}
                  <Box sx={{ marginLeft: 'auto' }}>show more</Box>
                </Box>
                <Collapse in={true} unmountOnExit>
                  <CardContent
                    sx={{
                      width: '100%',
                      overflow: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      margin: 0,
                    }}
                  >
                    {flowRun?.logs?.map((log: any, idx: number) => (
                      <Box key={idx}>{log?.message}</Box>
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

export default FlowRunHistory;
