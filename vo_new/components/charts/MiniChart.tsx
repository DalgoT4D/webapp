"use client";

import React from 'react';
import ReactECharts from 'echarts-for-react';

interface MiniChartProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartType: string;
  width: number;
  height: number;
}

export default function MiniChart({ data, chartType, width, height }: MiniChartProps) {
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

      case 'area':
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
            symbol: 'none',
            areaStyle: { color: colors[2] + '40' },
            lineStyle: { color: colors[2], width: 2 }
          }]
        };

      case 'pie':
        const pieData = data['x-axis'].map((name, index) => ({
          name: String(name),
          value: data['y-axis'][index] || 0
        }));
        
        return {
          ...baseOption,
          series: [{
            type: 'pie',
            data: pieData,
            radius: ['25%', '75%'],
            center: ['50%', '50%'],
            label: { show: false },
            labelLine: { show: false },
            itemStyle: {
              color: (params: any) => colors[params.dataIndex % colors.length]
            }
          }]
        };

      case 'scatter':
        const scatterData = data['x-axis'].map((x, index) => [x, data['y-axis'][index]]);
        
        return {
          ...baseOption,
          xAxis: {
            type: 'value',
            show: false
          },
          yAxis: {
            type: 'value',
            show: false
          },
          series: [{
            type: 'scatter',
            data: scatterData,
            symbolSize: 4,
            itemStyle: { color: colors[3] }
          }]
        };

      case 'funnel':
        const funnelData = data['x-axis'].map((name, index) => ({
          name: String(name),
          value: data['y-axis'][index] || 0
        })).sort((a, b) => b.value - a.value);
        
        return {
          ...baseOption,
          series: [{
            type: 'funnel',
            data: funnelData,
            left: '10%',
            width: '80%',
            label: { show: false },
            itemStyle: {
              color: (params: any) => colors[params.dataIndex % colors.length]
            }
          }]
        };

      default:
        return generateMiniOption();
    }
  };

  const option = generateMiniOption();

  return (
    <ReactECharts
      option={option}
      style={{ width: `${width}px`, height: `${height}px` }}
      opts={{ 
        renderer: 'canvas',
        width: width,
        height: height
      }}
      notMerge={true}
      lazyUpdate={true}
    />
  );
} 