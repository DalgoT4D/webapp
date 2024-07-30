import {
  Box,
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
}

export const LogsPane = ({
  height,
  dbtRunLogs,
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
