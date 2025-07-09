"use client";

import React, { useRef, useEffect } from 'react';
import type { EChartsOption } from 'echarts';
import EChartsReact from 'echarts-for-react';
import type { ChartData } from '@/hooks/api/useChart';

interface EChartsComponentProps {
  data: ChartData;
  customOptions?: EChartsOption;
}

export default function EChartsComponent({ 
  data,
  customOptions = {}
}: EChartsComponentProps) {
  // Merge backend config with any custom options
  const options = (() => ({
    ...data.chart_config,
    ...customOptions
  }))();

  return (
    <div style={{ width: '100%', height: '400px' }}>
      {/* @ts-expect-error - Known type issue with echarts-for-react */}
      <EChartsReact
        option={options}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'svg' }}
        notMerge={true}
        lazyUpdate={false}
      />
    </div>
  );
} 