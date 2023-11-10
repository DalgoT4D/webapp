import { Box, Button, CardContent, Typography } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { errorToast } from '../ToastMessage/ToastHelper';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { flowRunLogsOffsetLimit } from '@/config/constant';
import { LogCard } from '../Logs/LogCard';

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

export const SingleFlowRunHistory = ({ flowRun }: { flowRun: FlowRun }) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const [rerender, setRerender] = useState<boolean>(false);
  const [flowRunOffset, setFlowRunOffset] = useState<number>(0);
  const [logs, setLogs] = useState<Array<FlowRunLogMessage>>([]);
  const [expandLogs, setExpandLogs] = useState<boolean>(false);

  const fetchLogs = async () => {
    setExpandLogs(true);
    (async () => {
      try {
        const data = await httpGet(
          session,
          `prefect/flow_runs/${flowRun.id}/logs?offset=${flowRunOffset}`
        );

        if (data?.logs?.logs && data.logs.logs.length >= 0) {
          const newlogs = logs.concat(data.logs.logs);
          setLogs(newlogs);

          // increment the offset by 200 if we have more to fetch
          // otherwise set it to -1 i.e. no more logs to show
          const offsetToUpdate =
            data.logs.logs.length >= 200
              ? flowRunOffset + flowRunLogsOffsetLimit
              : -1;
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
    <Box
      display=""
      gap="10px"
      sx={{ marginTop: '20px' }}
      data-testid="single-flow-run-logs"
    >
      <Typography variant="h6" component="div">
        {flowRun.lastRun}
      </Typography>

      <LogCard
        logs={logs}
        expand={expandLogs}
        setExpand={setExpandLogs}
        fetchMore={flowRunOffset >= 0}
        fetchMoreLogs={() => fetchLogs()}
      />
    </Box>
  );
};
