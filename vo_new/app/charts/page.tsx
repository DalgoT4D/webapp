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
  const [rechartsFormOpen, setRechartsFormOpen] = useState(false);

  // Edit mode states
  const [editingChart, setEditingChart] = useState<SavedChart | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);

  // Saved charts states
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [savedChartsLoading, setSavedChartsLoading] = useState(false);
  const [savedChartsError, setSavedChartsError] = useState<string | null>(null);

  // Function to generate chart data from backend
  const generateChartData = async (chart: CreatedChart) => {
    const payload = {
      schema: chart.schema,
      table: chart.table,
      x_axis: chart.xAxis,
      y_axis: chart.yAxis,
      chart_name: chart.chartName,
      chart_description: chart.chartDescription
    };
    
    const responseData = await apiPost('/api/visualization/generate_chart/', payload);
    
    // Transform the backend response to the expected format
    const xAxisData = responseData.data?.xaxis_data?.[chart.xAxis] || [];
    const yAxisData = responseData.data?.yaxis_data?.[chart.yAxis] || [];
    
    // Validate that we have both x and y axis data
    if (!xAxisData.length || !yAxisData.length) {
      throw new Error(`No data found for selected columns. X-axis: ${xAxisData.length} items, Y-axis: ${yAxisData.length} items`);
    }
    
    // Ensure both arrays have the same length
    const minLength = Math.min(xAxisData.length, yAxisData.length);
    
    return {
      'x-axis': xAxisData.slice(0, minLength),
      'y-axis': yAxisData.slice(0, minLength)
    };
  };

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

  const handleRechartsChartSave = async (chartData: CreatedChart & { chartType: string }) => {
    try {
      await saveChart({ ...chartData, chartLibraryType: 'recharts' });
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

  // Chart card component - simplified design
  const ChartCard = ({ chart, onEdit, onDelete }: { chart: SavedChart; onEdit: () => void; onDelete: () => void }) => (
    <div 
      className="border rounded-lg bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={onEdit}
    >
      {/* Thumbnail */}
      <div className="p-3 border-b">
        <SavedChartThumbnail chart={chart} width={280} height={160} />
      </div>
      
      {/* Chart Info */}
      <div className="p-4">
        <div className="flex justify-between items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{chart.title}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{chart.description}</p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            🗑️
          </Button>
        </div>
        
        {/* Metadata */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-primary/10 text-primary">
              {chart.config.chartType}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-muted text-muted-foreground">
              {chart.chart_type}
            </span>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <div>📊 {chart.schema_name}.{chart.table}</div>
            <div>📈 {chart.config.xAxis} → {chart.config.yAxis}</div>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t">
          <div className="text-xs text-primary">
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Charts</h1>
          <p className="text-muted-foreground">Create beautiful, interactive charts with multiple libraries</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab List */}
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="echarts" className="text-sm">⚡ ECharts</TabsTrigger>
            <TabsTrigger value="nivo" className="text-sm">🎨 Nivo</TabsTrigger>
            <TabsTrigger value="recharts" className="text-sm">📈 Recharts</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
          {/* ECharts Tab */}
          <TabsContent value="echarts" className="h-full m-0 p-6 space-y-6">
            {/* Tab Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 p-4 border rounded-lg bg-card">
              <div>
                <h2 className="text-xl font-semibold">ECharts</h2>
                <p className="text-sm text-muted-foreground">High-performance, interactive charts</p>
              </div>
              <Button onClick={() => setEchartsFormOpen(true)}>
                Create New Chart
              </Button>
            </div>
              
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
            {/* Tab Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 p-4 border rounded-lg bg-card">
              <div>
                <h2 className="text-xl font-semibold">Nivo Charts</h2>
                <p className="text-sm text-muted-foreground">Beautiful, responsive charts with modern design</p>
              </div>
              <Button onClick={() => setNivoFormOpen(true)}>
                Create New Chart
              </Button>
            </div>
            
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        
          {/* Recharts Tab */}
          <TabsContent value="recharts" className="h-full m-0 p-6 space-y-6">
            {/* Tab Header */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 p-4 border rounded-lg bg-card">
              <div>
                <h2 className="text-xl font-semibold">Recharts</h2>
                <p className="text-sm text-muted-foreground">Composable charting library built on React components</p>
              </div>
              <Button onClick={() => setRechartsFormOpen(true)}>
                Create New Chart
              </Button>
            </div>
            
            {/* Saved Charts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Saved Recharts</h3>
                <span className="text-sm text-muted-foreground">
                  {savedCharts.filter(chart => chart.chart_type === 'recharts').length} charts
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
              
              {savedCharts.filter(chart => chart.chart_type === 'recharts').length === 0 && !savedChartsLoading && (
                <EmptyState libraryName="Recharts" icon="📈" />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedCharts
                  .filter(chart => chart.chart_type === 'recharts')
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
      
      <ChartForm
        open={rechartsFormOpen}
        onOpenChange={setRechartsFormOpen}
        onSave={handleRechartsChartSave}
        title="Create Recharts Chart"
        chartLibraryType="recharts"
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