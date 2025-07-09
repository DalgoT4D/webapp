"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/api";

// Import chart components
import ChartForm from "@/components/charts/ChartForm";
import SavedChartThumbnail from "@/components/charts/SavedChartThumbnail";

interface CreatedChart {
  schema: string;
  table: string;
  xAxis: string;
  yAxis: string;
  chartName: string;
  chartDescription: string;
}

interface SavedChart {
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
  created_at: string;
  updated_at: string;
}

export default function ChartsPage() {
  const [activeTab, setActiveTab] = useState("echarts");
  
  // Form states for each tab
  const [echartsFormOpen, setEchartsFormOpen] = useState(false);
  const [nivoFormOpen, setNivoFormOpen] = useState(false);

  // Edit mode states
  const [editingChart, setEditingChart] = useState<SavedChart | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);

  // Saved charts states
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [savedChartsLoading, setSavedChartsLoading] = useState(false);
  const [savedChartsError, setSavedChartsError] = useState<string | null>(null);

  // // Function to generate chart data from backend
  // const generateChartData = async (chart: CreatedChart) => {
  //   const payload = {
  //     schema: chart.schema,
  //     table: chart.table,
  //     x_axis: chart.xAxis,
  //     y_axis: chart.yAxis,
  //     chart_name: chart.chartName,
  //     chart_description: chart.chartDescription
  //   };
    
  //   const responseData = await apiPost('/api/visualization/generate_chart/', payload);
    
  //   // Transform the backend response to the expected format
  //   const xAxisData = responseData.data?.xaxis_data?.[chart.xAxis] || [];
  //   const yAxisData = responseData.data?.yaxis_data?.[chart.yAxis] || [];
    
  //   // Validate that we have both x and y axis data
  //   if (!xAxisData.length || !yAxisData.length) {
  //     throw new Error(`No data found for selected columns. X-axis: ${xAxisData.length} items, Y-axis: ${yAxisData.length} items`);
  //   }
    
  //   // Ensure both arrays have the same length
  //   const minLength = Math.min(xAxisData.length, yAxisData.length);
    
  //   return {
  //     'x-axis': xAxisData.slice(0, minLength),
  //     'y-axis': yAxisData.slice(0, minLength)
  //   };
  // };

  // Function to save a chart
  const saveChart = async (chart: CreatedChart & { chartType: string; chartLibraryType: string }) => {
    const payload = {
      title: chart.chartName,
      description: chart.chartDescription,
      chart_type: chart.chartLibraryType, // Use library type for filtering (echarts, nivo, recharts)
      schema_name: chart.schema,
      table: chart.table,
      config: {
        xAxis: chart.xAxis,
        yAxis: chart.yAxis,
        chartType: chart.chartType // Store actual chart type (bar, line, pie, area) in config
      },
      offset: 0,
      limit: 10
    };
    
    return await apiPost('/api/visualization/charts/', payload);
  };

  // Function to fetch all saved charts
  const fetchSavedCharts = async () => {
    const response = await apiGet('/api/visualization/charts/');
    return response;
  };

  // Function to update a chart
  const updateChart = async (chartId: number, chartData: CreatedChart & { chartType: string; chartLibraryType: string }) => {
    const payload = {
      title: chartData.chartName,
      description: chartData.chartDescription,
      chart_type: chartData.chartLibraryType,
      schema_name: chartData.schema,
      table: chartData.table,
      config: {
        xAxis: chartData.xAxis,
        yAxis: chartData.yAxis,
        chartType: chartData.chartType
      },
      offset: 0,
      limit: 10
    };
    
    return await apiPut(`/api/visualization/charts/${chartId}/`, payload);
  };

  // Function to delete a chart
  const deleteChart = async (chartId: number) => {
    await apiDelete(`/api/visualization/charts/${chartId}/`);
  };

  // Load saved charts on component mount
  useEffect(() => {
    loadSavedCharts();
  }, []);

  const loadSavedCharts = async () => {
    setSavedChartsLoading(true);
    setSavedChartsError(null);
    try {
      const charts = await fetchSavedCharts();
      setSavedCharts(charts);
    } catch (error) {
      setSavedChartsError(error instanceof Error ? error.message : 'Failed to load saved charts');
    } finally {
      setSavedChartsLoading(false);
    }
  };

  // Handle chart save from forms
  const handleEchartsChartSave = async (chartData: CreatedChart & { chartType: string }) => {
    try {
      await saveChart({ ...chartData, chartLibraryType: 'echarts' });
      await loadSavedCharts(); // Refresh the saved charts list
    } catch (error) {
      throw error; // Let the form handle the error display
    }
  };

  const handleNivoChartSave = async (chartData: CreatedChart & { chartType: string }) => {
    try {
      await saveChart({ ...chartData, chartLibraryType: 'nivo' });
      await loadSavedCharts(); // Refresh the saved charts list
    } catch (error) {
      throw error; // Let the form handle the error display
    }
  };


  // Handle editing charts
  const handleEditChart = (chart: SavedChart) => {
    setEditingChart(chart);
    setEditFormOpen(true);
  };

  // Handle updating charts
  const handleUpdateChart = async (chartId: number, chartData: CreatedChart & { chartType: string }) => {
    try {
      await updateChart(chartId, { ...chartData, chartLibraryType: editingChart?.chart_type || 'echarts' });
      await loadSavedCharts(); // Refresh the saved charts list
    } catch (error) {
      throw error; // Let the form handle the error display
    }
  };

  // Handle deleting charts
  const handleDeleteChart = async (chartId: number) => {
    try {
      await deleteChart(chartId);
      await loadSavedCharts(); // Refresh the saved charts list
    } catch (error) {
      console.error('Failed to delete chart:', error);
    }
  };

  // Chart card component - responsive design
  const ChartCard = ({ chart, onEdit, onDelete }: { chart: SavedChart; onEdit: () => void; onDelete: () => void }) => (
    <div 
      className="group border rounded-xl bg-card text-card-foreground shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={onEdit}
    >
      {/* Thumbnail Container - Fixed Aspect Ratio */}
      <div className="relative w-full aspect-[16/9] bg-muted/30 border-b">
        <SavedChartThumbnail 
          chart={chart} 
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />
        
        {/* Chart Type Badge */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white/90 backdrop-blur-sm text-gray-700 border">
            {chart.config.chartType}
          </span>
        </div>
        
        {/* Delete Button */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button 
            variant="secondary" 
            size="sm"
            className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm hover:bg-red-50 hover:text-red-600 shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            🗑️
          </Button>
        </div>
      </div>
      
      {/* Chart Info */}
      <div className="p-4 space-y-3">
        {/* Title and Description */}
        <div>
          <h4 className="font-semibold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
            {chart.title}
          </h4>
          {chart.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
              {chart.description}
            </p>
          )}
        </div>
        
        {/* Metadata */}
        <div className="space-y-2">
          {/* Library Badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary">
              {chart.chart_type}
            </span>
          </div>
          
          {/* Data Source Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-blue-500">🗃️</span>
              <span className="font-mono bg-muted/50 px-1.5 py-0.5 rounded text-xs">
                {chart.schema_name}.{chart.table}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-green-500">📈</span>
              <span>{chart.config.xAxis} → {chart.config.yAxis}</span>
            </div>
          </div>
        </div>
        
        {/* Action Hint */}
        <div className="pt-2 border-t border-border/50">
          <div className="text-xs text-primary font-medium opacity-70 group-hover:opacity-100 transition-opacity duration-200">
            Click to edit or view full chart
          </div>
        </div>
      </div>
    </div>
  );

  // Empty state component - simplified
  const EmptyState = ({ libraryName, icon }: { libraryName: string; icon: string }) => (
    <div className="text-center py-12">
      <div className="text-4xl mb-4 opacity-50">{icon}</div>
      <h3 className="text-lg font-medium text-muted-foreground mb-2">No {libraryName} charts yet</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Start creating charts with {libraryName}. Click "Create New Chart" to get started.
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Static Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
            <p className="text-muted-foreground">Create beautiful, interactive charts with multiple libraries</p>
          </div>
          <Button onClick={() => {
            if (activeTab === "echarts") setEchartsFormOpen(true);
            else if (activeTab === "nivo") setNivoFormOpen(true);
          }}>
            Create New Chart
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab List */}
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="echarts" className="text-sm">⚡ ECharts</TabsTrigger>
            <TabsTrigger value="nivo" className="text-sm">🎨 Nivo</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          {/* ECharts Tab */}
          <TabsContent value="echarts" className="h-full m-0 p-6 space-y-6">
              
            {/* Saved Charts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Saved ECharts</h3>
                <span className="text-sm text-muted-foreground">
                  {savedCharts.filter(chart => chart.chart_type === 'echarts').length} charts
                </span>
              </div>
              
              {savedChartsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm text-muted-foreground">Loading charts...</div>
                </div>
              )}
              
              {savedChartsError && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {savedChartsError}
                </div>
              )}
              
              {savedCharts.filter(chart => chart.chart_type === 'echarts').length === 0 && !savedChartsLoading && (
                <EmptyState libraryName="ECharts" icon="⚡" />
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedCharts
                  .filter(chart => chart.chart_type === 'echarts')
                  .map((chart) => (
                    <ChartCard
                      key={chart.id}
                      chart={chart}
                      onEdit={() => handleEditChart(chart)}
                      onDelete={() => handleDeleteChart(chart.id)}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>
        
          {/* Nivo Tab */}
          <TabsContent value="nivo" className="h-full m-0 p-6 space-y-6">
            
            {/* Saved Charts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Saved Nivo Charts</h3>
                <span className="text-sm text-muted-foreground">
                  {savedCharts.filter(chart => chart.chart_type === 'nivo').length} charts
                </span>
              </div>
              
              {savedChartsLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm text-muted-foreground">Loading charts...</div>
                </div>
              )}
              
              {savedChartsError && (
                <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-lg text-sm">
                  {savedChartsError}
                </div>
              )}
              
              {savedCharts.filter(chart => chart.chart_type === 'nivo').length === 0 && !savedChartsLoading && (
                <EmptyState libraryName="Nivo" icon="🎨" />
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {savedCharts
                  .filter(chart => chart.chart_type === 'nivo')
                  .map((chart) => (
                    <ChartCard
                      key={chart.id}
                      chart={chart}
                      onEdit={() => handleEditChart(chart)}
                      onDelete={() => handleDeleteChart(chart.id)}
                    />
                  ))}
              </div>
            </div>
          </TabsContent>
      
        </Tabs>
      </div>

      {/* Chart Forms */}
      <ChartForm
        open={echartsFormOpen}
        onOpenChange={setEchartsFormOpen}
        onSave={handleEchartsChartSave}
        title="Create EChart"
        chartLibraryType="echarts"
      />
      
      <ChartForm
        open={nivoFormOpen}
        onOpenChange={setNivoFormOpen}
        onSave={handleNivoChartSave}
        title="Create Nivo Chart"
        chartLibraryType="nivo"
      />
      {/* Edit Chart Form */}
      <ChartForm
        open={editFormOpen}
        onOpenChange={(open) => {
          setEditFormOpen(open);
          if (!open) {
            setEditingChart(null);
          }
        }}
        onSave={() => {}} // Not used in edit mode
        onUpdate={handleUpdateChart}
        onDelete={handleDeleteChart}
        title={`${editingChart?.chart_type.charAt(0).toUpperCase() + editingChart?.chart_type.slice(1)} Chart` || 'Chart'}
        chartLibraryType={(editingChart?.chart_type as "echarts" | "nivo" | "recharts") || 'echarts'}
        editChart={editingChart}
      />
    </div>
  );
} 