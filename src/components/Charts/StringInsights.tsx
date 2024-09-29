import React, { useState } from 'react';
import switchIcon from '@/assets/icons/switch-chart.svg';
import { BarChart } from './BarChart';
import { Box } from '@mui/material';
import Image from 'next/image';
import RangeChart, { CharacterData } from './RangeChart';
import { DataProps, StatsChart } from './StatsChart';

type StringInsightsProps = {
  data: CharacterData[];
  statsData: DataProps;
};

export const StringInsights: React.FC<StringInsightsProps> = ({
  data,
  statsData,
}) => {
  const [chartType, setChartType] = useState<'chart' | 'bars' | 'stats'>(
    'chart'
  );

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        minHeight: '110px',
      }}
    >
      {chartType === 'chart' && <RangeChart data={data} />}

      {chartType === 'bars' && (
        <BarChart
          data={data.map((bar) => ({
            label: bar.name,
            value: bar.count,
            barTopLabel: `${bar.count} | ${bar.percentage}%`,
          }))}
        />
      )}

      {chartType === 'stats' &&
        (statsData.minimum === statsData.maximum ? (
          <Box width={700}>
            All entries in this column are identical in length
          </Box>
        ) : (
          <Box>
            <StatsChart data={statsData} />
            <Box
              sx={{
                fontSize: '11px',
                color: '#768292',
                fontWeight: 600,
                ml: 2,
              }}
            >
              String length distribution
            </Box>
          </Box>
        ))}
      <Box sx={{ marginLeft: '20px' }}>
        <Image
          style={{ cursor: 'pointer' }}
          src={switchIcon}
          onClick={() =>
            setChartType(
              chartType === 'chart'
                ? 'bars'
                : chartType === 'bars'
                  ? 'stats'
                  : 'chart'
            )
          }
          alt="switch icon"
        />
      </Box>
    </Box>
  );
};
