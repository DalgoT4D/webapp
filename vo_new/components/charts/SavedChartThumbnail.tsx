"use client";

import React, { useState, useEffect } from 'react';
import { apiPost } from "@/lib/api";
import MiniChart, { MiniChartProps } from "./MiniChart";

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
  className?: string;
}

export default function SavedChartThumbnail({ 
  chart,
  className = "w-full h-full"
}: SavedChartThumbnailProps) {
  const [chartData, setChartData] = useState<any | null>(null);
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
          mode: 'raw',
          schema_name: chart.schema_name,
          table_name: chart.table,
          xaxis_col: chart.config.xAxis,
          yaxis_col: chart.config.yAxis,
          offset: 0,
          limit: 8 // Limit data for thumbnails
        };

        const responseData = await apiPost('/api/visualization/generate_chart/', payload);
        
        if (!isActive) return; // Component was unmounted
        
        if (!responseData.chart_config) {
          throw new Error('No chart configuration received');
        }
        
        if (isActive) {
          setChartData(responseData.chart_config);
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
      <div className={`flex items-center justify-center bg-muted/50 rounded border ${className}`}>
        <div className="text-center">
          <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full mx-auto mb-1"></div>
          <div className="text-xs text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !chartData) {
    return (
      <div className={`flex items-center justify-center bg-muted/50 rounded border ${className}`}>
        <div className="text-center text-muted-foreground">
          <div className="text-lg mb-1">📊</div>
          <div className="text-xs">No preview</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-background rounded border shadow-sm overflow-hidden ${className}`}>
      <MiniChart
        config={chartData}
        chartType={chart.config.chartType}
        className="w-full h-full"
      />
    </div>
  );
} 