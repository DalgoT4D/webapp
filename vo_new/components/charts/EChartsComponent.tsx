"use client";

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface EChartsComponentProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartName: string;
  chartDescription?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function EChartsComponent({ 
  data, 
  chartName, 
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis'
}: EChartsComponentProps) {
  // Validate data before transforming
  if (!data || !data['x-axis'] || !data['y-axis']) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] h-96 bg-background rounded-lg border p-4 flex items-center justify-center">
          <div className="text-muted-foreground">No data available for chart</div>
        </div>
      </div>
    );
  }

  // Transform the backend data format to ECharts format
  const chartData = data['x-axis'].map((xValue, index) => ({
    name: xValue,
    value: data['y-axis'][index] || 0
  }));

  const option = {
    title: {
      text: chartName,
      subtext: chartDescription,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    xAxis: {
      type: 'category',
      data: data['x-axis'],
      name: xAxisLabel,
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: yAxisLabel,
      nameLocation: 'middle',
      nameGap: 40
    },
    series: [
      {
        name: yAxisLabel,
        type: 'bar',
        data: data['y-axis'],
        itemStyle: {
          color: '#6366f1'
        },
        barWidth: '60%'
      }
    ],
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%',
      top: '20%'
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] h-96 bg-background rounded-lg border p-4">
        <ReactECharts 
          option={option} 
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
} 