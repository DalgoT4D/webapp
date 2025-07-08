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

interface MiniChartProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartType: string;
  className?: string;
}

export default function MiniChart({ data, chartType, className = "w-full h-full" }: MiniChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    // Initialize chart
    if (chartRef.current) {
      chartInstance.current = echarts.init(chartRef.current);
      
      // Set chart option
      const option = generateMiniOption();
      chartInstance.current.setOption(option);
    }

    // Cleanup on unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
    };
  }, [data, chartType]);

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
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
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

    switch (chartType) {
      case 'bar':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: data['x-axis'],
            show: false
          },
          yAxis: {
            type: 'value',
            show: false
          },
          series: [{
            type: 'bar',
            data: data['y-axis'],
            itemStyle: { color: colors[0] },
            barWidth: '70%'
          }]
        };

      case 'line':
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: data['x-axis'],
            show: false
          },
          yAxis: {
            type: 'value',
            show: false
          },
          series: [{
            type: 'line',
            data: data['y-axis'],
            smooth: true,
            symbol: 'circle',
            symbolSize: 3,
            lineStyle: { color: colors[1], width: 2 },
            itemStyle: { color: colors[1] }
          }]
        };

      case 'pie':
        // Transform data for pie chart
        const pieData = data['x-axis'].map((label, index) => ({
          name: String(label),
          value: Number(data['y-axis'][index]) || 0
        }));
        
        return {
          ...baseOption,
          series: [{
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['50%', '50%'],
            data: pieData,
            label: { show: false },
            emphasis: { scale: false }
          }]
        };

      default:
        return {
          ...baseOption,
          xAxis: {
            type: 'category',
            data: data['x-axis'],
            show: false
          },
          yAxis: {
            type: 'value',
            show: false
          },
          series: [{
            type: 'bar',
            data: data['y-axis'],
            itemStyle: { color: colors[0] }
          }]
        };
    }
  };

  return (
    <div ref={chartRef} className={className} />
  );
} 