import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import { Box, Button, Typography } from '@mui/material';

interface ListProps {
  title: string;
  rows: Array<any>;
  openDialog: any;
  onlyList?: boolean;
  height?: number;
  hasCreatePermission?: boolean;
  headers: {
    values: Array<string | JSX.Element>;
    sortable?: Array<boolean>;
  };
  rowValues?: Array<Array<any>>;
}

export const List = ({
  title,
  openDialog,
  headers,
  rows,
  onlyList,
  height,
  hasCreatePermission = true,
  rowValues,
}: ListProps) => {
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>();
  const [sortColumn, setSortColumn] = React.useState<number | null>(null);

  const handleSort = (index: number) => {
    if (sortColumn === index) {
      // Toggle sort direction if sorting the same column again:
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      // First time sorting the column:
      setSortColumn(index);
      setSortDirection('asc');
    }
  };

  const orderedRows = React.useMemo(() => {
    if (sortColumn === null || sortDirection === undefined || !rowValues)
      return rows; // no sorting needed

    // Sort row values lexicographically based on the sort column:
    const sorted = [...rowValues].sort((a, b) => {
      const aValue = a[sortColumn].toString().toLowerCase();
      const bValue = b[sortColumn].toString().toLowerCase();
    
      if (aValue < bValue) 
        return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue)
        return sortDirection === 'asc' ? 1 : -1;
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
            disabled={!hasCreatePermission}
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
                {headers.values.map((header, index) => (
                  <TableCell
                    sx={{ px: 2, py: 1, fontWeight: 700, color: '#0925408A' }}
                    key={index}
                  >
                    {headers.sortable && headers.sortable[index] ? (
                      <TableSortLabel
                        active={sortColumn === index}
                        direction={sortColumn === index ? sortDirection : 'asc'}
                        onClick={() => handleSort(index)}
                      >
                        {header}
                      </TableSortLabel>
                    ) : (
                      header
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
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    ...(height && { height }),
                  }}
                >
                  {row.map(
                    // if action is sent render with right align
                    (column: any, idx: number) => (
                      <TableCell
                        key={idx}
                        align={
                          headers.values.length + 1 === row.length &&
                          idx === row.length - 1
                            ? 'right'
                            : 'left'
                        }
                      >
                        {column}
                      </TableCell>
                    )
                  )}
                  {headers.values.length + 1 !== row.length ? ( // if actions is not sent render some text
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
