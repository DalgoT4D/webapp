"use client";

import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';

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

export default function NivoComponent({
  data,
  chartName,
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  chartType = 'bar'
}: NivoComponentProps) {
  
  // Transform data for Nivo charts
  const transformedData = React.useMemo(() => {
    if (!data || !data['x-axis'] || !data['y-axis']) {
      return [];
    }

    const { 'x-axis': xData, 'y-axis': yData } = data;
    
    switch (chartType) {
      case 'bar':
        return xData.map((x, index) => ({
          x: String(x),
          y: Number(yData[index]) || 0
        }));
      
      case 'line':
        return [{
          id: yAxisLabel,
          data: xData.map((x, index) => ({
            x: String(x),
            y: Number(yData[index]) || 0
          }))
        }];
      
      case 'pie':
        return xData.map((x, index) => ({
          id: String(x),
          label: String(x),
          value: Number(yData[index]) || 0
        }));
      
      default:
        return xData.map((x, index) => ({
          x: String(x),
          y: Number(yData[index]) || 0
        }));
    }
  }, [data, chartType, yAxisLabel]);

  // Common chart theme
  const theme = {
    fontSize: 12,
    textColor: '#374151',
    axis: {
      domain: {
        line: {
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      },
      ticks: {
        line: {
          stroke: '#d1d5db',
          strokeWidth: 1
        }
      }
    },
    grid: {
      line: {
        stroke: '#e5e7eb',
        strokeWidth: 1
      }
    },
    legends: {
      text: {
        fontSize: 12
      }
    },
    tooltip: {
      container: {
        background: 'white',
        fontSize: 12,
        borderRadius: 4,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.25)'
      }
    }
  };

  // Common colors
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveBar
            // @ts-ignore
            data={transformedData}
            keys={['y']}
            indexBy="x"
            margin={{ top: 50, right: 50, bottom: 70, left: 60 }}
            padding={0.3}
            colors={[colors[0]]}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: transformedData.length > 10 ? 45 : 0,
              legend: xAxisLabel,
              legendPosition: 'middle',
              legendOffset: 50
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: yAxisLabel,
              legendPosition: 'middle',
              legendOffset: -50
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            animate={true}
            motionStiffness={90}
            motionDamping={15}
            theme={theme}
          />
        );
      
      case 'line':
        return (
          <ResponsiveLine
            // @ts-ignore
            data={transformedData}
            margin={{ top: 50, right: 50, bottom: 70, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              // @ts-ignore
              tickRotation: transformedData[0]?.data.length > 10 ? 45 : 0,
              legend: xAxisLabel,
              legendOffset: 50,
              legendPosition: 'middle'
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: yAxisLabel,
              legendOffset: -50,
              legendPosition: 'middle'
            }}
            colors={[colors[1]]}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabel="y"
            pointLabelYOffset={-12}
            useMesh={true}
            theme={theme}
            legends={[
              {
                anchor: 'top-right',
                direction: 'column',
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: 'left-to-right',
                itemWidth: 80,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: 'circle',
                symbolBorderColor: 'rgba(0, 0, 0, .5)',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemBackground: 'rgba(0, 0, 0, .03)',
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
          />
        );
      
      case 'pie':
        return (
          <ResponsivePie
            // @ts-ignore
            data={transformedData}
            margin={{ top: 40, right: 80, bottom: 40, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            colors={colors}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            radialLabelsSkipAngle={10}
            radialLabelsTextColor="#333333"
            radialLabelsLinkColor={{ from: 'color' }}
            sliceLabelsSkipAngle={10}
            sliceLabelsTextColor="#333333"
            theme={theme}
            legends={[
              {
                anchor: 'right',
                direction: 'column',
                justify: false,
                translateX: 0,
                translateY: 0,
                itemsSpacing: 0,
                itemWidth: 100,
                itemHeight: 20,
                itemTextColor: '#999',
                itemDirection: 'left-to-right',
                itemOpacity: 1,
                symbolSize: 18,
                symbolShape: 'circle'
              }
            ]}
          />
        );
      
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full h-[400px]">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{chartName}</h3>
        {chartDescription && <p className="text-sm text-gray-500">{chartDescription}</p>}
      </div>
      {renderChart()}
    </div>
  );
} 