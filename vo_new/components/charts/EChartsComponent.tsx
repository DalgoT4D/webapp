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
  chartType?: string; // Add chart type support
  customOptions?: any; // Allow custom ECharts options
}

// Chart type configuration interface
interface ChartConfig {
  defaultColor: string | string[];
  seriesType: string;
  tooltip: any;
  showDataZoom: boolean;
  areaStyle?: any;
}

// Chart type configurations
const CHART_CONFIGS: Record<string, ChartConfig> = {
  bar: {
    defaultColor: '#6366f1',
    seriesType: 'bar',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    showDataZoom: true
  },
  line: {
    defaultColor: '#10b981',
    seriesType: 'line',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    showDataZoom: true
  },
  pie: {
    defaultColor: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
    seriesType: 'pie',
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    showDataZoom: false
  }
};

// Data transformation functions for different chart types
const transformDataForChartType = (data: { 'x-axis': any[]; 'y-axis': any[] }, chartType: string) => {
  const { 'x-axis': xData, 'y-axis': yData } = data;
  
  switch (chartType) {
    case 'pie':
      // For pie charts, transform to name-value pairs
      return xData.map((name, index) => ({
        name: String(name),
        value: Number(yData[index]) || 0
      }));
    
    default:
      // For line, bar charts, return y-axis data directly
      return yData;
  }
};

// Generate ECharts option based on chart type
const generateChartOption = (
  data: { 'x-axis': any[]; 'y-axis': any[] },
  chartType: string,
  chartName: string,
  chartDescription?: string,
  xAxisLabel?: string,
  yAxisLabel?: string
) => {
  const config: ChartConfig = CHART_CONFIGS[chartType] || CHART_CONFIGS.bar;
  const transformedData = transformDataForChartType(data, chartType);
  
  // Base option structure
  const baseOption = {
    title: {
      text: chartName,
      subtext: chartDescription,
      left: chartType === 'pie' ? 'left' : 'center',
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold'
      },
      subtextStyle: {
        fontSize: 12,
        color: '#666'
      }
    },
    tooltip: config.tooltip,
    legend: chartType === 'pie' ? {
      orient: 'vertical',
      left: 'right',
      top: 'middle',
      type: 'scroll'
    } : undefined,
    grid: (chartType !== 'pie') ? {
      left: '10%',
      right: '10%',
      bottom: config.showDataZoom ? '20%' : '15%',
      top: '20%',
      containLabel: true
    } : undefined,
    dataZoom: config.showDataZoom ? [
      {
        type: 'slider',
        show: true,
        xAxisIndex: [0],
        start: 0,
        end: 100
      },
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ] : undefined
  };

  // Chart-specific configurations
  switch (chartType) {
    case 'pie':
      return {
        ...baseOption,
        series: [{
          name: yAxisLabel || 'Value',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['40%', '50%'],
          data: transformedData,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          label: {
            show: true,
            formatter: '{b}: {d}%'
          },
          labelLine: {
            show: true
          }
        }]
      };

    default: // bar and line
      return {
        ...baseOption,
        xAxis: {
          type: 'category',
          data: data['x-axis'],
          name: xAxisLabel,
          nameLocation: 'middle',
          nameGap: 30,
          axisLabel: {
            rotate: data['x-axis'].length > 10 ? 45 : 0,
            interval: data['x-axis'].length > 20 ? 'auto' : 0
          }
        },
        yAxis: {
          type: 'value',
          name: yAxisLabel,
          nameLocation: 'middle',
          nameGap: 40
        },
        series: [{
          name: yAxisLabel || 'Value',
          type: config.seriesType,
          data: transformedData,
          ...(config.areaStyle ? { areaStyle: config.areaStyle } : {}),
          itemStyle: {
            color: Array.isArray(config.defaultColor) ? undefined : config.defaultColor
          },
          ...(Array.isArray(config.defaultColor) ? { color: config.defaultColor } : {})
        }]
      };
  }
};

export default function EChartsComponent({ 
  data, 
  chartName, 
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  chartType = 'bar',
  customOptions = {}
}: EChartsComponentProps) {
  // Generate chart options based on chart type
  const options = React.useMemo(() => {
    // If no data, return empty chart
    if (!data || !data['x-axis'] || !data['y-axis']) {
      return {
        title: {
          text: chartName,
          subtext: 'No data available'
        }
      };
    }

    // Generate options based on chart type
    const baseOptions = generateChartOption(
      data,
      chartType,
      chartName,
      chartDescription,
      xAxisLabel,
      yAxisLabel
    );

    // Merge with custom options if provided
    return { ...baseOptions, ...customOptions };
  }, [data, chartType, chartName, chartDescription, xAxisLabel, yAxisLabel, customOptions]);

  // Dynamic height based on chart type and data size
  const getChartHeight = () => {
    if (chartType === 'pie') {
      return '400px';
    }
    
    // Adjust height based on data points for other chart types
    const dataSize = data?.['x-axis']?.length || 0;
    if (dataSize > 20) {
      return '500px';
    } else if (dataSize > 10) {
      return '450px';
    }
    return '400px';
  };

  return (
    <div className="w-full h-full">
      <ReactECharts
        option={options}
        style={{ height: getChartHeight(), width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  );
} 