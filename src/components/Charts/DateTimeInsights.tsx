import React, { useState } from 'react';
import switchIcon from '@/assets/icons/switch-chart.svg';
import switchFilter from '@/assets/icons/switch-filter.svg';
import { BarChart } from './BarChart';
import { Box, Skeleton, SxProps } from '@mui/material';
import Image from 'next/image';
import moment from 'moment';
import { httpGet, httpPost } from '@/helpers/http';
import { useSession } from 'next-auth/react';
import { delay } from '@/utils/common';
import { Session } from 'next-auth';
import ArrowLeftIcon from '@mui/icons-material/ArrowLeft';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { DateTimeFilter } from '../TransformWorkflow/FlowEditor/Components/LowerSectionTabs/StatisticsPane';

type DateTimeInsightsProps = {
  minDate: string;
  maxDate: string;
  barProps: any;
  type: 'chart' | 'numbers';
  postBody: any;
};

const formatDate = (obj: any, returnType: 'year' | 'month' | 'day') => {
  const { year, month, day } = obj;

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

const arrowStyles: SxProps = {
  width: '16px',
  mt: 3,
  height: '80px',
  background: '#F5FAFA',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  ':hover': {
    background: '#c8d3d3',
  },
};

const pollTaskStatus = async (session: Session | null, taskId: string, interval = 5000) => {
  // const orgSlug = globalContext?.CurrentOrg.state.slug;
  const hashKey = `data-insights`;
  const taskUrl = `tasks/${taskId}?hashkey=${hashKey}`;

  const poll = async (resolve: (value?: unknown) => void, reject: (reason?: any) => void) => {
    try {
      const response = await httpGet(session, taskUrl);
      const latestProgress = response.progress[response.progress.length - 1];
      if (latestProgress.status === 'completed') {
        resolve(latestProgress.results);
      } else if (latestProgress.status === 'failed' || latestProgress.status === 'error') {
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
  const [newData, setNewData] = useState<'available' | 'loading' | 'unavailable'>('available');

  const [barChartData, setBarChartData] = useState(
    barProps.data.map((data: any) => ({
      label: formatDate(data, 'year'),
      value: data.frequency,
    }))
  );

  const [filter, setFilter] = useState<DateTimeFilter>({
    range: 'year',
    limit: 10,
    offset: 0,
  });

  const updateOffset = async (type: 'increase' | 'decrease') => {
    let newOffset = type === 'increase' ? filter.offset + 10 : filter.offset - 10;

    if (newOffset < 0) newOffset = 0;

    const newFilter: DateTimeFilter = {
      ...filter,
      offset: newOffset,
    };
    await updateFilter(newFilter);
  };

  const updateRange = async () => {
    const rangeMap: any = {
      year: 'month',
      month: 'day',
      day: 'year',
    };

    const newFilter: DateTimeFilter = {
      ...filter,
      range: rangeMap[filter.range],
      offset: 0,
    };
    await updateFilter(newFilter);
  };

  const updateFilter = async (newFilter: DateTimeFilter) => {
    setNewData('loading');
    setFilter(newFilter);

    const metricsApiUrl = `warehouse/insights/metrics/`;

    const metrics: { task_id: string } = await httpPost(session, metricsApiUrl, {
      ...postBody,
      filter: newFilter,
      refresh: true,
    });

    await delay(1000);

    const tasks: any = await pollTaskStatus(session, metrics.task_id);
    const responseData = tasks.charts[0].data;

    if (responseData.length === 0) {
      setNewData('unavailable');
    } else {
      setNewData('available');
    }
    setBarChartData(
      responseData.map((data: any) => ({
        label: formatDate(data, newFilter.range),
        value: data.frequency,
      }))
    );
  };
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '110px',
      }}
      role="outerbox"
    >
      {chartType === 'chart' ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {filter.offset > 0 && (
            <Box
              sx={arrowStyles}
              onClick={() => {
                updateOffset('decrease');
              }}
            >
              <ArrowLeftIcon />
            </Box>
          )}
          <Box sx={{ position: 'relative', mt: 5 }}>
            {newData === 'loading' && <Skeleton height={100} width={700} />}
            {newData === 'available' && <BarChart data={barChartData} />}
            {newData === 'unavailable' && (
              <Box sx={{ width: 700, textAlign: 'center' }}>No Data available</Box>
            )}
            <Box
              sx={{
                right: 20,
                top: -50,
                position: 'absolute',
              }}
            >
              {filter.range}
              <Image
                style={{
                  cursor: 'pointer',
                  display: 'block',

                  marginLeft: 'auto',
                }}
                src={switchFilter}
                onClick={() => {
                  updateRange();
                }}
                alt="switch icon"
              />
            </Box>
          </Box>
          {barChartData.length === 10 && (
            <Box
              sx={arrowStyles}
              onClick={() => {
                updateOffset('increase');
              }}
            >
              <ArrowRightIcon />
            </Box>
          )}
        </Box>
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
              <Box sx={{ ml: 1 }}> {moment(minDate).format('ddd, Do MMMM, YYYY')}</Box>
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
              <Box sx={{ ml: 1 }}>{moment(maxDate).format('ddd, Do MMMM, YYYY')}</Box>
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
              <Box sx={{ ml: 1 }}> {moment(maxDate).diff(moment(minDate), 'days')}</Box>
            </Box>
          </Box>
        </Box>
      )}
      <Box sx={{ marginLeft: '20px' }}>
        <Image
          style={{ cursor: 'pointer' }}
          src={switchIcon}
          onClick={() => setChartType(chartType === 'chart' ? 'numbers' : 'chart')}
          alt="switch icon"
        />
      </Box>
    </Box>
  );
};
