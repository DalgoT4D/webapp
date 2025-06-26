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
  area: {
    defaultColor: '#f59e0b',
    seriesType: 'line',
    areaStyle: {},
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
  },
  scatter: {
    defaultColor: '#ef4444',
    seriesType: 'scatter',
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}'
    },
    showDataZoom: true
  },
  funnel: {
    defaultColor: '#8b5cf6',
    seriesType: 'funnel',
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
    case 'funnel':
      // For pie and funnel charts, transform to name-value pairs
      return xData.map((name, index) => ({
        name: String(name),
        value: Number(yData[index]) || 0
      }));
    
    case 'scatter':
      // For scatter plots, return coordinate pairs
      return xData.map((x, index) => [x, yData[index]]);
    
    default:
      // For line, bar, area charts, return y-axis data directly
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
      left: chartType === 'pie' || chartType === 'funnel' ? 'left' : 'center',
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
    legend: chartType === 'pie' || chartType === 'funnel' ? {
      orient: 'vertical',
      left: 'right',
      top: 'middle',
      type: 'scroll'
    } : undefined,
    grid: (chartType !== 'pie' && chartType !== 'funnel') ? {
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

    case 'funnel':
      return {
        ...baseOption,
        series: [{
          name: yAxisLabel || 'Value',
          type: 'funnel',
          left: '10%',
          width: '80%',
          maxSize: '80%',
          data: transformedData.sort((a: any, b: any) => b.value - a.value),
          label: {
            show: true,
            position: 'inside',
            formatter: '{b}: {c}'
          },
          emphasis: {
            label: {
              fontSize: 14
            }
          }
        }]
      };

    case 'scatter':
      return {
        ...baseOption,
        xAxis: {
          type: 'value',
          name: xAxisLabel,
          nameLocation: 'middle',
          nameGap: 30,
          scale: true
        },
        yAxis: {
          type: 'value',
          name: yAxisLabel,
          nameLocation: 'middle',
          nameGap: 40,
          scale: true
        },
        series: [{
          name: yAxisLabel || 'Data',
          type: 'scatter',
          data: transformedData,
          itemStyle: {
            color: config.defaultColor
          },
          symbolSize: 8,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };

    default: // bar, line, area
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
            interval: 'auto'
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
          smooth: chartType === 'line' || chartType === 'area',
          areaStyle: config.areaStyle,
          itemStyle: {
            color: config.defaultColor
          },
          lineStyle: (chartType === 'line' || chartType === 'area') ? {
            width: 2
          } : undefined,
          barWidth: chartType === 'bar' ? '60%' : undefined,
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
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

  // Validate that we have data
  if (data['x-axis'].length === 0 || data['y-axis'].length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] h-96 bg-background rounded-lg border p-4 flex items-center justify-center">
          <div className="text-muted-foreground">No data points available</div>
        </div>
      </div>
    );
  }

  // Generate chart option based on type
  const option = generateChartOption(
    data,
    chartType,
    chartName,
    chartDescription,
    xAxisLabel,
    yAxisLabel
  );

  // Merge with custom options if provided
  const finalOption = {
    ...option,
    ...customOptions
  };

  // Dynamic height based on chart type and data size
  const getChartHeight = () => {
    if (chartType === 'pie' || chartType === 'funnel') {
      return '400px';
    }
    
    const dataSize = data['x-axis'].length;
    if (dataSize > 20) {
      return '500px';
    } else if (dataSize > 10) {
      return '450px';
    }
    return '400px';
  };

  return (
    <div className="w-full overflow-x-auto">
      <div 
        className="min-w-[900px] bg-background rounded-lg border p-4" 
        style={{ height: getChartHeight() }}
      >
        <ReactECharts 
          option={finalOption} 
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
          notMerge={true}
          lazyUpdate={true}
        />
      </div>
      
      {/* Chart type indicator */}
      <div className="mt-2 text-sm text-muted-foreground">
        Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)} | 
        Data Points: {data['x-axis'].length}
      </div>
    </div>
  );
} 