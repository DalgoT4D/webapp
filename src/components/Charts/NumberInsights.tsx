import React, { useState } from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';
import switchIcon from '@/assets/icons/switch-chart.svg';
import { DataProps, StatsChart } from './StatsChart';

interface NumberInsightsProps {
  data: DataProps;
  type: 'chart' | 'numbers';
}

export const NumberInsights: React.FC<NumberInsightsProps> = ({
  data,
  type,
}) => {
  const [chartType, setChartType] = useState(type);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '110px',
      }}
    >
      {chartType === 'chart' ? (
        <StatsChart data={data}></StatsChart>
      ) : (
        <Box sx={{ minWidth: '700px', display: 'flex', alignItems: 'center' }}>
          {(Object.keys(data) as Array<keyof DataProps>).map((key) => (
            <Box key={key} sx={{ mr: '50px' }}>
              <Box sx={{ color: 'rgba(15, 36, 64, 0.57)' }}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Box>
              <Box
                sx={{
                  mt: 1,
                  width: '84px',
                  background: '#F5FAFA',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ ml: 1 }}>
                  {Math.trunc(data[key]).toLocaleString()}
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
      <Image
        style={{ marginLeft: '20px', cursor: 'pointer' }}
        src={switchIcon}
        onClick={() =>
          setChartType(chartType === 'chart' ? 'numbers' : 'chart')
        }
        alt="switch icon"
      />
    </Box>
  );
};
