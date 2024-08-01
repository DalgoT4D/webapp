import {
  Backdrop,
  Box,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material';
import moment from 'moment';

interface LogsPaneProps {
  height: number;
  dbtRunLogs: Array<{
    timestamp: string;
    message: string;
  }>;
  workflowInProgress: boolean;
}

export const LogsPane = ({
  height,
  dbtRunLogs,
  workflowInProgress,
}: LogsPaneProps) => {
  return (
    <Box height={height - 50} sx={{ overflow: 'auto', position: 'relative' }}>
      {dbtRunLogs.length > 0 ? (
        <Table stickyHeader sx={{ borderCollapse: 'collapse', width: '100%' }}>
          <TableHead>
            <TableRow>
              {['Last Run', 'Description'].map((header: any) => (
                <TableCell
                  key={header.id}
                  colSpan={header.colSpan}
                  sx={{
                    backgroundColor: '#F5FAFA',
                    padding: '10px 20px',
                    textAlign: 'left',
                    fontWeight: 700,
                    minWidth: '200px',
                  }}
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody sx={{ borderColor: '#dddddd' }}>
            {dbtRunLogs.map((log) => {
              return (
                <TableRow
                  key={log.timestamp}
                  sx={{
                    boxShadow: 'none',
                    borderRadius: '0',
                    borderBottom: '1px solid rgba(238, 238, 238, 1)',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                  }}
                >
                  <TableCell
                    sx={{
                      padding: '10px 20px',
                      fontWeight: 500,
                    }}
                  >
                    {moment(log.timestamp).format('YYYY/MM/DD')}{' '}
                    &nbsp;&nbsp;&nbsp;&nbsp;
                    {moment(log.timestamp).format('hh:mm:ss A ')}
                  </TableCell>
                  <TableCell
                    sx={{
                      padding: '10px 20px',
                      fontWeight: 500,
                    }}
                  >
                    {log.message}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : workflowInProgress ? (
        <Backdrop
          sx={{
            background: 'white',
            position: 'absolute', // Position the Backdrop over the Box
            top: 0,
            left: 0,
            right: 0,
            bottom: 0, // Cover the entire Box
            zIndex: (theme) => theme.zIndex.drawer + 1,
          }}
          data-testid = "progressbar"
          open={workflowInProgress}
          onClick={() => {}}
        >
          <CircularProgress
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          />
        </Backdrop>
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          Please press run
        </Box>
      )}
    </Box>
  );
};
