import {
  Box,
  Button,
  CardContent,
  Typography,
} from '@mui/material';
import { httpGet } from '@/helpers/http';
import { errorToast } from '../ToastMessage/ToastHelper';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { flowRunLogsOffsetLimit } from '@/config/constant';

export type FlowRunLogMessage = {
  message: string;
};

export type FlowRun = {
  id: string;
  name: string;
  status: string;
  lastRun: string;
  startTime: string | null;
  expectedStartTime: string;
};

export const SingleFlowRunHistory = ({
    flowRun,
}: {flowRun: FlowRun}) => {

  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const [rerender, setRerender] = useState<boolean>(false);
  const [flowRunOffset, setFlowRunOffset] = useState<number>(0);
  const [logs, setLogs] = useState<Array<FlowRunLogMessage>>([]);

  const fetchLogs = async () => {
    (async () => {
      try {
        const data = await httpGet(
          session,
          `prefect/flow_runs/${flowRun.id}/logs?offset=${flowRunOffset}`
        );

        if (data?.logs?.logs && data.logs.logs.length >= 0) {
          const newlogs = logs.concat(
            data.logs.logs
          );
          setLogs(newlogs);

          // increment the offset by 200 if we have more to fetch
          // otherwise set it to -1 i.e. no more logs to show
          const offsetToUpdate = (data.logs.logs.length >= 200) ? flowRunOffset + flowRunLogsOffsetLimit : -1;
          setFlowRunOffset(offsetToUpdate);
          setRerender(!rerender);
        }
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
    })();
  };
  
  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session]);

  return (
    <Box display="" gap="10px" sx={{marginTop: '20px'}} >
      <Typography variant="h6" component="div">{flowRun.lastRun}</Typography>
      <Box
        sx={{
          gap: '10px',
          display: 'flex',
          flexDirection: 'column',
          paddingTop: '10px',
          paddingBottom: '20px',
          width: '100%',
          wordWrap: 'break-word',
          border: '1px solid #e0e0e0',
          backgroundColor: '#f5f5f5',
        }}
      >
        <CardContent data-testid={'logmessages'} sx={{}}>
          {logs?.map((log: any, idx1: number) => (
            <Box key={idx1}>- {log?.message}</Box>
          ))}
          {flowRunOffset >= 0 && (
            <Button
              data-testid={'offset'}
              onClick={() => fetchLogs()}
            >
              Fetch more
            </Button>
          )}
        </CardContent>
      </Box>
    </Box>
  )
};