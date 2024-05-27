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
  Skeleton,
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
import { httpGet, httpPost } from '@/helpers/http';
import { DbtSourceModel } from '../Canvas';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import useSWR from 'swr';
import { StatsChart } from '@/components/Charts/StatsChart';
import { RangeChart } from '@/components/Charts/RangeChart';
import { BarChart } from '@/components/Charts/BarChart';
import { delay } from '@/utils/common';

export const StatisticsPane = ({ height }) => {
  const globalContext = useContext(GlobalContext);
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
        const { type, distribution } = row.original;
        console.log(row.original);
        switch (type) {
          case 'Numeric':
            return distribution ? (
              <StatsChart
                data={{
                  min: distribution.minVal,
                  max: distribution.maxVal,
                  mean: distribution.mean,
                  median: distribution.median,
                  mode: distribution.mode,
                }}
              />
            ) : (
              <Skeleton variant="rectangular" height={100} />
            );
          case 'String':
            const chartData = distribution.charts[0].data;
            const sum = chartData.reduce((acc, curr) => acc + curr.count, 0);
            console.log(sum);
            return (
              <RangeChart
                data={chartData.map((data) => ({
                  name: data.category,
                  percentage: ((data.count * 100) / sum).toFixed(1),
                  count: data.count,
                }))}
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

  const pollTaskStatus = async (
    session,
    taskId,
    colName,
    setData,
    interval = 5000
  ) => {
    const orgSlug = globalContext?.CurrentOrg.state.slug;
    const hashKey = `data-insights`;
    const taskUrl = `tasks/${taskId}?hashkey=${hashKey}`;

    const poll = async (resolve, reject) => {
      try {
        const response = await httpGet(session, taskUrl);
        const latestProgress = response.progress[response.progress.length - 1];
        if (latestProgress.status === 'completed') {
          const result = latestProgress.results;
          setData((data) =>
            data.map((dat) => {
              if (dat.name === colName) {
                return {
                  ...dat,
                  null: result.countNull,
                  distinct: result.countDistinct,
                  distribution: result,
                };
              }
              return dat;
            })
          );
          resolve({ ...latestProgress.results, colName: colName });
        } else if (latestProgress.status === 'failed') {
          reject(new Error('Task failed'));
        } else {
          setTimeout(() => poll(resolve, reject), interval);
        }
      } catch (error) {
        reject(error);
      }
    };

    return new Promise(poll);
  };

  const fetchColumns = async (schema: string, table: string) => {
    try {
      const dataUrl = `warehouse/v1/table_data/${schema}/${table}`;
      const metrics = `warehouse/insights/metrics/`;

      const tableData1 = await httpGet(session, dataUrl);
      console.log(tableData1);

      // tableData1.forEach(async (column) => {
      //   const tableData2 = await httpPost(session, metrics, {
      //     db_schema: schema,
      //     db_table: table,
      //     column_name: column.name,
      //   });
      //   console.log(tableData2);
      // });

      const tasks = tableData1.map(async (column) => {
        const tableData2 = await httpPost(session, metrics, {
          db_schema: schema,
          db_table: table,
          column_name: column.name,
        });
        console.log(tableData2);

        await delay(1000);

        return pollTaskStatus(
          session,
          tableData2.task_id,
          column.name,
          setData
        );
      });

      // const tableData = {
      //   data: [
      //     { name: 'Date', type: 'Timestamp', distinct: 300, null: 23 },
      //     {
      //       name: 'Age',
      //       type: 'Integer',
      //       distinct: 200,
      //       null: 3,
      //     },
      //     { name: 'Message', type: 'String', distinct: 334, null: 1 },
      //     { name: 'IsAdmin', type: 'Boolean', distinct: 23, null: 4 },
      //     { name: 'result', type: 'JSON', distinct: 23, null: 4 },
      //   ],
      // };

      const tableData = tableData1.map((data) => ({
        name: data.name,
        type: data.translated_type,
      }));

      setData(tableData);

      const results = await Promise.all(tasks);

      // const resultMap = results.reduce((prev, curr, index) => {}, {});

      console.log(results);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  console.log(data);
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
        <Box sx={{ height: height - 50, overflow: 'auto' }}>
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
                    {row.getVisibleCells().map((cell) => {
                      console.log(cell.getValue());
                      return (
                        <TableCell
                          key={cell.id}
                          sx={{
                            fontWeight: 600,
                            textAlign: 'left',
                            borderBottom: '1px solid #ddd',
                            fontSize: '0.8rem',
                          }}
                        >
                          {cell.getValue() !== undefined ? (
                            flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )
                          ) : (
                            <Skeleton variant="rectangular" height={118} />
                          )}
                        </TableCell>
                      );
                    })}
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
