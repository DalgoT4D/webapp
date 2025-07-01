"use client";

import React, { useRef, useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';

interface MiniChartProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartType: string;
  className?: string;
}

export default function MiniChart({ data, chartType, className = "w-full h-full" }: MiniChartProps) {
  const chartRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 280, height: 160 });

  // Update dimensions based on container size
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    };

    // Initial measurement
    updateDimensions();

    // Set up resize observer for responsive updates
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Resize chart when dimensions change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.getEchartsInstance()?.resize();
    }
  }, [dimensions]);

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
    <div ref={containerRef} className={className}>
      <ReactECharts
        ref={chartRef}
        option={option}
        style={{ width: '100%', height: '100%' }}
        opts={{ 
          renderer: 'canvas',
          width: dimensions.width,
          height: dimensions.height
        }}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
} 