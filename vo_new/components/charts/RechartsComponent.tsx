"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface RechartsComponentProps {
  data: {
    'x-axis': any[];
    'y-axis': any[];
  };
  chartName: string;
  chartDescription?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export default function RechartsComponent({ 
  data, 
  chartName, 
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis'
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

  // Transform the backend data format to Recharts format
  const chartData = data['x-axis'].map((xValue, index) => ({
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
        <ResponsiveContainer width="100%" height="85%">
          <BarChart 
            data={chartData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
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
        </ResponsiveContainer>
      </div>
    </div>
  );
} 