import React, { useContext, useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableSortLabel,
  TablePagination,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { httpGet } from '@/helpers/http';
import { DbtSourceModel } from '../Canvas';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';

const PreviewPane = ({ height }: { height: number }) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const { previewAction } = usePreviewAction();

  const [columns, setColumns] = useState<any[]>([]);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);
  const [pageSize, setPageSize] = useState(5);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Page index
  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)

  useEffect(() => {
    if (previewAction.type === 'preview') {
      setModelToPreview(previewAction.data);
    } else if (previewAction.type === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [previewAction]);

  useEffect(() => {
    if (modelToPreview) {
      fetchColumns(
        modelToPreview.schema,
        modelToPreview.input_name,
        currentPageIndex,
        pageSize,
        sortedColumn,
        sortOrder
      );
    }
  }, [modelToPreview, currentPageIndex, sortedColumn, sortOrder, pageSize]);

  const fetchColumns = async (
    schema: string,
    table: string,
    initialPage: number,
    limit: number,
    order_by?: string,
    order?: number
  ) => {
    try {
      let dataUrl = `warehouse/table_data/${schema}/${table}?page=${initialPage}&limit=${limit}`;
      if (order_by && order) {
        dataUrl += `&order_by=${order_by}&order=${order}`;
      }

      // Fetch table data and column specifications
      const [columnSpec, rows, count] = await Promise.all([
        httpGet(session, `warehouse/table_columns/${schema}/${table}`),
        httpGet(session, dataUrl),
        httpGet(session, `warehouse/table_count/${schema}/${table}`),
      ]);

      setTotalCount(count.total_rows);
      setColumns(
        columnSpec.map((col: { name: string; data_type: string }) => ({
          header: col.name,
          accessorKey: col.name,
          autoHeight: true,
        }))
      );

      const currentPageData = rows.slice(0, pageSize);
      setData(currentPageData);

      const totalPages = Math.ceil(count.total_rows / pageSize);
      setPageCount(totalPages);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

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

  // Update useTable hook
  const { getHeaderGroups, getRowModel } = useReactTable({
    columns: tableData.columns,
    data: tableData.data,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return modelToPreview ? (
    <Box>
      <Box
        sx={{
          alignItems: 'center',
        }}
      >
        <Typography variant="body1" fontWeight="bold" padding="10px">
          {modelToPreview?.input_name}
        </Typography>
      </Box>
      <Box>
        <Box sx={{ height: height - 150, overflow: 'auto' }}>
          <Table stickyHeader sx={{ width: '100%', borderSpacing: 0 }}>
            <TableHead>
              {getHeaderGroups().map((headerGroup: any) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header: any) => (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      sx={{
                        backgroundColor: '#F5FAFA',
                        border: '1px solid #dddddd',
                        borderLeft: 'unset',
                        padding: '8px',
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
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </TableSortLabel>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableHead>
            <TableBody sx={{ borderColor: '#dddddd' }}>
              {getRowModel().rows.map((row: any) => {
                return (
                  <TableRow key={row.id} sx={{ boxShadow: 'unset' }}>
                    {row.getVisibleCells().map((cell: any) => (
                      <TableCell
                        key={cell.id}
                        sx={{
                          fontWeight: 600,
                          borderBottom: '1px solid #dddddd',
                          borderRight: '1px solid #dddddd',

                          textAlign: 'left',
                          fontSize: '0.8rem',
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={pageSize}
          page={currentPageIndex - 1}
          onPageChange={(e, newPage) => setCurrentPageIndex(newPage + 1)}
          onRowsPerPageChange={(e: any) => {
            setPageSize(e.target.value);
            setCurrentPageIndex(1);
          }}
        />
      </Box>
    </Box>
  ) : null;
};

export default PreviewPane;
