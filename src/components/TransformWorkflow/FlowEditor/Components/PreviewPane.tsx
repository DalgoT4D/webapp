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
  Button,
  ButtonGroup,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { httpGet } from '@/helpers/http';
import { DbtSourceModel } from '../FlowEditor';
import { useDbtRunLogs } from '@/contexts/DbtRunLogsContext';

type PreviewPaneProps = {};

const pageSize = 5;
const PreviewPane = ({}: PreviewPaneProps) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const flowEditorContext = useContext(FlowEditorContext);

  const [columns, setColumns] = useState<any[]>([]);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [currentPageIndex, setCurrentPageIndex] = useState(1); // Page index
  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)

  const dbtRunLogs = useDbtRunLogs();

  useEffect(() => {
    if (flowEditorContext?.previewNode.state.action === 'preview') {
      setModelToPreview(flowEditorContext?.previewNode.state.node);
    } else if (
      flowEditorContext?.previewNode.state.action === 'clear-preview'
    ) {
      setModelToPreview(null);
    }
  }, [flowEditorContext?.previewNode.state]);

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

  const handleNextPage = () => {
    setCurrentPageIndex((currentPageIndex) => currentPageIndex + 1);
  };

  const handlePreviousPage = () => {
    setCurrentPageIndex((currentPageIndex) => currentPageIndex - 1);
  };

  // Update useTable hook
  const { getHeaderGroups, getRowModel } = useReactTable({
    columns: tableData.columns,
    data: tableData.data,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography
          variant="body1"
          fontWeight="bold"
          padding="10px"
          color="grey"
        >
          {modelToPreview?.input_name}
        </Typography>
      </Box>
      <Box
        sx={{
          width: '100%',
          marginTop: '0',
          overflowX: 'auto',
          position: 'relative',
        }}
      >
        <Table sx={{ borderCollapse: 'collapse', width: '100%' }}>
          <TableHead>
            {getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableCell
                    key={header.id}
                    colSpan={header.colSpan}
                    sx={{
                      backgroundColor: '#f2f2f2',
                      border: '1px solid #dddddd',
                      padding: '8px',
                      textAlign: 'left',
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
            {getRowModel().rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      sx={{
                        border: '1px solid #dddddd',
                        padding: '4px',
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
        {data.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '1rem',
            }}
          >
            <ButtonGroup
              variant="outlined"
              color="primary"
              aria-label="pagination"
            >
              <Button
                onClick={() => handlePreviousPage()}
                disabled={currentPageIndex === 1}
              >
                Previous
              </Button>
              <Button
                onClick={() => handleNextPage()}
                disabled={currentPageIndex >= pageCount}
              >
                Next
              </Button>
            </ButtonGroup>
            <Typography
              variant="body1"
              component="span"
              sx={{ marginLeft: '1rem' }}
            >
              Page <strong>{currentPageIndex}</strong> of{' '}
              <strong>{pageCount}</strong>
            </Typography>
          </Box>
        )}
        {totalCount > 0 && (
          <Typography
            variant="body1"
            component="div"
            sx={{ textAlign: 'center', marginTop: '1rem' }}
          >
            Total rows: {totalCount}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PreviewPane;
