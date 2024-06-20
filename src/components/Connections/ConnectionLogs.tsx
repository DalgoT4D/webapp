import {
  Box,
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
import { Connection } from './Connections';
import DownIcon from '@mui/icons-material/KeyboardArrowDown';
import UpIcon from '@mui/icons-material/KeyboardArrowUp';

import moment from 'moment';

function removeEscapeSequences(log: string) {
  // This regular expression matches typical ANSI escape codes
  return log.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

const fetchAirbyteLogs = async (
  connectionId: string,
  session: any,
  offset = 0
) => {
  try {
    const response = await httpGet(
      session,
      `airbyte/v1/connections/${connectionId}/sync/history?limit=${limit}&offset=${offset}`
    );

    return response.history || [];
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
        Connection History
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
  'Description',
  'Records synced',
  'Bytes synced',
  'Duration',
];

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
  bytesEmitted: string;
  bytesSynced: string;
  date: string;
  job_id: number;
  logs: string[];
  recordsCommitted: number;
  recordsEmitted: number;
  recordsSynced: number;
  status: string;
  totalTimeInSeconds: number;
}

const limit = 10;

const Row = ({ logDetail }: { logDetail: LogObject }) => {
  const [open, setOpen] = useState(false);
  return (
    <TableRow
      key={logDetail.job_id}
      sx={{
        position: 'relative',
        p: 2,

        background:
          logDetail.status === 'failed' ? 'rgba(211, 47, 47, 0.04)' : 'unset',
      }}
    >
      <TableCell
        sx={{
          verticalAlign: 'baseline',
          fontWeight: 600,
          borderTopLeftRadius: '10px',
          borderBottomLeftRadius: '10px',
        }}
      >
        {moment(logDetail.date).format('MMMM D, YYYY')}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'baseline', fontWeight: 500 }}>
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
          {logDetail.logs.map((log: string) => {
            log = removeEscapeSequences(log);
            const pattern1 = /\)[:;]\d+ -/;
            const pattern2 = /\)[:;]\d+/;
            let match = log.match(pattern1);
            let index = 0;
            if (match?.index) {
              index = match.index + match[0].length;
            } else {
              match = log.match(pattern2);
              if (match?.index) {
                index = match.index + match[0].length;
              }
            }
            return <Box sx={{ mb: 2 }}>{log.slice(index)}</Box>;
          })}
        </Box>
      </TableCell>
      <TableCell sx={{ verticalAlign: 'baseline', fontWeight: 500 }}>
        {logDetail.recordsSynced}
      </TableCell>
      <TableCell sx={{ verticalAlign: 'baseline', fontWeight: 500 }}>
        {logDetail.bytesSynced}
      </TableCell>
      <TableCell
        sx={{
          verticalAlign: 'baseline',
          fontWeight: 500,
          borderTopRightRadius: '10px',
          borderBottomRightRadius: '10px',
        }}
      >
        {formatDuration(logDetail.totalTimeInSeconds)}
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

export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  setShowLogsDialog,
  connection,
}) => {
  const { data: session }: any = useSession();
  const [logDetails, setLogDetails] = useState<LogObject[]>([]);
  const [offset, setOffset] = useState(1);
  const [showLoadMore, setShowLoadMore] = useState(true);
  useEffect(() => {
    (async () => {
      if (connection) {
        const response: LogObject[] = await fetchAirbyteLogs(
          connection.connectionId,
          session
        );
        if (response) {
          setLogDetails(response);
        }

        if (response.length < limit) {
          setShowLoadMore(false);
        }
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
              {`${connection?.name} |`}
            </Typography>
            <Typography sx={{ fontWeight: 600, ml: '4px' }}>
              {connection?.source.sourceName} →{' '}
              {connection?.destination.destinationName}
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
                <Row key={logDetail.job_id} logDetail={logDetail} />
              ))}
            </TableBody>
          </Table>
          {logDetails.length > 0
            ? showLoadMore && (
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
                      if (connection) {
                        const response: LogObject[] = await fetchAirbyteLogs(
                          connection.connectionId,
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
            : 'No information available'}
        </Box>
      </Box>
    </Dialog>
  );
};
