"use client";

import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, LineChart, PieChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';

// Register necessary ECharts components
echarts.use([
  BarChart,
  LineChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  CanvasRenderer
]);

export interface MiniChartProps {
  config: any; // ECharts configuration object
  chartType: string;
  className?: string;
}

export default function MiniChart({ config, chartType, className = "w-full h-full" }: MiniChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    // Initialize chart
    if (chartRef.current) {
      if (!chartInstance.current) {
        chartInstance.current = echarts.init(chartRef.current);
      }
      
      // Set chart option
      const option = generateMiniOption();
      chartInstance.current.setOption(option, true); // Use true to clear previous options
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, [config, chartType]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstance.current) {
        chartInstance.current.resize();
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const generateMiniOption = () => {
    if (!config) return {};

    const baseOption = {
      backgroundColor: 'transparent',
      animation: false,
      grid: {
        left: 15,
        right: 15,
        top: 15,
        bottom: 15,
        containLabel: false
      },
      tooltip: { show: false },
      legend: { show: false },
      title: { show: false }
    };

    // Merge baseOption with the provided config
    return {
      ...baseOption,
      ...config,
      // Override specific options for thumbnail view
      xAxis: {
        ...config.xAxis,
        show: false
      },
      yAxis: {
        ...config.yAxis,
        show: false
      },
      series: config.series.map((series: any) => ({
        ...series,
        // Customize series options for thumbnail
        label: { show: false },
        emphasis: { scale: false }
      }))
    };
  };

  return (
    <div ref={chartRef} className={className} />
  );
} 