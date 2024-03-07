import React, { useContext, useEffect, useMemo, useState } from 'react';
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

const PreviewPane = ({}: PreviewPaneProps) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const flowEditorContext = useContext(FlowEditorContext);

  // Column Definitions: Defines & controls grid columns.
  const [columns, setColumns] = useState<any[]>([]);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0); // Total count of rows
  const [pageCount, setPageCount] = useState(0); // Total number of pages
  const [remainingData, setRemainingData] = useState<any[]>([]); // Remaining data for pagination
  const [pageIndex, setPageIndex] = useState(0); // Page index

  useEffect(() => {
    if (flowEditorContext?.previewNode.state.action === 'preview') {
      setModelToPreview(flowEditorContext?.previewNode.state.node);
    } else if (flowEditorContext?.previewNode.state.action === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [flowEditorContext?.previewNode.state]);

  useEffect(() => {
    if (modelToPreview) {
      const page = 0; // Set the initial page
      const limit = 10; // Set the limit per page
      fetchColumnsAndRows(modelToPreview.schema, modelToPreview.input_name, page, limit);
    }
  }, [modelToPreview]);

  const fetchColumnsAndRows = async (schema: string, table: string, page: number, limit: number) => {
    try {
      const columnSpec = await httpGet(session, `warehouse/table_columns/${schema}/${table}`);
      const rows = await httpGet(session, `warehouse/table_data/${schema}/${table}?page=${page}&limit=${limit}`);
      const count = await httpGet(session, `warehouse/table_count/${schema}/${table}`);
      setTotalCount(count.total_rows); // Update total count of rows
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

  const tableData = useMemo(() => {
    return {
      columns,
      data
    };
  }, [columns, data]);

  const handleNextPage = async () => {
    if (remainingData.length > 0) {
      const nextPageData = remainingData.slice(0, pageSize);
      const newRemainingData = remainingData.slice(pageSize);
      setData(nextPageData);
      setRemainingData(newRemainingData);
      setPageIndex((pageIndex) => pageIndex + 1);
    } else {
      const nextPageIndex = pageIndex + 1;
      try {
        const nextPageData = await httpGet(
          session,
          `warehouse/table_data/${modelToPreview.schema}/${modelToPreview.input_name}?page=${nextPageIndex}&limit=${pageSize * 2}`
        );
        console.log('Next page data:', nextPageData);
        const currentPageData = nextPageData.slice(0, pageSize);
        const remainingRows = nextPageData.slice(pageSize);
        setData(currentPageData);
        setRemainingData(remainingRows);
        setPageIndex(nextPageIndex);
      } catch (error: any) {
        errorToast(error.message, [], toastContext);
      }
    }
  };

  const handlePreviousPage = async () => {
    if (pageIndex > 1) { // Check if pageIndex is greater than 1
      const previousPageIndex = pageIndex - 1;
      try {
        const previousPageData = await httpGet(
          session,
          `warehouse/table_data/${modelToPreview.schema}/${modelToPreview.input_name}?page=${previousPageIndex}&limit=${pageSize}`
        );
        setData(previousPageData);
        setPageIndex(previousPageIndex);
      } catch (error) {
        errorToast(error.message, [], toastContext);
      }
    }
  }

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    page,
    nextPage,
    previousPage,
    canNextPage,
    canPreviousPage
  } = useTable(
    {
      columns: tableData.columns,
      data: tableData.data,
      manualPagination: true,
      pageCount: pageCount
    },
    useSortBy,
    usePagination
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" fontWeight="bold" padding="10px" color="grey">{modelToPreview?.input_name}</Typography>
      </Box>
      <Box sx={{ width: '100%', marginTop: '0', overflowX: 'auto', position: 'relative' }}>
        <Table {...getTableProps()} sx={{ borderCollapse: 'collapse', width: '100%' }}>
          <TableHead>
            {headerGroups.map((headerGroup: any) => (
              <TableRow {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column: any) => (
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
                      <Typography>{column.render('Header')}</Typography>
                      <TableSortLabel
                        active={true}
                        direction={column.isSortedDesc ? 'desc' : 'asc'}
                        sx={{ marginLeft: '4px' }}
                      />
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody {...getTableBodyProps()} sx={{ borderColor: '#dddddd' }}>
            {page.map((row: any) => {
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
              <Button onClick={handlePreviousPage} disabled={pageIndex === 0}>
                Previous
              </Button>
              <Button onClick={handleNextPage} disabled={!canNextPage}>
                Next
              </Button>
            </ButtonGroup>
            <Typography variant="body1" component="span" sx={{ marginLeft: '1rem' }}>
              Page <strong>{pageIndex + 1}</strong> of <strong>{pageCount}</strong>
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
