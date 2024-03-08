import React, { useContext, useEffect, useState, useMemo } from 'react';
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, TableSortLabel, Button, ButtonGroup } from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import { FlowEditorContext } from '@/contexts/FlowEditorContext';
import { useTable, useSortBy, usePagination } from 'react-table';
import { httpGet } from '@/helpers/http';
import { DbtSourceModel } from '../FlowEditor';

type PreviewPaneProps = {};

const pageSize = 5;
const PreviewPane = ({ }: PreviewPaneProps) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const flowEditorContext = useContext(FlowEditorContext);

  const [columns, setColumns] = useState<any[]>([]);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [remainingData, setRemainingData] = useState<any[]>([]); // Remaining data for pagination
  const [currentPageIndex, setCurrentPageIndex] = useState(0); // Page index
  
  const [sortedColumn, setSortedColumn] = useState(null); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)


  useEffect(() => {
    if (flowEditorContext?.previewNode.state.action === 'preview') {
      setModelToPreview(flowEditorContext?.previewNode.state.node);
    } else if (flowEditorContext?.previewNode.state.action === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [flowEditorContext?.previewNode.state]);

  useEffect(() => {
    if (modelToPreview) {
      const initialPage = 0; // Set the initial page
      const limit = 10; 
      fetchColumns(modelToPreview.schema, modelToPreview.input_name, initialPage, limit);
    }
  }, [modelToPreview]);

  const fetchColumns = async (schema: string, table: string, initialPage: number, limit: number, order_by?: string, order?: number) => {
    try {
      let dataUrl = `warehouse/table_data/${schema}/${table}?page=${initialPage}&limit=${limit}`;
      if (order_by && order) {
        dataUrl += `&order_by=${order_by}&order=${order}`;
      }
  
      // Fetch table data and column specifications
      const [columnSpec, rows, count] = await Promise.all([
        httpGet(session, `warehouse/table_columns/${schema}/${table}`),
        httpGet(session, dataUrl),
        httpGet(session, `warehouse/table_count/${schema}/${table}`)
      ]);
  
      setTotalCount(count.total_rows);
      setColumns(
        columnSpec.map((col: { name: string; data_type: string }) => ({
          Header: col.name,
          accessor: col.name,
          autoHeight: true,
        }))
      );

      // Set current page data and remaining data
      const currentPageData = rows.slice(0, pageSize);
      const remainingRows = rows.slice(pageSize);
      setData(currentPageData);
      setRemainingData(remainingRows);
  
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
      data
    };
  }, [columns, data]);

  const handleNextPage = () => {
    const nextPageIndex = Math.min(currentPageIndex + 1, Math.ceil(totalCount / pageSize) - 1);
    setCurrentPageIndex(nextPageIndex);
  };

  const handlePreviousPage = () => {
    const previousPageIndex = Math.max(currentPageIndex - 1, 0);
    setCurrentPageIndex(previousPageIndex);
  };

  const fetchSortedData = async () => {
    fetchColumns(modelToPreview.schema, modelToPreview.input_name, currentPageIndex, pageSize, sortedColumn, sortOrder);
  };
  
  useEffect(() => {
    if (modelToPreview) {
      fetchSortedData();
    }
  }, [modelToPreview, currentPageIndex, sortedColumn, sortOrder]);
  
  // Update useTable hook
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page: tablePage,
    state: { pageIndex, sortBy } // Add sortBy
  } = useTable(
    {
      columns: tableData.columns,
      data: tableData.data,
      manualPagination: true,
      pageCount: 0,
      manualSortBy: false,
      // Pass sorting parameters
      initialState: {
        pageIndex: currentPageIndex,
        sortBy: [{ id: sortedColumn, desc: sortOrder === -1 }]
      }
    },
    useSortBy,
    usePagination
  );

  useEffect(() => {
    if (modelToPreview) {
      fetchRows(modelToPreview.schema, modelToPreview.input_name);
    }
  }, [modelToPreview, currentPageIndex]);

  const fetchRows = async (schema: string, table: string) => {
    try {
      const rows = await httpGet(session, `warehouse/table_data/${schema}/${table}?page=${currentPageIndex + 1}&limit=5`);
      const count = await httpGet(session, `warehouse/table_count/${schema}/${table}`);
      setData(rows);
      setTotalCount(count.total_rows);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };  

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" fontWeight="bold" padding="10px" color="grey">{modelToPreview?.input_name}</Typography>
      </Box>
      <Box sx={{ width: '100%', marginTop: '0', overflowX: 'auto', position: 'relative' }}>
        <Table {...getTableProps()} sx={{ borderCollapse: 'collapse', width: '100%' }}>
          <TableHead>
            {headerGroups.map((headerGroup) => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <TableCell
                    {...column.getHeaderProps(column.getSortByToggleProps())}
                    sx={{
                      backgroundColor: '#f2f2f2',
                      border: '1px solid #dddddd',
                      padding: '8px',
                      textAlign: 'left'
                    }}
                  >
                    <Box display="flex" alignItems="center">
                      <TableSortLabel
                        active={sortedColumn === column.id}
                        direction={sortedColumn === column.id ? (sortOrder === 1 ? 'asc' : 'desc') : 'asc'}
                        onClick={() => handleSort(column.id)}
                        sx={{ marginLeft: '4px' }}
                      >
                        {column.render('Header')}
                      </TableSortLabel>

                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()} sx={{ borderColor: '#dddddd' }}>
            {tablePage.map((row: any) => {
              prepareRow(row);
              return (
                <TableRow {...row.getRowProps()}>
                  {row.cells.map((cell: any) => (
                    <TableCell
                      {...cell.getCellProps()}
                      sx={{ border: '1px solid #dddddd', padding: '4px', textAlign: 'left', fontSize: '0.8rem' }}
                    >
                      {cell.column.id === '_airbyte_data' ? cell.render('Cell')._airbyte_data : cell.render('Cell')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {data.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <ButtonGroup variant="outlined" color="primary" aria-label="pagination">
              <Button onClick={() => handlePreviousPage()} disabled={currentPageIndex === 0}>
                Previous
              </Button>
              <Button onClick={() => handleNextPage()} disabled={currentPageIndex >= pageCount - 1}>
                Next
              </Button>
            </ButtonGroup>
            <Typography variant="body1" component="span" sx={{ marginLeft: '1rem' }}>
              Page <strong>{currentPageIndex + 1}</strong> of <strong>{pageCount}</strong>
            </Typography>
          </Box>
        )}
        {totalCount > 0 && (
          <Typography variant="body1" component="div" sx={{ textAlign: 'center', marginTop: '1rem' }}>
            Total rows: {totalCount}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default PreviewPane;
