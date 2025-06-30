"use client";

import React, { useState, useEffect } from 'react';
import { apiPost } from "@/lib/api";
import MiniChart from "./MiniChart";

interface SavedChartThumbnailProps {
  chart: {
    id: number;
    title: string;
    description: string;
    chart_type: string;
    schema_name: string;
    table: string;
    config: {
      xAxis: string;
      yAxis: string;
      chartType: string;
    };
  };
  width?: number;
  height?: number;
}

export default function SavedChartThumbnail({ 
  chart, 
  width = 200, 
  height = 120 
}: SavedChartThumbnailProps) {
  const [chartData, setChartData] = useState<{ 'x-axis': any[]; 'y-axis': any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true; // Prevent state updates if component unmounts
    
    const fetchChartData = async () => {
      try {
        if (!isActive) return;
        
        setLoading(true);
        setError(null);

        const payload = {
          chart_type: chart.config.chartType,
          schema_name: chart.schema_name,
          table_name: chart.table,
          xaxis_col: chart.config.xAxis,
          yaxis_col: chart.config.yAxis,
          offset: 0,
          limit: 8 // Limit data for thumbnails
        };

        const responseData = await apiPost('/api/visualization/generate_chart/', payload);
        
        if (!isActive) return; // Component was unmounted
        
        // Transform the backend response to the expected format
        const xAxisData = responseData.data?.xaxis_data?.[chart.config.xAxis] || [];
        const yAxisData = responseData.data?.yaxis_data?.[chart.config.yAxis] || [];
        
        if (xAxisData.length === 0 || yAxisData.length === 0) {
          throw new Error('No data available');
        }
        
        // Ensure both arrays have the same length
        const minLength = Math.min(xAxisData.length, yAxisData.length);
        
        const transformedData = {
          'x-axis': xAxisData.slice(0, minLength),
          'y-axis': yAxisData.slice(0, minLength)
        };
        
        // Debug logging
        console.log('Thumbnail data for chart:', chart.title, {
          chartType: chart.config.chartType,
          dataLength: transformedData['x-axis'].length,
          xData: transformedData['x-axis'],
          yData: transformedData['y-axis']
        });
        
        if (isActive) {
          setChartData(transformedData);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : 'Failed to load chart data');
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    // Add a small delay to avoid immediate API calls on render
    const timeoutId = setTimeout(fetchChartData, 100);
    
    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [chart.id, chart.config.chartType, chart.schema_name, chart.table, chart.config.xAxis, chart.config.yAxis]);

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded border"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded border"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-xs text-gray-500">No preview</div>
      </div>
    );
  }

  const containerStyle = {
    width: `${width}px`,
    height: `${height}px`
  };

  return (
    <div 
      className="bg-white rounded border shadow-sm overflow-hidden flex items-center justify-center" 
      style={containerStyle}
    >
      <MiniChart
        data={chartData}
        chartType={chart.config.chartType}
        width={width}
        height={height}
      />
    </div>
  );
} 