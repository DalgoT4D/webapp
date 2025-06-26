"use client";

import React from 'react';
import { ResponsiveBar } from '@nivo/bar';

interface NivoComponentProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartName: string;
  chartDescription?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function NivoComponent({ 
  data, 
  chartName, 
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis'
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

  // Transform the backend data format to Nivo format
  const chartData = data['x-axis'].map((xValue, index) => ({
    id: xValue,
    [xAxisLabel]: xValue,
    [yAxisLabel]: data['y-axis'][index] || 0
  }));

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[900px] h-96 bg-background rounded-lg border p-4">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">{chartName}</h3>
          {chartDescription && (
            <p className="text-sm text-muted-foreground">{chartDescription}</p>
          )}
        </div>
        <div style={{ height: '320px' }}>
          <ResponsiveBar
            data={chartData}
            keys={[yAxisLabel]}
            indexBy={xAxisLabel}
            margin={{ top: 20, right: 130, bottom: 80, left: 80 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: 'nivo' }}
            defs={[
              {
                id: 'dots',
                type: 'patternDots',
                background: 'inherit',
                color: '#38bcb2',
                size: 4,
                padding: 1,
                stagger: true
              },
              {
                id: 'lines',
                type: 'patternLines',
                background: 'inherit',
                color: '#eed312',
                rotation: -45,
                lineWidth: 6,
                spacing: 10
              }
            ]}
            borderColor={{
              from: 'color',
              modifiers: [
                [
                  'darker',
                  1.6
                ]
              ]
            }}
            axisTop={null}
            axisRight={null}
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
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{
              from: 'color',
              modifiers: [
                [
                  'darker',
                  1.6
                ]
              ]
            }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'bottom-right',
                direction: 'column',
                justify: false,
                translateX: 120,
                translateY: 0,
                itemsSpacing: 2,
                itemWidth: 100,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 20,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ]}
            role="application"
            ariaLabel="Nivo bar chart"
            barAriaLabel={e => `${e.id}: ${e.formattedValue} in ${xAxisLabel}: ${e.indexValue}`}
          />
        </div>
      </div>
    </div>
  );
} 