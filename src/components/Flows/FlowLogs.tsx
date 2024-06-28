import {
  Box,
  CircularProgress,
  Dialog,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { Transition } from '../DBT/DBTTransformType';
import Close from '@mui/icons-material/Close';
import { useEffect, useState } from 'react';
import { httpGet } from '@/helpers/http';
import { useSession } from 'next-auth/react';

import DownIcon from '@mui/icons-material/KeyboardArrowDown';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';

import moment from 'moment';
import { FlowInterface } from './Flows';
import { formatDuration } from '@/utils/common';
import { TopNavBar } from '../Connections/ConnectionLogs';

const fetchDeploymentLogs = async (
  deploymentId: string,
  session: any,
  offset = 0
) => {
  try {
    const response = await httpGet(
      session,
      `prefect/v1/flows/${deploymentId}/flow_runs/history?limit=${limit}&fetchlogs=true&offset=${offset}`
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

const columns = ['Date', 'Logs', 'Duration'];

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

const limit = 10;

const Row = ({ logDetail }: { logDetail: DeploymentObject }) => {
  const [open, setOpen] = useState(false);
  return (
    <TableRow
      key={logDetail.id}
      sx={{
        position: 'relative',
        p: 2,

        background:
          logDetail.status === 'FAILED' ? 'rgba(211, 47, 47, 0.04)' : 'unset',
      }}
    >
      <TableCell
        sx={{
          width: '150px',
          verticalAlign: 'top',
          fontWeight: 600,
          borderTopLeftRadius: '10px',
          borderBottomLeftRadius: '10px',
        }}
      >
        {moment(logDetail.startTime).format('MMMM D, YYYY')}
      </TableCell>
      <TableCell
        colSpan={2}
        sx={{
          verticalAlign: 'top',
          fontWeight: 500,
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        <Box
          sx={{
            mb: 2,
            height: open ? '400px' : '54px',
            overflow: open ? 'scroll' : 'hidden',
            transition: 'height 0.5s ease-in-out',
          }}
        >
          <Box sx={{ wordBreak: 'break-word' }}>
            {logDetail.runs.map((run) => (
              <Box key={run.id} sx={{ display: 'flex', mb: 2 }}>
                <Box sx={{ width: '90%' }}>
                  <Box>
                    <strong>{run.kind}</strong>
                  </Box>
                  {run.logs.map((log, index) => (
                    <Box key={log.timestamp + index}>{log.message}</Box>
                  ))}
                </Box>
                <Box sx={{ ml: 'auto', width: '10%', textAlign: 'right' }}>
                  {formatDuration(
                    moment
                      .duration(
                        moment(run.end_time).diff(moment(run.start_time))
                      )
                      .asSeconds()
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </TableCell>

      <Box
        sx={{ position: 'absolute', bottom: 0, left: '50%', cursor: 'pointer' }}
      >
        {open ? (
          <UpIcon onClick={() => setOpen(!open)} />
        ) : (
          <DownIcon onClick={() => setOpen(!open)} />
        )}
      </Box>
    </TableRow>
  );
};

export const FlowLogs: React.FC<FlowLogsProps> = ({
  setShowLogsDialog,
  flow,
}) => {
  const { data: session }: any = useSession();
  const [logDetails, setLogDetails] = useState<DeploymentObject[]>([]);
  const [offset, setOffset] = useState(1);
  const [showLoadMore, setShowLoadMore] = useState(true);
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

        if (response.length < limit) {
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
        <Box>
          <Table>
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
                      const response: DeploymentObject[] =
                        await fetchDeploymentLogs(
                          flow.deploymentId,
                          session,
                          offset
                        );
                      if (response) {
                        setLogDetails((logs) => [...logs, ...response]);
                        setOffset((offset) => offset + 1);
                      }
                      if (response.length < limit) {
                        setShowLoadMore(false);
                      }
                    }
                  }}
                >
                  load more <DownIcon />
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
        </Box>
      </Box>
    </Dialog>
  );
};
