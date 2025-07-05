"use client";

import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
// Note: @nivo/scatterplot might need to be installed separately

interface NivoComponentProps {
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

// Data transformation functions for different chart types
const transformDataForNivo = (data: { 'x-axis': any[]; 'y-axis': any[] }, chartType: string, xAxisLabel: string, yAxisLabel: string) => {
  const { 'x-axis': xData, 'y-axis': yData } = data;
  
  switch (chartType) {
    case 'line':
    case 'area':
      // For line/area charts, return data in Nivo line format
      return [
        {
          id: yAxisLabel,
          data: xData.map((x, index) => ({
            x: x,
            y: Number(yData[index]) || 0
          }))
        }
      ];
    
    case 'pie':
      // For pie charts, transform to Nivo pie format
      return xData.map((label, index) => ({
        id: String(label),
        label: String(label),
        value: Number(yData[index]) || 0
      }));
    
    case 'scatter':
      // For scatter plots, return coordinate pairs
      return [
        {
          id: yAxisLabel,
          data: xData.map((x, index) => ({
            x: Number(x) || 0,
            y: Number(yData[index]) || 0
          }))
        }
      ];
    
    default: // bar
      // For bar charts, return data in Nivo bar format
      return xData.map((xValue, index) => ({
        id: xValue,
        [xAxisLabel]: xValue,
        [yAxisLabel]: Number(yData[index]) || 0
      }));
  }
};

// Chart rendering functions
const renderBarChart = (chartData: any[], xAxisLabel: string, yAxisLabel: string) => (
  <ResponsiveBar
    data={chartData}
    keys={[yAxisLabel]}
    indexBy={xAxisLabel}
    margin={{ top: 20, right: 130, bottom: 80, left: 80 }}
    padding={0.3}
    valueScale={{ type: 'linear' }}
    indexScale={{ type: 'band', round: true }}
    colors={{ scheme: 'nivo' }}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
      legend: xAxisLabel,
      legendPosition: 'middle',
      legendOffset: 60
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: yAxisLabel,
      legendPosition: 'middle',
      legendOffset: -60
    }}
    enableLabel={true}
    labelSkipWidth={12}
    labelSkipHeight={12}
    animate={true}
    motionConfig="wobbly"
  />
);

const renderLineChart = (chartData: any[], xAxisLabel: string, yAxisLabel: string, chartType: string) => (
  <ResponsiveLine
    data={chartData}
    margin={{ top: 20, right: 110, bottom: 80, left: 80 }}
    xScale={{ type: 'point' }}
    yScale={{
      type: 'linear',
      min: 'auto',
      max: 'auto',
      stacked: false,
      reverse: false
    }}
    curve="cardinal"
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
      legend: xAxisLabel,
      legendOffset: 60,
      legendPosition: 'middle'
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: yAxisLabel,
      legendOffset: -60,
      legendPosition: 'middle'
    }}
    enableGridX={false}
    enableGridY={true}
    pointSize={6}
    pointColor={{ theme: 'background' }}
    pointBorderWidth={2}
    pointBorderColor={{ from: 'serieColor' }}
    pointLabelYOffset={-12}
    enableArea={chartType === 'area'}
    areaOpacity={chartType === 'area' ? 0.3 : 0}
    useMesh={true}
    animate={true}
    motionConfig="wobbly"
  />
);

const renderPieChart = (chartData: any[]) => (
  <ResponsivePie
    data={chartData}
    margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
    innerRadius={0.4}
    padAngle={0.7}
    cornerRadius={3}
    activeOuterRadiusOffset={8}
    colors={{ scheme: 'nivo' }}
    borderWidth={1}
    borderColor={{
      from: 'color',
      modifiers: [
        ['darker', 0.2]
      ]
    }}
    arcLinkLabelsSkipAngle={10}
    arcLinkLabelsTextColor="#333333"
    arcLinkLabelsThickness={2}
    arcLinkLabelsColor={{ from: 'color' }}
    arcLabelsSkipAngle={10}
    arcLabelsTextColor={{
      from: 'color',
      modifiers: [
        ['darker', 2]
      ]
    }}
    animate={true}
    motionConfig="wobbly"
  />
);

const renderUnsupportedChart = (chartType: string) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-center">
      <div className="text-muted-foreground mb-2">
        Chart type "{chartType}" is not yet supported in Nivo
      </div>
      <div className="text-sm text-muted-foreground">
        Supported types: bar, line, area, pie
      </div>
    </div>
  </div>
);

export default function NivoComponent({ 
  data, 
  chartName, 
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  chartType = 'bar'
}: NivoComponentProps) {
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
  const chartData = transformDataForNivo(data, chartType, xAxisLabel, yAxisLabel);

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
      case 'area':
        return renderLineChart(chartData, xAxisLabel, yAxisLabel, chartType);
      case 'pie':
        return renderPieChart(chartData);
      case 'scatter':
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
        <div style={{ height: 'calc(100% - 80px)' }}>
          {renderChart()}
        </div>
      </div>
      
      {/* Chart type indicator */}
      <div className="mt-2 text-sm text-muted-foreground">
        Chart Type: {chartType.charAt(0).toUpperCase() + chartType.slice(1)} (Nivo) | 
        Data Points: {data['x-axis'].length}
      </div>
    </div>
  );
} 