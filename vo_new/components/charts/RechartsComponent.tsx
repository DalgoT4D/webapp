"use client";

import React from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  AreaChart, Area,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend 
} from 'recharts';

interface RechartsComponentProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartName: string;
  chartDescription?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  chartType?: string; // Add chart type support
}

// Color palette for consistent styling
const RECHARTS_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

// Data transformation functions for different chart types
const transformDataForRecharts = (data: { 'x-axis': any[]; 'y-axis': any[] }, chartType: string, xAxisLabel: string, yAxisLabel: string) => {
  const { 'x-axis': xData, 'y-axis': yData } = data;
  
  switch (chartType) {
    case 'pie':
      // For pie charts, transform to Recharts pie format
      return xData.map((label, index) => ({
        name: String(label),
        value: Number(yData[index]) || 0
      }));
    
    case 'scatter':
      // For scatter plots, return coordinate pairs
      return xData.map((x, index) => ({
        x: Number(x) || 0,
        y: Number(yData[index]) || 0
      }));
    
    default: // bar, line, area
      // For most charts, return standard format
      return xData.map((xValue, index) => ({
        [xAxisLabel]: xValue,
        [yAxisLabel]: Number(yData[index]) || 0
      }));
  }
};

// Chart rendering functions
const renderBarChart = (chartData: any[], xAxisLabel: string, yAxisLabel: string) => (
  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      dataKey={xAxisLabel} 
      tick={{ fontSize: 12 }} 
      angle={-45}
      textAnchor="end"
      height={80}
    />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip />
    <Legend />
    <Bar 
      dataKey={yAxisLabel} 
      name={yAxisLabel} 
      fill="#6366f1" 
      radius={[4, 4, 0, 0]} 
    />
  </BarChart>
);

const renderLineChart = (chartData: any[], xAxisLabel: string, yAxisLabel: string) => (
  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      dataKey={xAxisLabel} 
      tick={{ fontSize: 12 }} 
      angle={-45}
      textAnchor="end"
      height={80}
    />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip />
    <Legend />
    <Line 
      type="monotone" 
      dataKey={yAxisLabel} 
      name={yAxisLabel} 
      stroke="#10b981" 
      strokeWidth={2}
      dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
      activeDot={{ r: 6 }}
    />
  </LineChart>
);

const renderAreaChart = (chartData: any[], xAxisLabel: string, yAxisLabel: string) => (
  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      dataKey={xAxisLabel} 
      tick={{ fontSize: 12 }} 
      angle={-45}
      textAnchor="end"
      height={80}
    />
    <YAxis tick={{ fontSize: 12 }} />
    <Tooltip />
    <Legend />
    <Area 
      type="monotone" 
      dataKey={yAxisLabel} 
      name={yAxisLabel} 
      stroke="#f59e0b" 
      fill="#f59e0b"
      fillOpacity={0.3}
    />
  </AreaChart>
);

const renderPieChart = (chartData: any[]) => (
  <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
    <Pie
      data={chartData}
      cx="50%"
      cy="50%"
      innerRadius={60}
      outerRadius={120}
      paddingAngle={5}
      dataKey="value"
      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
    >
      {chartData.map((entry, index) => (
        <Cell key={`cell-${index}`} fill={RECHARTS_COLORS[index % RECHARTS_COLORS.length]} />
      ))}
    </Pie>
    <Tooltip />
  </PieChart>
);

const renderScatterChart = (chartData: any[]) => (
  <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis 
      type="number" 
      dataKey="x" 
      name="X" 
      tick={{ fontSize: 12 }}
    />
    <YAxis 
      type="number" 
      dataKey="y" 
      name="Y" 
      tick={{ fontSize: 12 }}
    />
    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
    <Scatter 
      name="Data Points" 
      data={chartData} 
      fill="#ef4444" 
    />
  </ScatterChart>
);

const renderUnsupportedChart = (chartType: string) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-muted-foreground mb-2">
        Chart type "{chartType}" is not yet supported in Recharts
      </div>
      <div className="text-sm text-muted-foreground">
        Supported types: bar, line, area, pie, scatter
      </div>
    </div>
  </div>
);

export default function RechartsComponent({ 
  data, 
  chartName, 
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  chartType = 'bar'
}: RechartsComponentProps) {
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

  // Validate that we have data points
  if (data['x-axis'].length === 0 || data['y-axis'].length === 0) {
    return (
      <div className="w-full overflow-x-auto">
        <div className="min-w-[900px] h-96 bg-background rounded-lg border p-4 flex items-center justify-center">
          <div className="text-muted-foreground">No data points available</div>
        </div>
      </div>
    );
  }

  // Transform data based on chart type
  const chartData = transformDataForRecharts(data, chartType, xAxisLabel, yAxisLabel);

  // Dynamic height based on chart type
  const getChartHeight = () => {
    const dataSize = data['x-axis'].length;
    if (dataSize > 20) {
      return '500px';
    } else if (dataSize > 10) {
      return '450px';
    }
    return '400px';
  };

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return renderBarChart(chartData, xAxisLabel, yAxisLabel);
      case 'line':
        return renderLineChart(chartData, xAxisLabel, yAxisLabel);
      case 'area':
        return renderAreaChart(chartData, xAxisLabel, yAxisLabel);
      case 'pie':
        return renderPieChart(chartData);
      case 'scatter':
        return renderScatterChart(chartData);
      case 'funnel':
      default:
        return renderUnsupportedChart(chartType);
    }
  };

  return (
    <div className="w-full overflow-x-auto">
      <div 
        className="min-w-[900px] bg-background rounded-lg border p-4" 
        style={{ height: getChartHeight() }}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{chartName}</h3>
          {chartDescription && (
            <p className="text-sm text-muted-foreground">{chartDescription}</p>
          )}
        </div>
        <ResponsiveContainer width="100%" height="85%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      {/* Chart type indicator */}
      <div className="mt-2 text-sm text-muted-foreground">
        Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)} (Recharts) | 
        Data Points: {data['x-axis'].length}
      </div>
    </div>
  );
} 