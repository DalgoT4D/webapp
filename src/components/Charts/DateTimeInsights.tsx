import React, { useState } from 'react';
import switchIcon from '@/assets/icons/switch-chart.svg';
import switchFilter from '@/assets/icons/switch-filter.svg';
import { BarChart, BarChartData, BarChartProps } from './BarChart';
import { Box, Skeleton } from '@mui/material';
import Image from 'next/image';
import moment from 'moment';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { delay } from '@/utils/common';
import { Session } from 'next-auth';

type DateTimeInsightsProps = {
  minDate: string;
  maxDate: string;
  barProps: any;
  type: 'chart' | 'numbers';
  postBody: any;
};

const formatDate = (obj: any, returnType: 'year' | 'month' | 'day') => {
  const { year, month, day } = obj;
  console.log(obj);
  const date = moment({
    year,
    month: month ? month - 1 : 0,
    day: day ? day : 1,
  }); // month is zero-indexed in moment

  switch (returnType) {
    case 'year':
      return date.format('YYYY');
    case 'month':
      return date.format('MMM YYYY');
    case 'day':
      return date.format('D MMM YYYY');
    default:
      throw new Error('Invalid return type');
  }
};

const pollTaskStatus = async (
  session: Session | null,
  taskId: string,
  filter: any,
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
        console.log(result);
        setData(
          result.charts[0].data.map((data) => ({
            label: formatDate(data, filter.range),
            value: data.frequency,
          }))
        );
        resolve(latestProgress.results);
      } else if (
        latestProgress.status === 'failed' ||
        latestProgress.status === 'error'
      ) {
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

export const DateTimeInsights: React.FC<DateTimeInsightsProps> = ({
  barProps,
  type,
  minDate,
  maxDate,
  postBody,
}) => {
  const { data: session } = useSession();
  const [chartType, setChartType] = useState(type);

  const [barChartData, setBarChartData] = useState(
    barProps.data.map((data) => ({
      label: formatDate(data, 'year'),
      value: data.frequency,
    }))
  );

  const [filter, setFilter] = useState({
    range: 'year',
    limit: 10,
    offset: 0,
  });

  const updateFilter = async () => {
    const rangeMap: any = {
      year: 'month',
      month: 'day',
      day: 'year',
    };

    const newFilter = { ...filter, range: rangeMap[filter.range] };

    setFilter((filter) => ({ ...filter, range: rangeMap[filter.range] }));

    const metricsApiUrl = `warehouse/insights/metrics/`;

    const metrics: { task_id: string } = await httpPost(
      session,
      metricsApiUrl,
      {
        ...postBody,
        filter: newFilter,
        refresh: true,
      }
    );

    await delay(1000);

    pollTaskStatus(session, metrics.task_id, newFilter, setBarChartData);
  };
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '110px',
      }}
    >
      {chartType === 'chart' ? (
        barChartData.length > 0 ? (
          <BarChart data={barChartData} />
        ) : (
          <Skeleton height={100} width={700} />
        )
      ) : (
        <Box sx={{ minWidth: '700px', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: '30px' }}>
            <Box sx={{ color: 'rgba(15, 36, 64, 0.57)' }}>Minimum date</Box>
            <Box
              sx={{
                mt: 1,
                pr: 2,
                background: '#F5FAFA',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ ml: 1 }}>
                {' '}
                {moment(minDate).format('ddd, Do MMMM, YYYY')}
              </Box>
            </Box>
          </Box>
          <Box sx={{ pt: 3 }}>TO</Box>
          <Box sx={{ m: '0px 30px' }}>
            <Box sx={{ color: 'rgba(15, 36, 64, 0.57)' }}>Maximum date</Box>
            <Box
              sx={{
                mt: 1,
                pr: 2,
                background: '#F5FAFA',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ ml: 1 }}>
                {moment(maxDate).format('ddd, Do MMMM, YYYY')}
              </Box>
            </Box>
          </Box>
          <Box sx={{ m: '0px' }}>
            <Box sx={{ color: 'rgba(15, 36, 64, 0.57)' }}>Total days data</Box>
            <Box
              sx={{
                mt: 1,
                pr: 2,
                background: '#F5FAFA',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box sx={{ ml: 1 }}>
                {' '}
                {moment(maxDate).diff(moment(minDate), 'days')}
              </Box>
            </Box>
          </Box>
        </Box>
      )}
      <Box sx={{ marginLeft: '20px' }}>
        {chartType === 'chart' && (
          <Image
            style={{
              cursor: 'pointer',
              display: 'block',
              marginBottom: '10px',
            }}
            src={switchFilter}
            onClick={() => {
              setBarChartData([]);
              updateFilter();
            }}
            alt="switch icon"
          />
        )}
        <Image
          style={{ cursor: 'pointer' }}
          src={switchIcon}
          onClick={() =>
            setChartType(chartType === 'chart' ? 'numbers' : 'chart')
          }
          alt="switch icon"
        />
      </Box>
    </Box>
  );
};
