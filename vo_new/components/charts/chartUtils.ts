import type { ChartData } from '@/hooks/api/useChart';

// Chart utility functions and configurations for dynamic chart rendering

export interface ChartTypeConfig {
  name: string;
  icon: string;
  description: string;
  supportedLibraries: ('echarts' | 'nivo' | 'recharts')[];
  dataRequirements: {
    minDataPoints: number;
    maxDataPoints?: number;
    xAxisType: 'category' | 'value' | 'time' | 'any';
    yAxisType: 'value' | 'category' | 'any';
  };
}

// Chart type definitions with metadata
export const CHART_TYPE_CONFIGS: Record<string, ChartTypeConfig> = {
  bar: {
    name: 'Bar Chart',
    icon: '📊',
    description: 'Compare discrete categories of data',
    supportedLibraries: ['echarts', 'nivo', 'recharts'],
    dataRequirements: {
      minDataPoints: 1,
      maxDataPoints: 50,
      xAxisType: 'category',
      yAxisType: 'value'
    }
  },
  line: {
    name: 'Line Chart',
    icon: '📈',
    description: 'Show trends over time or continuous data',
    supportedLibraries: ['echarts', 'nivo', 'recharts'],
    dataRequirements: {
      minDataPoints: 2,
      xAxisType: 'any',
      yAxisType: 'value'
    }
  },
  pie: {
    name: 'Pie Chart',
    icon: '🥧',
    description: 'Show parts of a whole with percentages',
    supportedLibraries: ['echarts', 'nivo', 'recharts'],
    dataRequirements: {
      minDataPoints: 2,
      maxDataPoints: 12,
      xAxisType: 'category',
      yAxisType: 'value'
    }
  }
};

// Color palettes for different chart types
export const COLOR_PALETTES = {
  default: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
  pastel: ['#a7c9f1', '#a7e6d7', '#f7d794', '#f2a6a6', '#c9a9dd', '#a7e0f0', '#c9d93a', '#f5b342'],
  vibrant: ['#4f46e5', '#059669', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#65a30d', '#ea580c'],
  monochrome: ['#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#f9fafb', '#ffffff'],
  cool: ['#3b82f6', '#06b6d4', '#10b981', '#84cc16', '#eab308', '#f59e0b', '#f97316', '#ef4444'],
  warm: ['#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#10b981', '#06b6d4', '#3b82f6']
};

// Utility functions for chart data validation and transformation
export function validateChartData(data: ChartData, chartType: string) {
  // For now, assume all chart_config data is valid
  return {
    isValid: true,
    errors: [],
    recommendations: []
  };
}

// Get chart types supported by a specific library
export const getSupportedChartTypes = (library: 'echarts' | 'nivo' | 'recharts'): string[] => {
  return Object.entries(CHART_TYPE_CONFIGS)
    .filter(([_, config]) => config.supportedLibraries.includes(library))
    .map(([type]) => type);
};

// Get recommended chart type based on data characteristics
export function getRecommendedChartType(data: ChartData, chartLibraryType: string) {
  // For now, return the current chart type from the config
  return data.chart_config.series?.[0]?.type || 'bar';
}

// Generate chart title suggestions based on data and chart type
export const generateChartTitleSuggestions = (
  xAxisLabel: string,
  yAxisLabel: string,
  chartType: string
): string[] => {
  const config = CHART_TYPE_CONFIGS[chartType];
  if (!config) return [`${yAxisLabel} by ${xAxisLabel}`];

  const suggestions: string[] = [];
  
  switch (chartType) {
    case 'bar':
      suggestions.push(
        `${yAxisLabel} by ${xAxisLabel}`,
        `Comparison of ${yAxisLabel}`,
        `${xAxisLabel} Performance Analysis`
      );
      break;
    case 'line':
      suggestions.push(
        `${yAxisLabel} Trend Over ${xAxisLabel}`,
        `${yAxisLabel} Time Series`,
        `Evolution of ${yAxisLabel}`
      );
      break;
    case 'pie':
      suggestions.push(
        `Distribution of ${yAxisLabel}`,
        `${yAxisLabel} Breakdown`,
        `${xAxisLabel} Share Analysis`
      );
      break;
    default:
      suggestions.push(`${yAxisLabel} by ${xAxisLabel}`);
  }
  
  return suggestions;
};

// Export chart configuration for external use
export const getChartTypeInfo = (chartType: string) => {
  return CHART_TYPE_CONFIGS[chartType];
};

// Check if chart type is supported by library
export const isChartTypeSupported = (chartType: string, library: 'echarts' | 'nivo' | 'recharts'): boolean => {
  const config = CHART_TYPE_CONFIGS[chartType];
  return config ? config.supportedLibraries.includes(library) : false;
}; 