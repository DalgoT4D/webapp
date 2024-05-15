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
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { httpGet } from '@/helpers/http';
import { DbtSourceModel } from '../Canvas';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import useSWR from 'swr';
import { StatsChart } from '@/components/Charts/StatsChart';
import { RangeChart } from '@/components/Charts/RangeChart';
import { BarChart } from '@/components/Charts/BarChart';

export const StatisticsPane = ({ height }) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();

  //   const { data } = useSWR(`api for rows and columns count`);
  const countData = {
    rowsCount: 100,
    columnsCount: 7,
  };
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const { previewAction } = usePreviewAction();

  const columns = [
    { accessorKey: 'name', header: 'Column name' },
    { accessorKey: 'type', header: 'Column type' },
    { accessorKey: 'distinct', header: 'Distinct' },
    { accessorKey: 'null', header: 'Null' },
    {
      accessorKey: 'distribution',
      header: 'Data distribution',
      cell: ({ row }) => {
        const { type } = row.original;
        switch (type) {
          case 'Integer':
            return (
              <StatsChart
                data={{ min: 2, max: 300, mean: 34, median: 65, mode: 103 }}
              />
            );
          case 'String':
            return (
              <RangeChart
                data={[
                  { name: 'Character E', percentage: 20, count: 1201 },
                  { name: 'Character D', percentage: 16, count: 800 },
                  { name: 'Character C', percentage: 12, count: 600 },
                  { name: 'Character B', percentage: 8, count: 350 },
                  { name: 'Character A', percentage: 4, count: 200 },
                  { name: 'Others', percentage: 48, count: 2152 },
                ]}
              />
            );

          case 'Boolean':
            return (
              <RangeChart
                data={[
                  { name: 'True', percentage: 40, count: 1201 },
                  { name: 'False', percentage: 60, count: 2400 },
                ]}
                colors={['#00897b', '#c7d8d7']}
                barHeight={12}
              />
            );

          case 'Timestamp':
            return (
              <BarChart
                data={[
                  { label: 'Others', value: 48 },
                  { label: 'Jan 23', value: 16 },
                  { label: 'Feb 23', value: 26 },
                  { label: 'March 23', value: 46 },
                  { label: 'April 23', value: 16 },
                ]}
              />
            );
          default:
            return <div>---No data available---</div>;
        }
      },
    },
  ];

  // Row Data: The data to be displayed.
  const [data, setData] = useState<any[]>([]);

  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)

  const fetchColumns = async (schema: string, table: string) => {
    try {
      const dataUrl = `warehouse/table_data`;

      //   const tableData = httpGet(session, dataUrl);
      const tableData = {
        data: [
          { name: 'Date', type: 'Timestamp', distinct: 300, null: 23 },
          {
            name: 'Age',
            type: 'Integer',
            distinct: 200,
            null: 3,
          },
          { name: 'Message', type: 'String', distinct: 334, null: 1 },
          { name: 'IsAdmin', type: 'Boolean', distinct: 23, null: 4 },
          { name: 'result', type: 'JSON', distinct: 23, null: 4 },
        ],
      };

      setData(tableData.data);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };
  useEffect(() => {
    if (previewAction.type === 'preview') {
      setModelToPreview(previewAction.data);
    } else if (previewAction.type === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [previewAction]);

  useEffect(() => {
    if (modelToPreview) {
      fetchColumns(modelToPreview.schema, modelToPreview.input_name);
    }
  }, [modelToPreview]);

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
  }, [data]);

  // Update useTable hook
  const { getHeaderGroups, getRowModel } = useReactTable({
    columns: columns,
    data: tableData.data,
    manualPagination: true,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return modelToPreview ? (
    <Box>
      <Box
        sx={{
          alignItems: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="body1" fontWeight="bold" padding="10px">
            {modelToPreview?.input_name}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              ml: '56px',
              fontWeight: 600,
            }}
          >
            <Box
              sx={{
                color: '#00897b',
                display: 'flex',
                alignItems: 'center',
                fontWeight: 700,
                mr: 2,
              }}
            >
              <VisibilityIcon sx={{ mr: 1 }} /> {countData.columnsCount} Columns{' '}
            </Box>
            {countData.rowsCount} Rows
          </Box>

          <Box
            sx={{
              ml: 'auto',
              mr: 2,
              color: '#00897b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Button variant="contained" sx={{ mr: 2 }}>
              Generate
            </Button>
            <DownloadIcon sx={{ cursor: 'pointer' }} />
          </Box>
        </Box>
      </Box>
      <Box>
        <Box sx={{ height: height-50, overflow: 'auto' }}>
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
              {getRowModel().rows.map((row) => {
                return (
                  <TableRow
                    key={row.id}
                    sx={{
                      boxShadow: 'unset',
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        sx={{
                          fontWeight: 600,
                          textAlign: 'left',
                          borderBottom: '1px solid #ddd',
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
      </Box>
    </Box>
  ) : null;
};
