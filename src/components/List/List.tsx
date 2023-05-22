import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Button, Typography } from '@mui/material';

interface ListProps {
  title: string;
  headers: Array<string>;
  rows: Array<any>;
  openDialog: any;
}

export const List = ({ title, openDialog, headers, rows }: ListProps) => {
  return (
    <>
      <Box display="flex" justifyContent="flex-end">
        <Button
          data-testid={`add-new-${title}`.toLowerCase()}
          variant="contained"
          onClick={() => openDialog()}
        >
          + New {title}
        </Button>
      </Box>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead sx={{ display: 'table-header-group' }}>
            <TableRow>
              {headers.map((header) => (
                <TableCell sx={{ padding: '16px' }} key={header}>
                  {header}
                </TableCell>
              ))}
              <TableCell sx={{ padding: '16px' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row: any) => (
              <TableRow
                key={row.name}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                {row.map(
                  // if action is sent render with right align
                  (column: any, idx: number) => (
                    <TableCell
                      key={column}
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
                  <TableCell sx={{ padding: '16px' }} align="right">
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
    </>
  );
};
