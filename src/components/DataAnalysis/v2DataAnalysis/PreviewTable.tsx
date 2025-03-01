import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { GlobalContext } from '@/contexts/ContextProvider';
import { httpGet, httpPost } from '@/helpers/http';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Typography,
} from '@mui/material';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useSession } from 'next-auth/react';
import { useContext, useEffect, useMemo, useState } from 'react';

export const PreviewTable = ({
  sqlText,
  sessionName,
}: {
  sqlText: string;
  sessionName: string;
}) => {
  const { data: session } = useSession();
  const globalContext = useContext(GlobalContext);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Page index
  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)
  const [loading, setLoading] = useState(false);

  const handleSort = (columnId: string) => {
    if (sortedColumn === columnId) {
      setSortOrder(sortOrder === 1 ? -1 : 1);
    } else {
      setSortedColumn(columnId);
      setSortOrder(1);
    }
  };

  const tableData = useMemo(() => {
    return {
      columns,
      data,
    };
  }, [columns, data]);

  const { getHeaderGroups, getRowModel } = useReactTable({
    columns: tableData.columns,
    data: tableData.data,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const getPreivewData = async (sql: string, pageSize: number) => {
    setLoading(true);
    const offset = (currentPageIndex - 1) * pageSize; // Calculate the offset based on current page and page size
    try {
      const response = await httpPost(session, `warehouse/table_data/run_sql`, {
        sql: sql,
        limit: pageSize,
        offset: offset,
      });
      console.log(response, 'responseof the fetch data.');
      const { rows, columns } = response; // Assuming `totalRows` is included in the response
      console.log(response, 'response');
      setData(rows.slice(0, pageSize)); // Set the data to be displayed on the current page
      setColumns(columns.map((col: string) => ({ accessorKey: col, header: col })));
    } catch (error) {
      errorToast('Error fetching preview data', [], globalContext);
    } finally {
      setLoading(false);
    }
  };
  const fetchTotalRows = async () => {
    try {
      const response = await httpGet(session, `warehouse/row_count/sql`);
      const { totalRows } = response;
      setTotalCount(totalRows); // Set the total row count from the API
      setPageCount(Math.ceil(totalRows / pageSize)); // Set the page count based on total rows and page size
    } catch (error: any) {
      console.error(error.message);
      errorToast(error.message, [], globalContext);
    }
  };

  useEffect(() => {
    if (sessionName) {
      getPreivewData(sqlText, pageSize);
    }
    if (!totalCount) {
      fetchTotalRows();
    }
    if (!sqlText) {
      setData([]);
    }
  }, [sqlText, sessionName, totalCount]); // Dependency on currentPageIndex and pageSize to refetch data

  if (!data.length) {
    return (
      <>
        {sqlText ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', padding: '10px' }}>
            <Button
              variant="contained"
              color="primary"
              disabled={!sqlText}
              onClick={() => getPreivewData(sqlText, pageSize)}
            >
              Preview Data
            </Button>
          </Box>
        ) : (
          <Typography
            variant="h3"
            sx={{ color: 'grey', fontSize: '16px', fontStyle: 'italic', width: '100%' }}
          >
            View the preview Data here..
          </Typography>
        )}
      </>
    );
  }
  return (
    <>
      {data.length ? (
        <Box>
          <Box>
            <Box sx={{ maxHeight: '50vh', overflow: 'auto' }}>
              <Table stickyHeader sx={{ width: '100%', borderSpacing: 0 }}>
                <TableHead>
                  {getHeaderGroups().map((headerGroup: any) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header: any, i: number) => (
                        <TableCell
                          key={header.id}
                          colSpan={header.colSpan}
                          sx={{
                            backgroundColor: '#F5FAFA',
                            border: '1px solid #dddddd',
                            borderLeft: 'unset',
                            padding: i == 0 ? '8px 0 8px 40px' : '8px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: 'rgba(15, 36, 64, 0.57)',
                          }}
                        >
                          <Box display="flex" alignItems="center">
                            <TableSortLabel
                              active={sortedColumn === header.id}
                              direction={
                                sortedColumn === header.id
                                  ? sortOrder === 1
                                    ? 'asc'
                                    : 'desc'
                                  : 'asc'
                              }
                              onClick={() => handleSort(header.id)}
                              sx={{ marginLeft: '4px' }}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </TableSortLabel>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableHead>
                <TableBody sx={{ borderColor: '#dddddd' }}>
                  {getRowModel().rows.length > 0 ? (
                    getRowModel().rows.map((row: any) => {
                      return (
                        <TableRow key={row.id} sx={{ boxShadow: 'unset' }}>
                          {row.getVisibleCells().map((cell: any, i: number) => (
                            <TableCell
                              key={cell.id}
                              sx={{
                                fontWeight: 600,
                                borderBottom: '1px solid #dddddd',
                                borderRight: '1px solid #dddddd',
                                padding: i === 0 ? '8px 40px 8px 44px' : '8px',
                                textAlign: 'left',
                                fontSize: '0.8rem',
                              }}
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} align="center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 100]}
              component="div"
              count={totalCount}
              rowsPerPage={pageSize}
              page={currentPageIndex - 1}
              onPageChange={(e, newPage) => {
                setCurrentPageIndex(newPage + 1);
                getPreivewData(sqlText, pageSize);
              }}
              onRowsPerPageChange={(e: any) => {
                setPageSize(e.target.value);
                setCurrentPageIndex(1);
                getPreivewData(sqlText, e.target.value);
              }}
              sx={{ marginRight: '20px', display: 'block' }} // Ensure pagination is always visible
            />
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          Loading...
        </Box>
      )}
    </>
  );
};
