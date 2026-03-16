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
  Button,
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
import SyncIcon from '@/assets/icons/sync.svg';
import styles from '@/styles/Common.module.css';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { httpGet } from '@/helpers/http';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import Image from 'next/image';
import { PreviewTableData } from '@/types/transform-v2.types';

const PreviewPane = ({
  height,
  schema: propSchema,
  table: propTable,
}: {
  height: number;
  schema?: string;
  table?: string;
}) => {
  const [modelToPreview, setModelToPreview] = useState<PreviewTableData | null>(null);
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

  // download in progress flag
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  // If schema/table props are provided (modal mode), use them directly
  useEffect(() => {
    if (propSchema && propTable) {
      setModelToPreview({ schema: propSchema, table: propTable });
    }
  }, [propSchema, propTable]);

  useEffect(() => {
    if (propSchema && propTable) return; // Skip context-based updates in modal mode
    if (previewAction.type === 'preview') {
      setModelToPreview(previewAction.data);
    } else if (previewAction.type === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [previewAction, propSchema, propTable]);

  useEffect(() => {
    if (modelToPreview) {
      fetchColumns(
        modelToPreview.schema,
        modelToPreview.table,
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

  const handleTableDataDownload = async () => {
    setDownloadInProgress(true);
    try {
      if (modelToPreview) {
        console.log('Downloading table data');
        const schema = modelToPreview.schema;
        const table = modelToPreview.table;

        const filename = `${schema}__${table}.csv`;

        const response = await httpGet(session, `warehouse/download/${schema}/${table}`, false);

        const blob = await response.blob();

        const a = document.createElement('a');

        // Create a URL for the blob
        const url = URL.createObjectURL(blob);

        // Set the download attributes
        a.href = url;
        a.download = filename || 'download';

        // Append the anchor element to the body
        document.body.appendChild(a);

        // Programmatically click the anchor element
        a.click();

        // Clean up: remove the anchor element from the body and revoke the blob URL
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadInProgress(false);
      }
    } catch (error: any) {
      setDownloadInProgress(false);
      errorToast(error.message, [], toastContext);
      console.error(error);
    }
  };

  return modelToPreview ? (
    <Box>
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          padding: '8px 20px 8px 44px',
        }}
      >
        <Typography variant="body1" fontWeight="bold">
          {modelToPreview.schema}.{modelToPreview.table}
        </Typography>
        <Button
          onClick={handleTableDataDownload}
          variant="contained"
          sx={{ padding: '5px ' }}
          disabled={downloadInProgress}
          data-testid="downloadbutton"
        >
          {downloadInProgress ? (
            <Image
              src={SyncIcon}
              className={styles.SyncIcon}
              alt="sync icon"
              data-testid="sync-icon"
            />
          ) : (
            <FileDownloadIcon fontSize="small" />
          )}
        </Button>
      </Box>
      <Box>
        <Box sx={{ height: height - 150, overflow: 'auto' }}>
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
                            sortedColumn === header.id ? (sortOrder === 1 ? 'asc' : 'desc') : 'asc'
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
              {getRowModel().rows.map((row: any) => {
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
          sx={{ marginRight: '20px' }}
        />
      </Box>
    </Box>
  ) : (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: height,
      }}
    >
      Select a table from the left pane to view
    </Box>
  );
};

export default PreviewPane;
