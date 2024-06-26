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

function removeEscapeSequences(log: string) {
  // This regular expression matches typical ANSI escape codes
  return log.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

const fetchDeploymentLogs = async (
  deploymentId: string,
  session: any,
  offset = 0
) => {
  try {
    const response = await httpGet(
      session,
      `prefect/flows/${deploymentId}/flow_runs/history?limit=${limit}&fetchlogs=true&offset=${offset}`
    );

    return response || [];
  } catch (err: any) {
    console.error(err);
  }
};

const TopNavBar = ({ handleClose }: any) => (
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
        Flow History
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

interface FlowLogsProps {
  setShowLogsDialog: (value: boolean) => any;
  flow: FlowInterface | undefined;
}

const columns = ['Date', 'Logs', 'Records synced', 'Bytes synced', 'Duration'];

const formatDuration = (seconds: number) => {
  const duration = moment.duration(seconds, 'seconds');
  const days = Math.floor(duration.asDays());
  const hours = Math.floor(duration.hours());
  const minutes = Math.floor(duration.minutes());
  const secs = Math.floor(duration.seconds());

  let formattedDuration = '';

  if (days > 0) {
    formattedDuration += `${days}d `;
  }
  if (hours > 0) {
    formattedDuration += `${hours}h `;
  }
  if (minutes > 0) {
    formattedDuration += `${minutes}m `;
  }
  if (secs > 0 || formattedDuration === '') {
    formattedDuration += `${secs}s`;
  }

  return formattedDuration.trim();
};

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
          logDetail.status === 'failed' ? 'rgba(211, 47, 47, 0.04)' : 'unset',
      }}
    >
      <TableCell
        sx={{
          verticalAlign: 'top',
          fontWeight: 600,
          borderTopLeftRadius: '10px',
          borderBottomLeftRadius: '10px',
        }}
      >
        {moment(logDetail.startTime).format('MMMM D, YYYY')}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', fontWeight: 500 }}>
        <Box
          sx={{
            mb: 2,
            maxWidth: '800px',
            height: open ? '400px' : '54px',
            overflow: open ? 'scroll' : 'hidden',
            wordBreak: 'break-all',
            transition: 'height 0.5s ease-in-out',
          }}
        >
          {logDetail.runs
            .map((run) => run.logs.map((log) => <Box>{log.message}</Box>))
            .flat()}
        </Box>
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', fontWeight: 500 }}>
        {logDetail.name}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'top', fontWeight: 500 }}>
        {logDetail.state_name}
      </TableCell>
      <TableCell
        sx={{
          verticalAlign: 'top',
          fontWeight: 500,
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        {formatDuration(logDetail.totalRunTime)}
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
      <TopNavBar handleClose={() => setShowLogsDialog(false)} />
      <Box sx={{ p: '0px 28px' }}>
        <Box sx={{ mb: 1 }}>
          <Box sx={{ fontSize: '16px', display: 'flex' }}>
            <Typography sx={{ fontWeight: 700 }}>
              {`${flow?.name} |`}
            </Typography>
            <Typography sx={{ fontWeight: 600, ml: '4px' }}>
              {flow?.status}
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
                {columns.map((column) => (
                  <TableCell
                    sx={{ p: '8px 16px', color: 'white', fontWeight: 700 }}
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
