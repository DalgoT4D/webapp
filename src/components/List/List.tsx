import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Button, Typography, IconButton } from '@mui/material';
import { SwapVert } from '@mui/icons-material';

interface ListProps {
  title: string;
  headers: Array<string>;
  rows: Array<any>;
  openDialog: any;
  onlyList?: boolean;
  rowValues?: Array<Array<any>>
  isSortable?: Array<boolean>;
}

export const List = ({
  title,
  openDialog,
  headers,
  rows,
  onlyList,
  rowValues,
  isSortable,
}: ListProps) => {
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc' | 'none'>('none');
  const [sortColumn, setSortColumn] = React.useState<number | null>(null);

  const handleSort = (index: number) => {
    if (sortColumn === index) {
      // Change sort direction if sorting the same column again:
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc');
    } else {
      // First time sorting the column:
      setSortColumn(index);
      setSortDirection('asc');
    }
  };

  const orderedRows = React.useMemo(() => {
    if (sortColumn === null || sortDirection === 'none' || !rowValues) return rows; // no sorting needed

    // Sort row values lexicographically based on the sort column:
    const sorted = [...rowValues].sort((a, b) => {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // Sort the rows based on the new indices of `rowValues`:
    return sorted.map((rowValue) => rows[rowValues.indexOf(rowValue)]);
  }, [rows, rowValues, sortColumn, sortDirection]);

  return (
    <>
      <Box display="flex" justifyContent="flex-end">
        {!onlyList && (
          <Button
            data-testid={`add-new-${title}`.toLowerCase()}
            variant="contained"
            onClick={() => openDialog()}
            className={`${title}add_walkthrough`.toLowerCase()}
          >
            + New {title}
          </Button>
        )}
      </Box>
      {rows.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead sx={{ display: 'table-header-group' }}>
              <TableRow>
                {headers.map((header, index) => (
                  <TableCell
                    sx={{ px: 2, py: 1, fontWeight: 700, color: '#0925408A' }}
                    key={header}
                  >
                    {header}
                    {isSortable && isSortable[index] && (
                      <IconButton onClick={() => handleSort(index)}>
                        <SwapVert/>
                      </IconButton>
                    )}
                  </TableCell>
                ))}
                <TableCell
                  sx={{ px: 2, py: 1, fontWeight: 700, color: '#0925408A' }}
                  align="right"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderedRows.map((row: any, idx: number) => (
                <TableRow
                  key={idx}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  {row.map(
                    // if action is sent render with right align
                    (column: any, idx: number) => (
                      <TableCell
                        key={idx}
                        align={
                          headers.length + 1 === row.length &&
                            idx === row.length - 1
                            ? 'right'
                            : 'left'
                        }
                      >
                        {column}
                      </TableCell>
                    )
                  )}
                  {headers.length + 1 !== row.length ? ( // if actions is not sent render some text
                    <TableCell sx={{ p: 1 }} align="right">
                      Actions
                    </TableCell>
                  ) : (
                    ''
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Box>
          <Typography>
            No {title.toLowerCase()} found. Please create one
          </Typography>
        </Box>
      )}
    </>
  );
};
