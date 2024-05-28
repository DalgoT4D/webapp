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
  CircularProgress,
} from '@mui/material';
import { useSession } from 'next-auth/react';
import { GlobalContext } from '@/contexts/ContextProvider';
import { errorToast } from '@/components/ToastMessage/ToastHelper';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { httpGet, httpPost } from '@/helpers/http';
import { DbtSourceModel } from '../Canvas';
import { usePreviewAction } from '@/contexts/FlowEditorPreviewContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
// import DownloadIcon from '@mui/icons-material/Download';
import { StatsChart } from '@/components/Charts/StatsChart';
import { RangeChart } from '@/components/Charts/RangeChart';
import { BarChart } from '@/components/Charts/BarChart';
import { delay } from '@/utils/common';
import { Session } from 'next-auth';

interface StatisticsPaneProps {
  height: number;
}

interface ColumnData {
  name: string;
  type: 'Numeric' | 'String' | 'Datetime' | 'JSON' | 'Boolean';
  distinct?: number;
  null?: number;
  distribution?: any;
}

interface TableDetailsResponse {
  name: string;
  translated_type: 'Numeric' | 'String' | 'Datetime' | 'JSON' | 'Boolean';
}

export const StatisticsPane: React.FC<StatisticsPaneProps> = ({ height }) => {
  const globalContext = useContext(GlobalContext);
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();

  const [rowCount, setRowCount] = useState(0);
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const { previewAction } = usePreviewAction();

  const columns: ColumnDef<ColumnData, any>[] = [
    { accessorKey: 'name', header: 'Column name', size: 150 },
    { accessorKey: 'type', header: 'Column type', size: 100 },
    { accessorKey: 'distinct', header: 'Distinct', size: 100 },
    { accessorKey: 'null', header: 'Null', size: 100 },
    {
      accessorKey: 'distribution',
      header: 'Data distribution',
      size: 700,
      cell: ({ row }) => {
        const { type, distribution } = row.original;
        switch (type) {
          case 'Numeric':
            return distribution ? (
              <StatsChart
                type="chart"
                data={{
                  minimum: distribution.minVal,
                  maximum: distribution.maxVal,
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

          case 'Datetime':
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
  const [data, setData] = useState<ColumnData[]>([]);

  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)

  const pollTaskStatus = async (
    session: Session | null,
    taskId: string,
    colName: string,
    setData: any,
    interval = 5000
  ) => {
    // const orgSlug = globalContext?.CurrentOrg.state.slug;
    const hashKey = `data-insights`;
    const taskUrl = `tasks/${taskId}?hashkey=${hashKey}`;

    const poll = async (
      resolve: (value?: unknown) => void,
      reject: (reason?: any) => void
    ) => {
      try {
        const response = await httpGet(session, taskUrl);
        const latestProgress = response.progress[response.progress.length - 1];
        if (latestProgress.status === 'completed') {
          const result = latestProgress.results;
          setData((columnData: ColumnData[]) =>
            columnData.map((data) => {
              if (data.name === colName) {
                return {
                  ...data,
                  null: result.countNull,
                  distinct: result.countDistinct,
                  distribution: result,
                };
              }
              return data;
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
      const metricsApiUrl = `warehouse/insights/metrics/`;

      const tableDetails: TableDetailsResponse[] = await httpGet(
        session,
        dataUrl
      );

      tableDetails.forEach(async (column) => {
        const metrics: { task_id: string } = await httpPost(
          session,
          metricsApiUrl,
          {
            db_schema: schema,
            db_table: table,
            column_name: column.name,
          }
        );

        await delay(1000);

        pollTaskStatus(session, metrics.task_id, column.name, setData);
      });

      const tableData = tableDetails.map((data) => ({
        name: data.name,
        type: data.translated_type,
      }));

      setData(tableData);

      // const results = await Promise.all(tasks);
      // console.log(results);
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  const fetchRowCount = async (schema: string, table: string) => {
    const count = await httpGet(
      session,
      `warehouse/table_count/${schema}/${table}`
    );
    setRowCount(count.total_rows);
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
      fetchRowCount(modelToPreview.schema, modelToPreview.input_name);
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
    data.length > 0 ? (
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
              {data.length > 0 && (
                <Box
                  sx={{
                    color: '#00897b',
                    display: 'flex',
                    alignItems: 'center',
                    fontWeight: 700,
                    mr: 2,
                  }}
                >
                  <VisibilityIcon sx={{ mr: 1 }} /> {data.length} Columns{' '}
                </Box>
              )}
              {rowCount} Rows
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
              <Button
                variant="contained"
                sx={{ mr: 2 }}
                onClick={() =>
                  fetchColumns(modelToPreview.schema, modelToPreview.input_name)
                }
              >
                Refresh
              </Button>
              {/* <DownloadIcon sx={{ cursor: 'pointer' }} /> */}
            </Box>
          </Box>
        </Box>
        <Box>
          <Box sx={{ height: height - 50, overflow: 'auto' }}>
            <Table stickyHeader sx={{ width: '100%', borderSpacing: 0 }}>
              <TableHead>
                {getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableCell
                        key={header.id}
                        colSpan={header.colSpan}
                        sx={{
                          width: header.column.columnDef.size,
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
                              width: cell.column.columnDef.size,
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
    ) : (
      <CircularProgress />
    )
  ) : null;
};
