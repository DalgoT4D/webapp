"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MainLayout } from "@/components/main-layout";
import { apiGet, apiPost, apiDelete } from "@/lib/api";

// Import chart components
import ChartForm from "@/components/charts/ChartForm";

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

  // Handle deleting charts
  const handleDeleteChart = async (chartId: number) => {
    try {
      await deleteChart(chartId);
      await loadSavedCharts(); // Refresh the saved charts list
    } catch (error) {
      console.error('Failed to delete chart:', error);
    }
  };

  return (
    <MainLayout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Charts</h1>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="echarts">ECharts</TabsTrigger>
            <TabsTrigger value="nivo">Nivo</TabsTrigger>
            <TabsTrigger value="recharts">Recharts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="echarts" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">ECharts</h2>
                <Button onClick={() => setEchartsFormOpen(true)}>Create New Chart</Button>
              </div>
              
              {/* Saved Charts Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Saved ECharts</h3>
                {savedChartsLoading && (
                  <div className="text-muted-foreground">Loading saved charts...</div>
                )}
                
                {savedChartsError && (
                  <div className="text-red-500">{savedChartsError}</div>
                )}
                
                {savedCharts.filter(chart => chart.chart_type === 'echarts').length === 0 && !savedChartsLoading && (
                  <div className="text-muted-foreground">No saved ECharts yet. Click "Create New Chart" to get started.</div>
                )}
                
                <div className="grid gap-4">
                  {savedCharts
                    .filter(chart => chart.chart_type === 'echarts')
                    .map((chart) => (
                      <div key={chart.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{chart.title}</h4>
                            <p className="text-sm text-muted-foreground">{chart.description}</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteChart(chart.id)}
                          >
                            Delete
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Schema: {chart.schema_name} | Table: {chart.table} | 
                          X: {chart.config.xAxis} | Y: {chart.config.yAxis} | Library: {chart.chart_type} | Chart: {chart.config.chartType}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="nivo" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Nivo Charts</h2>
                <Button onClick={() => setNivoFormOpen(true)}>Create New Chart</Button>
              </div>
              
              {/* Saved Charts Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Saved Nivo Charts</h3>
                {savedChartsLoading && (
                  <div className="text-muted-foreground">Loading saved charts...</div>
                )}
                
                {savedChartsError && (
                  <div className="text-red-500">{savedChartsError}</div>
                )}
                
                {savedCharts.filter(chart => chart.chart_type === 'nivo').length === 0 && !savedChartsLoading && (
                  <div className="text-muted-foreground">No saved Nivo charts yet. Click "Create New Chart" to get started.</div>
                )}
                
                <div className="grid gap-4">
                  {savedCharts
                    .filter(chart => chart.chart_type === 'nivo')
                    .map((chart) => (
                      <div key={chart.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{chart.title}</h4>
                            <p className="text-sm text-muted-foreground">{chart.description}</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteChart(chart.id)}
                          >
                            Delete
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Schema: {chart.schema_name} | Table: {chart.table} | 
                          X: {chart.config.xAxis} | Y: {chart.config.yAxis} | Library: {chart.chart_type} | Chart: {chart.config.chartType}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="recharts" className="mt-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Recharts</h2>
                <Button onClick={() => setRechartsFormOpen(true)}>Create New Chart</Button>
              </div>
              
              {/* Saved Charts Section */}
              <div>
                <h3 className="text-lg font-medium mb-4">Saved Recharts</h3>
                {savedChartsLoading && (
                  <div className="text-muted-foreground">Loading saved charts...</div>
                )}
                
                {savedChartsError && (
                  <div className="text-red-500">{savedChartsError}</div>
                )}
                
                {savedCharts.filter(chart => chart.chart_type === 'recharts').length === 0 && !savedChartsLoading && (
                  <div className="text-muted-foreground">No saved Recharts yet. Click "Create New Chart" to get started.</div>
                )}
                
                <div className="grid gap-4">
                  {savedCharts
                    .filter(chart => chart.chart_type === 'recharts')
                    .map((chart) => (
                      <div key={chart.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{chart.title}</h4>
                            <p className="text-sm text-muted-foreground">{chart.description}</p>
                          </div>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleDeleteChart(chart.id)}
                          >
                            Delete
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Schema: {chart.schema_name} | Table: {chart.table} | 
                          X: {chart.config.xAxis} | Y: {chart.config.yAxis} | Library: {chart.chart_type} | Chart: {chart.config.chartType}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

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
      </div>
    </MainLayout>
  );
} 