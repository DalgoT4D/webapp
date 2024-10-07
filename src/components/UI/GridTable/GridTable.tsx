import {
  IconButton,
  SxProps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface GridTableProps {
  headers: string[];
  data?: JSX.Element[][];
  removeItem?: any;
}

export const castGridStyles: { [key: string]: SxProps } = {
  container: {
    color: '#5E5E5E',
    borderSpacing: '0px',
    alignItems: 'center',
    borderRadius: 'unset',
  },
  headerItem: {
    background: '#EEF3F3',
  },
};

export const GridTable = ({ headers, data = [[]], removeItem }: GridTableProps) => {
  return (
    <Table sx={castGridStyles.container}>
      <TableHead sx={castGridStyles.headerItem}>
        <TableRow>
          {headers.map((header) => (
            <TableCell
              sx={{
                padding: '12px 16px',
                width: `${100 / headers.length}%`,
                borderRight: '1px solid #E8E8E8',
              }}
              key={header}
            >
              <Typography
                sx={{
                  fontWeight: '600',
                  fontSize: '14px',
                }}
              >
                {header}
              </Typography>
            </TableCell>
          ))}
          {removeItem && data.length > 1 && (
            <TableCell
              sx={{
                padding: '12px 16px',
                width: `10px`,
                borderRight: '1px solid #E8E8E8',
              }}
            ></TableCell>
          )}
        </TableRow>
      </TableHead>
      <TableBody>
        {data?.map((row, index) => (
          <TableRow key={index} sx={{ boxShadow: 'none' }}>
            {row.map((column, columnIndex) => (
              <TableCell
                sx={{
                  padding: '4px 8px',
                  width: `${100 / row.length}%`,
                  border: '1px solid #E8E8E8',
                  borderTop: 'unset',
                  '&:focus-within': {
                    border: '1px solid black',
                  },
                }}
                key={columnIndex}
              >
                {column}
              </TableCell>
            ))}
            {removeItem && data.length > 1 && (
              <TableCell
                sx={{
                  padding: '4px 8px',
                  border: '1px solid #E8E8E8',
                  width: `10px`,
                  borderTop: 'unset',
                }}
              >
                <IconButton onClick={() => removeItem(index)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
