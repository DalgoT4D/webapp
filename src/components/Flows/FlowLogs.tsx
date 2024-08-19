import {
  Alert,
  Box,
  CircularProgress,
  Dialog,
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
import { useContext, useEffect, useState } from 'react';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import InsightsIcon from '@mui/icons-material/Insights';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';

import moment from 'moment';
import { FlowInterface } from './Flows';
import { delay, formatDuration } from '@/utils/common';
import { TopNavBar } from '../Connections/ConnectionLogs';
import { defaultLoadMoreLimit } from '@/config/constant';
import { errorToast } from '../ToastMessage/ToastHelper';
import useSWR from 'swr';
import { GlobalContext } from '@/contexts/ContextProvider';

const makeReadable = (label: string) => {
  if (label.startsWith('run-airbyte-connection-flow-v1')) {
    return 'Airbyte sync';
  }
  const readableObject: any = {
    'shellop-git-pull': 'Git pull',
    'dbtjob-dbt-clean': 'DBT clean',
    'dbtjob-dbt-deps': 'DBT deps',
    'dbtjob-dbt-run': 'DBT run',
    'dbtjob-dbt-test': 'DBT test',
  };
  return readableObject[label] ? readableObject[label] : label;
};

const fetchDeploymentLogs = async (
  deploymentId: string,
  session: any,
  offset = 0
) => {
  try {
    const response = await httpGet(
      session,
      `prefect/v1/flows/${deploymentId}/flow_runs/history?limit=${defaultLoadMoreLimit}&fetchlogs=true&offset=${offset}`
    );

    return response || [];
  } catch (err: any) {
    console.error(err);
  }
};

interface FlowLogsProps {
  setShowLogsDialog: (value: boolean) => any;
  flow: FlowInterface | undefined;
}

const columns = ['Date', 'Task', 'Duration', 'Action'];

interface LogObject {
  level: number;
  message: string;
  timestamp: string;
}

interface RunObject {
  end_time: string;
  id: string;
  kind: string;
  label: string;
  logs: LogObject[];
  start_time: string;
  state_name: string;
  state_type: string;
}

interface DeploymentObject {
  deployment_id: string;
  expectedStartTime: string;
  id: string;
  runs: RunObject[];
  name: string;
  startTime: string;
  state_name: string;
  status: string;
  totalRunTime: number;
}

const LogsContainer = ({
  run,
  flowRunId,
}: {
  run: RunObject;
  flowRunId: string;
}) => {
  const globalContext = useContext(GlobalContext);
  const [action, setAction] = useState<'detail' | 'summary' | null>(null);
  const [summarizedLogs, setSummarizedLogs] = useState([]);
  const [summarizedLogsLoading, setSummarizedLogsLoading] = useState(false);
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
        `prefect/v1/flow_runs/${flowRunId}/logsummary?task_id=${run.id}`
      );
      await delay(3000);
      pollForTaskRun(response.task_id);
    } catch (err: any) {
      console.error(err);
      errorToast(err.message, [], globalContext);
    }
  };
  const handleAction = (
    event: React.MouseEvent<HTMLElement>,
    newAction: 'detail' | 'summary' | null
  ) => {
    if (newAction === 'summary' && summarizedLogs.length < 1) {
      summarizeLogs();
    }
    setAction(newAction);
  };

  const open = !!action;

  return (
    <Box>
      <Box
        key={run.id}
        sx={{
          display: 'flex',
          pb: '3px',
          pt: '3px',
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '30%' }}>
          <Box>
            <strong>{makeReadable(run.label)}</strong>
          </Box>
        </Box>
        <Box
          sx={{
            ml: 'auto',
            width: '30%',
            mr: 4,
          }}
        >
          {formatDuration(
            moment
              .duration(moment(run.end_time).diff(moment(run.start_time)))
              .asSeconds()
          )}
        </Box>
        <Box sx={{ width: '40%', textAlign: 'right' }}>
          <ToggleButtonGroup
            size="small"
            color="primary"
            value={action}
            exclusive
            disabled={summarizedLogsLoading}
            onChange={handleAction}
            aria-label="text alignment"
          >
            <ToggleButton value="detail" aria-label="left">
              Logs
              <AssignmentIcon sx={{ ml: '2px', fontSize: '16px' }} />
            </ToggleButton>
            {run.state_type === 'FAILED' && (
              <ToggleButton
                value="summary"
                aria-label="right"
                data-testid={`aisummary-${run.id}`}
              >
                AI summary <InsightsIcon sx={{ ml: '2px', fontSize: '16px' }} />
              </ToggleButton>
            )}
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box
        sx={{
          mb: open ? 2 : 0,
          maxHeight: open ? '400px' : '0px',
          overflow: 'scroll',
          wordBreak: 'break-all',
          transition: 'max-height 0.6s ease-in-out',
        }}
      >
        {summarizedLogsLoading ? <LinearProgress color="inherit" /> : null}
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

        {action === 'detail' && run.logs.length > 0 && (
          <Alert icon={false} sx={{ background: '#000', color: '#fff' }}>
            <Box sx={{ wordBreak: 'break-word' }}>
              {run.logs.map((log, index) => (
                <Box key={log.timestamp + index}>{log.message}</Box>
              ))}
            </Box>
          </Alert>
        )}
      </Box>
    </Box>
  );
};

const Row = ({ logDetail }: { logDetail: DeploymentObject }) => {
  return (
    <>
      <TableRow
        key={logDetail.id}
        sx={{
          position: 'relative',
          p: 2,

          background:
            logDetail.status === 'FAILED' ? 'rgba(211, 47, 47, 0.2)' : 'unset',
        }}
      >
        <TableCell
          sx={{
            width: '150px',
            fontWeight: 600,
            borderTopLeftRadius: '10px',
            borderBottomLeftRadius: '10px',
          }}
        >
          {moment(logDetail.startTime).format('MMMM D, YYYY')}
        </TableCell>

        <TableCell
          colSpan={3}
          sx={{
            fontWeight: 500,
            borderTopRightRadius: '10px',
            borderBottomRightRadius: '10px',
          }}
        >
          {logDetail.runs.map((run) => (
            <LogsContainer key={run.id} run={run} flowRunId={logDetail.id} />
          ))}
        </TableCell>
      </TableRow>
    </>
  );
};

export const FlowLogs: React.FC<FlowLogsProps> = ({
  setShowLogsDialog,
  flow,
}) => {
  const { data: session }: any = useSession();
  const [logDetails, setLogDetails] = useState<DeploymentObject[]>([]);
  const [offset, setOffset] = useState(defaultLoadMoreLimit);
  const [showLoadMore, setShowLoadMore] = useState(true);
  const [loadMorePressed, setLoadMorePressed] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    (async () => {
      if (flow) {
        setLoading(true);
        const response: DeploymentObject[] = await fetchDeploymentLogs(
          flow.deploymentId,
          session
        );
        if (response) {
          setLogDetails(response);
        }

        if (response.length < defaultLoadMoreLimit) {
          setShowLoadMore(false);
        }
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Dialog
      data-testid="flowlogs-dialog"
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
        title="Logs History"
      />
      <Box sx={{ p: '0px 28px' }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ fontSize: '16px', display: 'flex' }}>
            <Typography sx={{ fontWeight: 700 }}>
              {`${flow?.name} |`}
            </Typography>
            <Typography sx={{ fontWeight: 600, ml: '4px' }}>
              {flow?.status ? 'Active' : 'Inactive'}
            </Typography>
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
                {columns.map((column, index) => (
                  <TableCell
                    sx={{
                      p: '8px 16px',
                      color: 'white',
                      background: '#00897B',
                      fontWeight: 700,
                      textAlign:
                        index === columns.length - 1 ? 'right' : 'unset',
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
                <Row key={logDetail.id} logDetail={logDetail} />
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
                    if (flow) {
                      setLoadMorePressed(true);
                      const response: DeploymentObject[] =
                        await fetchDeploymentLogs(
                          flow.deploymentId,
                          session,
                          offset
                        );
                      if (response) {
                        setLogDetails((logs) => [...logs, ...response]);
                        setOffset((offset) => offset + defaultLoadMoreLimit);
                      }
                      if (response.length < defaultLoadMoreLimit) {
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
