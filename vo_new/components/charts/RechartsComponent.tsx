"use client";

import React from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell,
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

export default function RechartsComponent({
  data,
  chartName,
  chartDescription,
  xAxisLabel = 'X Axis',
  yAxisLabel = 'Y Axis',
  chartType = 'bar'
}: RechartsComponentProps) {
  
  // Transform data for Recharts
  const transformedData = React.useMemo(() => {
    if (!data || !data['x-axis'] || !data['y-axis']) {
      return [];
    }

    const { 'x-axis': xData, 'y-axis': yData } = data;
    
    // For all chart types, create an array of objects with x and y values
    return xData.map((x, index) => ({
      name: String(x),
      value: Number(yData[index]) || 0
    }));
  }, [data]);

  // Colors for charts
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'];

  // Render appropriate chart based on type
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
                angle={transformedData.length > 10 ? -45 : 0}
                textAnchor={transformedData.length > 10 ? 'end' : 'middle'}
                height={60}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" name={yAxisLabel} fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={transformedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                label={{ value: xAxisLabel, position: 'insideBottom', offset: -10 }}
                angle={transformedData.length > 10 ? -45 : 0}
                textAnchor={transformedData.length > 10 ? 'end' : 'middle'}
                height={60}
              />
              <YAxis 
                label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }}
              />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="value" 
                name={yAxisLabel} 
                stroke={COLORS[1]} 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={transformedData}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={150}
                innerRadius={60}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {transformedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value, name, props) => [`${value}`, props.payload.name]} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      
      default:
        return <div>Unsupported chart type</div>;
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{chartName}</h3>
        {chartDescription && <p className="text-sm text-gray-500">{chartDescription}</p>}
      </div>
      {renderChart()}
    </div>
  );
} 