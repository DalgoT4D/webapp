import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { Transition } from '../DBT/DBTTransformType';
import Close from '@mui/icons-material/Close';
import { useContext, useEffect, useState } from 'react';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { Connection } from './Connections';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';

import moment from 'moment';
import { delay, formatDuration } from '@/utils/common';
import { defaultLoadMoreLimit } from '@/config/constant';
import { errorToast } from '../ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import InsightsIcon from '@mui/icons-material/Insights';
import AssignmentIcon from '@mui/icons-material/Assignment';
import useSWR from 'swr';


const fetchAirbyteLogs = async (
  connectionId: string,
  session: any,
  offset = 0
) => {
  try {
    const response = await httpGet(
      session,
      `airbyte/v1/connections/${connectionId}/sync/history?limit=${defaultLoadMoreLimit}&offset=${offset}`
    );

    return response;
  } catch (err: any) {
    console.error(err);
  }
};

export const TopNavBar = ({ handleClose, title }: any) => (
  <Box sx={{ display: 'flex' }}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        pl: '28px',
        mt: '20px',
      }}
    >
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
    </Box>
    <Box display="flex" alignItems="center" sx={{ marginLeft: 'auto' }}>
      <IconButton
        edge="start"
        color="inherit"
        onClick={handleClose}
        sx={{ mr: 1, mt: 2 }}
        aria-label="close"
      >
        <Close />
      </IconButton>
    </Box>
  </Box>
);

interface ConnectionLogsProps {
  setShowLogsDialog: (value: boolean) => any;
  connection: Connection | undefined;
}

const columns = [
  'Date',
  'Records synced',
  'Bytes synced',
  'Duration',
  'Actions',
];

interface LogObject {
  attempt_no: number;
  bytesEmitted: string;
  date: string;
  job_id: number;
  logs: string[];
  recordsCommitted: number;
  recordsEmitted: number;
  status: string;
  totalTimeInSeconds: number;
}

const LogsColumn = ({
  logsLoading,
  summarizedLogsLoading,
  summarizedLogs = [],
  logs,
  action,
}: {
  logsLoading: boolean;
  summarizedLogsLoading: boolean;
  summarizedLogs: any;
  logs: string[];
  action: 'detail' | 'summary' | null;
}) => {
  const open = !!action;
  return (
    <Box
      sx={{
        mb: open ? 2 : 0,
        maxHeight: open ? '400px' : '0px',
        overflow: 'scroll',
        wordBreak: 'break-all',
        transition: 'max-height 0.6s ease-in-out',
      }}
    >
      {logsLoading || summarizedLogsLoading ? (
        <LinearProgress color="inherit" />
      ) : null}
      {action === 'summary'
        ? summarizedLogs.length > 0 && (
          <Alert icon={false} severity="success" sx={{ mb: 2 }}>
            {summarizedLogs.map((result: any, index: number) => (
              <Box key={result.prompt} sx={{ mb: 2 }}>
                <Box>
                  <strong>{index === 0 ? 'Summary' : result.prompt}</strong>
                </Box>
                <Box sx={{ fontWeight: 500 }}>{result.response}</Box>
              </Box>
            ))}
          </Alert>
        )
        : null}

      {action === 'detail' && logs.length > 0 && (
        <Alert icon={false} sx={{ background: '#000', color: '#fff' }}>
          {logs.map((log: string, idx: number) => (
            <Box
              key={log + idx}
              sx={{ mb: '3px', fontWeight: 600, display: 'flex' }}
            >
              <Box>{log}</Box>
            </Box>
          ))}
        </Alert>
      )}
    </Box>
  );
};

const Row = ({
  allowLogsSummary,
  logDetail,
  connectionId,
}: {
  allowLogsSummary: boolean;
  logDetail: LogObject;
  connectionId: string;
}) => {
  const globalContext = useContext(GlobalContext);
  const [summarizedLogs, setSummarizedLogs] = useState([]);
  const [detailedLogs, setDetailedLogs] = useState([]);
  const [summarizedLogsLoading, setSummarizedLogsLoading] = useState(false);
  const [detailedLogsLoading, setDetailedLogsLoading] = useState(false);
  const { data: session }: any = useSession();

  const pollForTaskRun = async (taskId: string) => {
    try {
      const response: any = await httpGet(session, 'tasks/stp/' + taskId);
      const lastMessage: any =
        response['progress'][response['progress'].length - 1];

      if (!['completed', 'failed'].includes(lastMessage.status)) {
        await delay(3000);
        await pollForTaskRun(taskId);
      } else {
        setSummarizedLogs(lastMessage.result);
      }
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setSummarizedLogsLoading(false);
  };
  const summarizeLogs = async () => {
    setSummarizedLogsLoading(true);
    try {
      const response = await httpGet(
        session,
        `airbyte/v1/connections/${connectionId}/logsummary?job_id=${logDetail.job_id}&attempt_number=${logDetail.attempt_no}`
      );

      await delay(3000);
      pollForTaskRun(response.task_id);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };

  const getDetailedLogs = async () => {
    setDetailedLogsLoading(true);
    try {
      const response = await httpGet(
        session,
        `airbyte/v1/logs?job_id=${logDetail.job_id}&attempt_number=${logDetail.attempt_no}`
      );
      setDetailedLogs(response);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
    setDetailedLogsLoading(false);
  };

  const [action, setAction] = useState<'detail' | 'summary' | null>(null);

  const handleAction = (
    event: React.MouseEvent<HTMLElement>,
    newAction: 'detail' | 'summary' | null
  ) => {
    if (newAction === 'summary' && summarizedLogs.length < 1) {
      summarizeLogs();
    } else if (newAction === 'detail' && detailedLogs.length < 1) {
      getDetailedLogs();
    }
    setAction(newAction);
  };
  return (
    <>
      <TableRow
        key={logDetail.job_id}
        sx={{
          position: 'relative',
          p: 2,

          background:
            logDetail.status === 'failed' ? 'rgba(211, 47, 47, 0.3)' : 'unset',
        }}
      >
        <TableCell
          sx={{
            fontWeight: 600,
            borderTopLeftRadius: '10px',
            borderBottomLeftRadius: '10px',
          }}
        >
          {moment(logDetail.date).format('MMMM D, YYYY')}
        </TableCell>

        <TableCell sx={{ fontWeight: 500 }}>
          {logDetail.recordsEmitted.toLocaleString()}
        </TableCell>
        <TableCell sx={{ fontWeight: 500 }}>{logDetail.bytesEmitted}</TableCell>
        <TableCell
          sx={{
            fontWeight: 500,
          }}
        >
          {formatDuration(logDetail.totalTimeInSeconds)}
        </TableCell>
        <TableCell sx={{
          width: '300px', fontWeight: 500, borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
        }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            sx={{ textAlign: 'right' }}
            value={action}
            exclusive
            disabled={detailedLogsLoading || summarizedLogsLoading}
            onChange={handleAction}
            aria-label="text alignment"
          >
            <ToggleButton value="detail" aria-label="left" data-testid="logs" >
              Logs
              <AssignmentIcon sx={{ ml: '2px', fontSize: '16px' }} />
            </ToggleButton>
            {(allowLogsSummary && logDetail.status === "failed") && (
              <ToggleButton value="summary" aria-label="right" data-testid={`aisummary-${connectionId}`} >
                AI summary <InsightsIcon sx={{ ml: '2px', fontSize: '16px' }} />
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={5} style={{ paddingBottom: 0, paddingTop: 0 }}>
          <LogsColumn
            logsLoading={detailedLogsLoading}
            summarizedLogsLoading={summarizedLogsLoading}
            logs={detailedLogs}
            summarizedLogs={summarizedLogs}
            action={action}
          />
        </TableCell>
      </TableRow>
    </>
  );
};

export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  setShowLogsDialog,
  connection,
}) => {
  const { data: session }: any = useSession();
  const { data: flags } = useSWR('organizations/flags');
  const [logDetails, setLogDetails] = useState<LogObject[]>([]);
  const [offset, setOffset] = useState(defaultLoadMoreLimit);
  const [showLoadMore, setShowLoadMore] = useState(true);
  const [loadMorePressed, setLoadMorePressed] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      if (connection) {
        setLoading(true);
        const { history = [], totalSyncs = 0 }: { history: LogObject[], totalSyncs: number } = await fetchAirbyteLogs(
          connection.connectionId,
          session
        );
        if (history) {
          setLogDetails(history);
        }

        if (totalSyncs <= offset + defaultLoadMoreLimit) {
          setShowLoadMore(false);
        }
        setLoading(false);
      }
    })();
  }, []);
  return (
    <Dialog
      sx={{
        m: '74px 24px 22px 24px',
        background: '#00000000',
      }}
      fullScreen
      PaperProps={{
        sx: {
          borderRadius: '12px',
        },
      }}
      open
      TransitionComponent={Transition}
    >
      <TopNavBar
        handleClose={() => setShowLogsDialog(false)}
        title="Connection History"
      />
      <Box sx={{ p: '0px 28px' }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ fontSize: '16px', display: 'flex' }}>
            <Typography sx={{ fontWeight: 700 }}>
              {`${connection?.name} |`}
            </Typography>
            <Box sx={{ display: "flex", width: "90%", justifyContent: "space-between" }}>
              <Typography sx={{ fontWeight: 600, ml: '4px' }}>
                {connection?.source.sourceName} →{' '}
                {connection?.destination.destinationName}
              </Typography>
              {!!flags?.allowLogsSummary &&
                <Typography sx={{ fontWeight: 400 }}>*For AI summary of failed logs press the AI Summary button</Typography>
              }
            </Box>
          </Box>
        </Box>
        <TableContainer
          sx={{ height: 'calc(100vh - 210px)', overflow: 'scroll' }}
        >
          <Table stickyHeader sx={{ mt: '-10px' }}>
            <TableHead>
              <TableRow
                sx={{
                  background: '#00897B',
                  '& > :first-of-type': {
                    borderTopLeftRadius: '10px',
                    borderBottomLeftRadius: '10px',
                  },
                  '& > :last-of-type': {
                    borderTopRightRadius: '10px',
                    borderBottomRightRadius: '10px',
                  },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    sx={{
                      p: '8px 16px',
                      color: 'white',
                      fontWeight: 700,
                      background: '#00897B',
                    }}
                    key={column}
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {logDetails.map((logDetail) => (
                <Row
                  allowLogsSummary={!!flags?.allowLogsSummary}
                  key={logDetail.job_id}
                  logDetail={logDetail}
                  connectionId={
                    connection?.connectionId ? connection.connectionId : ''
                  }
                />
              ))}
            </TableBody>
          </Table>
          {logDetails.length > 0 ? (
            showLoadMore && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '12px',
                    mt: 1,
                  }}
                  onClick={async () => {
                    setLoadMorePressed(true);
                    if (connection) {
                      const { history = [], totalSyncs = 0 }: { history: LogObject[], totalSyncs: number } = await fetchAirbyteLogs(
                        connection.connectionId,
                        session,
                        offset
                      );
                      if (history) {
                        setLogDetails((logs) => [...logs, ...history]);
                        setOffset((offset) => offset + defaultLoadMoreLimit);
                      }
                      if (totalSyncs <= offset + defaultLoadMoreLimit) {
                        setShowLoadMore(false);
                      }
                      setLoadMorePressed(false);
                    }
                  }}
                >
                  {loadMorePressed ? (
                    <CircularProgress />
                  ) : (
                    <>
                      load more <DownIcon />
                    </>
                  )}
                </Box>
              </Box>
            )
          ) : loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress />
            </Box>
          ) : (
            'No information available'
          )}
        </TableContainer>
      </Box>
    </Dialog>
  );
};
