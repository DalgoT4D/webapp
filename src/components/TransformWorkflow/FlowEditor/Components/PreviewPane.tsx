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

const PreviewPane = ({}: PreviewPaneProps) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const flowEditorContext = useContext(FlowEditorContext);

  // Column Definitions: Defines & controls grid columns.
  const [columns, setColumns] = useState<any[]>([]);

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (flowEditorContext?.previewNode.state.action === 'preview') {
      setModelToPreview(flowEditorContext?.previewNode.state.node);
    } else if (flowEditorContext?.previewNode.state.action === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [flowEditorContext?.previewNode.state]);

  const fetchColumnsAndRows = async (schema: string, table: string, offset: number) => {
    try {
      const columnSpec = await httpGet(session, `warehouse/table_columns/${schema}/${table}`);
      const rows = await httpGet(session, `warehouse/table_data/${schema}/${table}?limit=10&offset=${offset}`);
      setColumns(
        columnSpec.map((col: { name: string; data_type: string }) => ({
          Header: col.name,
          accessor: col.name,
          autoHeight: true,
        }))
      );
      setData(rows);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };
  
  useEffect(() => {
    setData([]);
    if (modelToPreview) {
      fetchColumnsAndRows(modelToPreview.schema, modelToPreview.input_name, 0);
    }
  }, [modelToPreview]);

  const tableData = useMemo(() => {
    return {
      columns,
      data
    };
  }, [columns, data]);

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
    pageOptions,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns: tableData.columns,
      data: tableData.data,
      initialState: { pageIndex: 0, pageSize: 5 }
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
                        active={true} // Always set to true
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
                      sx={{ border: '1px solid #dddddd', padding: '4px', textAlign: 'left', fontSize: '0.8rem' }} // Adjusting cell padding and font size
                    >
                      {cell.column.id === '_airbyte_data' ? cell.render('Cell')._airbyte_data : cell.render('Cell')}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {/* Pagination controls */}
        {data.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
            <ButtonGroup variant="outlined" color="primary" aria-label="pagination">
              <Button onClick={() => previousPage()} disabled={pageIndex === 0}>
                Previous
              </Button>
              <Button onClick={() => nextPage()} disabled={!canNextPage}>
                Next
              </Button>
            </ButtonGroup>
            <Typography variant="body1" component="span" sx={{ marginLeft: '1rem' }}>
              Page <strong>{pageIndex + 1}</strong> of <strong>{pageOptions.length}</strong>
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PreviewPane;
