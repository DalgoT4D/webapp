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
import moment from 'moment';

function removeEscapeSequences(log: string) {
  // This regular expression matches typical ANSI escape codes
  return log.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

const fetchAirbyteLogs = async (connectionId: string, session: any) => {
  try {
    const response = await httpGet(
      session,
      `airbyte/v1/connections/${connectionId}/sync/history`
    );

    return response.history;

    // response.logs.forEach((log: string) => {
    //   log = removeEscapeSequences(log);
    //   const pattern1 = /\)[:;]\d+ -/;
    //   const pattern2 = /\)[:;]\d+/;
    //   let match = log.match(pattern1);
    //   let index = 0;
    //   if (match?.index) {
    //     index = match.index + match[0].length;
    //   } else {
    //     match = log.match(pattern2);
    //     if (match?.index) {
    //       index = match.index + match[0].length;
    //     }
    //   }
    //   formattedLogs.push(log.slice(index));
    // });
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

export const ConnectionLogs: React.FC<ConnectionLogsProps> = ({
  setShowLogsDialog,
  connection,
}) => {
  const { data: session }: any = useSession();
  const [logDetails, setLogDetails] = useState<LogObject[]>([]);
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
        <Box>
          <Box sx={{ fontSize: '16px', display: 'flex' }}>
            <Typography sx={{ fontWeight: 700 }}>
              {`${connection?.name} |`}
            </Typography>
            <Typography sx={{ fontWeight: 600, ml: '4px' }}>
              {connection?.source.sourceName} →{' '}
              {connection?.destination.destinationName}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', fontSize: '14px' }}>
            <Typography sx={{ fontWeight: 600, color: '#7D8998' }}>
              Scheduled on
            </Typography>
            {/* <Typography>{moment(connection?.lastRun)}</Typography> */}
          </Box>
        </Box>
        <Box>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {logDetails.map((logDetail) => (
                <TableRow key={logDetail.job_id}>
                  <TableCell>
                    {moment(logDetail.date).format('MMMM D, YYYY')}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ width: '500px' }}>
                      {logDetail.logs.join('\n')}
                    </Box>
                  </TableCell>
                  <TableCell>{logDetail.recordsSynced}</TableCell>
                  <TableCell>{logDetail.bytesSynced}</TableCell>
                  <TableCell>
                    {formatDuration(logDetail.totalTimeInSeconds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Dialog>
  );
};
