import { Box, Typography } from '@mui/material';
import { httpGet } from '@/helpers/http';
import { errorToast } from '../ToastMessage/ToastHelper';
import { useSession } from 'next-auth/react';
import React, { useContext, useEffect, useState } from 'react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { flowRunLogsOffsetLimit, enableLogSummaries } from '@/config/constant';
import { LogCard } from '../Logs/LogCard';
import { LogSummaryCard, LogSummary } from '../Logs/LogSummaryCard';

export type FlowRunLogMessage = {
  message: string;
};

export type FlowRun = {
  id: string;
  name: string;
  status: string;
  state_name: string;
  lastRun: string;
  startTime: string | null;
  expectedStartTime: string;
};

interface SingleFlowRunHistoryProps {
  flowRun: Partial<FlowRun> | null | undefined;
}

export const SingleFlowRunHistory = ({ flowRun }: SingleFlowRunHistoryProps) => {
  const { data: session }: any = useSession();
  const globalContext = useContext(GlobalContext);

  const [rerender, setRerender] = useState<boolean>(false);
  const [flowRunOffset, setFlowRunOffset] = useState<number>(0);
  const [logs, setLogs] = useState<Array<FlowRunLogMessage>>([]);
  const [expandLogs, setExpandLogs] = useState<boolean>(false);
  const [logsummary, setLogsummary] = useState<Array<LogSummary>>([]);
  const [logsummarylogs, setLogsummaryLogs] = useState<Array<string>>([]);

  const fetchLogSummaries = async () => {
    if (!flowRun) {
      return;
    }
    (async () => {
      try {
        const data = await httpGet(session, `prefect/flow_runs/${flowRun.id}/logsummary`);
        console.log(data);
        setLogsummary(data);
      } catch (err: any) {
        console.error(err);
        errorToast(err.message, [], globalContext);
      }
    })();
  };

  const fetchLogs = async () => {
    if (!flowRun) {
      return;
    }
    setExpandLogs(true);
    (async () => {
      try {
        const data = await httpGet(
          session,
          `prefect/flow_runs/${flowRun.id}/logs?offset=${Math.max(
            flowRunOffset,
            0
          )}&limit=${flowRunLogsOffsetLimit}`
        );

        if (data?.logs?.logs && data.logs.logs.length >= 0) {
          const newlogs = flowRunOffset <= 0 ? data.logs.logs : logs.concat(data.logs.logs);
          setLogs(newlogs);

          // increment the offset by 200 if we have more to fetch
          // otherwise set it to -1 i.e. no more logs to show
          const offsetToUpdate =
            data.logs.logs.length >= flowRunLogsOffsetLimit
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
    if (flowRun?.id) {
      if (enableLogSummaries) {
        fetchLogSummaries();
        if (logsummary.length === 0) {
          fetchLogs();
        }
      } else {
        fetchLogs();
      }
    }
  }, [flowRun?.id]);

  return (
    <Box display="" gap="10px" sx={{ marginTop: '20px' }} data-testid="single-flow-run-logs">
      <Typography variant="h6" component="div">
        {flowRun?.lastRun}
      </Typography>

      {logsummary.length > 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Box sx={{ width: '50%', margin: '5px' }}>
              <LogSummaryCard logsummary={logsummary} setLogsummaryLogs={setLogsummaryLogs} />
            </Box>
            <Box sx={{ width: '50%', margin: '5px' }}>
              {logsummarylogs.length > 0 && (
                <LogCard
                  logs={logsummarylogs}
                  expand={true}
                  setExpand={() => {}}
                  fetchMore={false}
                  fetchMoreLogs={() => {}}
                />
              )}
            </Box>
          </Box>
        </>
      )}
      {logsummary.length === 0 && (
        <LogCard
          logs={logs}
          expand={expandLogs}
          setExpand={setExpandLogs}
          fetchMore={flowRunOffset > 0}
          fetchMoreLogs={() => fetchLogs()}
        />
      )}
    </Box>
  );
};
