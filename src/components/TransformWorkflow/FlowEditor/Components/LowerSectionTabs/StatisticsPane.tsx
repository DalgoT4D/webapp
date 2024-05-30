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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { StatsChart } from '@/components/Charts/StatsChart';
import { RangeChart } from '@/components/Charts/RangeChart';
import { delay } from '@/utils/common';
import { Session } from 'next-auth';
import { DateTimeInsights } from '@/components/Charts/DateTimeInsights';

interface StatisticsPaneProps {
  height: number;
}

export interface DateTimeFilter {
  range: 'year' | 'month' | 'day';
  limit: number;
  offset: number;
}
interface PostBody {
  db_schema: string;
  db_table: string;
  column_name: string;
  filter?: DateTimeFilter;
}

type ColumnTypes = 'Numeric' | 'String' | 'Datetime' | 'Json' | 'Boolean';

interface ColumnData {
  name: string;
  type: ColumnTypes;
  distinct?: number | string;
  null?: number | string;
  distribution?: any;
  postBody?: PostBody;
}

interface TableDetailsResponse {
  name: string;
  translated_type: ColumnTypes;
}

const metricsApiUrl = `warehouse/insights/metrics/`;

const pollTaskStatus = async (
  session: Session | null,
  taskId: string,
  postBody: PostBody,
  setData: any,
  interval = 5000
) => {
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
            if (data.name === postBody.column_name) {
              return {
                ...data,
                null: result.countNull,
                distinct: result.countDistinct,
                distribution: result,
                postBody,
              };
            }
            return data;
          })
        );
        resolve(latestProgress.results);
      } else if (
        latestProgress.status === 'failed' ||
        latestProgress.status === 'error'
      ) {
        setData((columnData: ColumnData[]) =>
          columnData.map((data) => {
            if (data.name === postBody.column_name) {
              return {
                ...data,
                null: '',
                distinct: '',
                distribution: 'failed',
                postBody,
              };
            }
            return data;
          })
        );
        reject({ reason: 'Failed' });
      } else {
        setTimeout(() => poll(resolve, reject), interval);
      }
    } catch (error) {
      reject(error);
    }
  };

  return new Promise(poll);
};

export const StatisticsPane: React.FC<StatisticsPaneProps> = ({ height }) => {
  const [modelToPreview, setModelToPreview] = useState<DbtSourceModel | null>();

  const [rowCount, setRowCount] = useState(-1);
  const { data: session } = useSession();
  const toastContext = useContext(GlobalContext);
  const { previewAction } = usePreviewAction();
  // Row Data: The data to be displayed.
  const [data, setData] = useState<ColumnData[]>([]);

  const [sortedColumn, setSortedColumn] = useState<string | undefined>(); // Track sorted column
  const [sortOrder, setSortOrder] = useState(1); // Track sort order (1 for ascending, -1 for descending)

  const columns: ColumnDef<ColumnData, any>[] = [
    { accessorKey: 'name', header: 'Column name', size: 150 },
    { accessorKey: 'type', header: 'Column type', size: 150 },
    { accessorKey: 'distinct', header: 'Distinct', size: 100 },
    { accessorKey: 'null', header: 'Null', size: 100 },
    {
      accessorKey: 'distribution',
      header: 'Data distribution',
      size: 800,
      cell: ({ row }) => {
        const { type, distribution, postBody } = row.original;
        if (distribution === 'failed' && postBody !== undefined) {
          return (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: '#9d1313',
                minHeight: '100px',
              }}
            >
              <ErrorOutlineIcon sx={{ mr: 1 }} /> Error fetching stats{' '}
              <Button
                sx={{ ml: 2 }}
                variant="outlined"
                size="small"
                onClick={async () => {
                  const metrics: { task_id: string } = await httpPost(
                    session,
                    metricsApiUrl,
                    postBody
                  );

                  setData((columnData: ColumnData[]) =>
                    columnData.map((data) => {
                      if (data.name === postBody.column_name) {
                        return {
                          ...data,
                          null: undefined,
                          distinct: undefined,
                          distribution: undefined,
                          postBody,
                        };
                      }
                      return data;
                    })
                  );
                  await delay(1000);
                  pollTaskStatus(session, metrics.task_id, postBody, setData);
                }}
              >
                Try again
              </Button>
            </Box>
          );
        }
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
            return (
              <RangeChart
                data={chartData.map((data: any) => ({
                  name: data.category,
                  percentage: ((data.count * 100) / distribution.count).toFixed(
                    1
                  ),
                  count: data.count,
                }))}
              />
            );

          case 'Boolean':
            return (
              <RangeChart
                data={[
                  {
                    name: 'True',
                    percentage: (
                      (distribution.countTrue * 100) /
                      distribution.count
                    ).toFixed(1),
                    count: distribution.countTrue,
                  },
                  {
                    name: 'False',
                    percentage: (
                      (distribution.countFalse * 100) /
                      distribution.count
                    ).toFixed(1),
                    count: distribution.countFalse,
                  },
                ]}
                colors={['#00897b', '#c7d8d7']}
                barHeight={12}
              />
            );

          case 'Datetime':
            const dateTimeData = distribution.charts[0].data;
            return (
              <DateTimeInsights
                barProps={{
                  data: dateTimeData,
                }}
                minDate={distribution.minVal}
                maxDate={distribution.maxVal}
                type="chart"
                postBody={postBody}
              />
            );
          default:
            return (
              <Box sx={{ textAlign: 'center' }}>
                {' '}
                -- -- -- No data available -- -- --{' '}
              </Box>
            );
        }
      },
    },
  ];

  const fetchColumns = async (schema: string, table: string) => {
    try {
      const dataUrl = `warehouse/v1/table_data/${schema}/${table}`;

      const tableDetails: TableDetailsResponse[] = await httpGet(
        session,
        dataUrl
      );
      const tableData: ColumnData[] = tableDetails.map((data) => {
        if (data.translated_type === 'Json') {
          return {
            name: data.name,
            type: data.translated_type,
            null: '',
            distinct: '',
            distribution: '',
          };
        }
        return {
          name: data.name,
          type: data.translated_type,
        };
      });

      setData(tableData);

      tableDetails.forEach(async (column) => {
        if (
          !['Datetime', 'Json', 'Boolean', 'String', 'Numeric'].includes(
            column.translated_type
          )
        ) {
          return;
        }

        const postBody: PostBody = {
          db_schema: schema,
          db_table: table,
          column_name: column.name,
        };

        if (column.translated_type === 'Datetime') {
          postBody.filter = {
            range: 'year',
            limit: 10,
            offset: 0,
          };
        }

        const metrics: { task_id: string } = await httpPost(
          session,
          metricsApiUrl,
          postBody
        );

        await delay(1000);

        pollTaskStatus(session, metrics.task_id, postBody, setData);
      });
    } catch (error: any) {
      errorToast(error.message, [], toastContext);
    }
  };

  const fetchRowCountAndColumns = async (schema: string, table: string) => {
    const count = await httpGet(
      session,
      `warehouse/table_count/${schema}/${table}`
    );
    setRowCount(count.total_rows);

    if (count.total_rows > 0) {
      fetchColumns(schema, table);
    }
  };

  useEffect(() => {
    return () => {
      const highestId = window.setTimeout(() => {
        for (let i = highestId; i >= 0; i--) {
          window.clearInterval(i);
        }
      }, 0);
    };
  }, []);

  useEffect(() => {
    if (previewAction.type === 'preview') {
      setModelToPreview(previewAction.data);
    } else if (previewAction.type === 'clear-preview') {
      setModelToPreview(null);
    }
  }, [previewAction]);

  useEffect(() => {
    if (modelToPreview) {
      setData([]);
      fetchRowCountAndColumns(modelToPreview.schema, modelToPreview.input_name);
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
    rowCount !== 0 ? (
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
                {rowCount > 0 ? rowCount : 0} Rows
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
                    fetchColumns(
                      modelToPreview.schema,
                      modelToPreview.input_name
                    )
                  }
                >
                  Refresh
                </Button>
              </Box>
            </Box>
          </Box>
          <Box>
            <Box sx={{ height: height - 100, overflow: 'auto' }}>
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
                          height: '180px',
                        }}
                      >
                        {row.getVisibleCells().map((cell) => {
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
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: height,
          }}
        >
          <CircularProgress sx={{ mr: 2 }} />
          Generating insights
        </Box>
      )
    ) : (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: height,
        }}
      >
        No data (0 rows) available to generate insights
      </Box>
    )
  ) : null;
};
