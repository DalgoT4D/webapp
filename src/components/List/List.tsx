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
  headers: Array<string | JSX.Element>;
  rows: Array<any>;
  openDialog: any;
  onlyList?: boolean;
  height?: number;
  hasCreatePermission?: boolean;
}

export const List = ({
  title,
  openDialog,
  headers,
  rows,
  onlyList,
  height,
  hasCreatePermission = true,
}: ListProps) => {
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
                {headers.map((header) => (
                  <TableCell
                    sx={{ px: 2, py: 1, fontWeight: 700, color: '#0925408A' }}
                    key={header}
                  >
                    {header}
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
              {rows.map((row: any, idx: number) => (
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
