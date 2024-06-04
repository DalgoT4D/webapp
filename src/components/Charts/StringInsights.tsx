import React, { useState } from 'react';
import switchIcon from '@/assets/icons/switch-chart.svg';
import { BarChart } from './BarChart';
import { Box } from '@mui/material';
import Image from 'next/image';
import RangeChart, { CharacterData } from './RangeChart';

type StringInsightsProps = {
  data: CharacterData[];
};

export const StringInsights: React.FC<StringInsightsProps> = ({ data }) => {
  const [chartType, setChartType] = useState<'chart' | 'numbers'>('chart');

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '110px',
      }}
    >
      {chartType === 'chart' ? (
        <RangeChart data={data} />
      ) : (
        <BarChart
          data={data.map((bar) => ({
            label: bar.name,
            value: bar.count,
            barTopLabel: `${bar.count} | ${bar.percentage}%`,
          }))}
        />
      )}
      <Box sx={{ marginLeft: '20px' }}>
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
