"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiPost } from "@/lib/api";

// Import chart components
import EChartsComponent from "./EChartsComponent";
import NivoComponent from "./NivoComponent";
import RechartsComponent from "./RechartsComponent";

interface ChartFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (chartData: {
    schema: string;
    table: string;
    xAxis: string;
    yAxis: string;
    chartName: string;
    chartDescription: string;
    chartType: string;
  }) => void;
  title: string;
  chartLibraryType: string; // echarts, nivo, recharts
}

export default function ChartForm({ open, onOpenChange, onSave, title, chartLibraryType }: ChartFormProps) {
  const [schemas, setSchemas] = useState<string[]>([]);
  const [schemasLoading, setSchemasLoading] = useState(false);
  const [schemasError, setSchemasError] = useState<string | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string | null>(null);

  const [tables, setTables] = useState<string[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [tablesError, setTablesError] = useState<string | null>(null);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const [columns, setColumns] = useState<{ name: string; data_type: string }[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [columnsError, setColumnsError] = useState<string | null>(null);
  const [xAxis, setXAxis] = useState<string | null>(null);
  const [yAxis, setYAxis] = useState<string | null>(null);

  const [chartName, setChartName] = useState("");
  const [chartDescription, setChartDescription] = useState("");
  const [chartType, setChartType] = useState("bar"); // Default to bar chart
  const [search, setSearch] = useState("");
  
  // Chart generation states
  const [generatedChart, setGeneratedChart] = useState<any | null>(null);
  const [chartData, setChartData] = useState<{ 'x-axis': any[]; 'y-axis': any[] } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Fetch schemas when dialog opens
  useEffect(() => {
    if (open) {
      setSchemasLoading(true);
      setSchemasError(null);
      apiGet("/api/warehouse/schemas")
        .then((data) => setSchemas(data))
        .catch((err) => setSchemasError(err.message))
        .finally(() => setSchemasLoading(false));
    }
  }, [open]);

  // Fetch tables when schema changes
  useEffect(() => {
    if (selectedSchema) {
      setTablesLoading(true);
      setTablesError(null);
      setTables([]);
      setSelectedTable(null);
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
      apiGet(`/api/warehouse/tables/${selectedSchema}`)
        .then((data) => setTables(data))
        .catch((err) => setTablesError(err.message))
        .finally(() => setTablesLoading(false));
    } else {
      setTables([]);
      setSelectedTable(null);
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
    }
  }, [selectedSchema]);

  // Fetch columns when schema and table change
  useEffect(() => {
    if (selectedSchema && selectedTable) {
      setColumnsLoading(true);
      setColumnsError(null);
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
      apiGet(`/api/warehouse/table_columns/${selectedSchema}/${selectedTable}`)
        .then((data) => setColumns(data))
        .catch((err) => setColumnsError(err.message))
        .finally(() => setColumnsLoading(false));
    } else {
      setColumns([]);
      setXAxis(null);
      setYAxis(null);
    }
  }, [selectedSchema, selectedTable]);

  function handleSchemaChange(value: string) {
    setSelectedSchema(value);
  }

  function handleTableChange(value: string) {
    setSelectedTable(value);
  }

  // Function to generate chart data
  const generateChartData = async () => {
    if (!selectedSchema || !selectedTable || !xAxis || !yAxis || !chartName) return;
    
    setGenerating(true);
    setGenerateError(null);
    
    try {
      const payload = {
        chart_type: chartType,
        schema_name: selectedSchema,
        table_name: selectedTable,
        xaxis_col: xAxis,
        yaxis_col: yAxis,
        offset: 0,
        limit: 10
      };
      
      const responseData = await apiPost('/api/visualization/generate_chart/', payload);
      
      // Transform the backend response to the expected format
      const xAxisData = responseData.data?.xaxis_data?.[xAxis] || [];
      const yAxisData = responseData.data?.yaxis_data?.[yAxis] || [];
      
      // Validate that we have both x and y axis data
      if (!xAxisData.length || !yAxisData.length) {
        throw new Error(`No data found for selected columns. X-axis: ${xAxisData.length} items, Y-axis: ${yAxisData.length} items`);
      }
      
      // Ensure both arrays have the same length
      const minLength = Math.min(xAxisData.length, yAxisData.length);
      
      const transformedData = {
        'x-axis': xAxisData.slice(0, minLength),
        'y-axis': yAxisData.slice(0, minLength)
      };
      
      setChartData(transformedData);
      setGeneratedChart({
        schema: selectedSchema,
        table: selectedTable,
        xAxis,
        yAxis,
        chartName,
        chartDescription,
        chartType
      });
    } catch (error) {
      setGenerateError(error instanceof Error ? error.message : 'Failed to generate chart');
    } finally {
      setGenerating(false);
    }
  };

  // Function to save chart
  const handleSaveChart = async () => {
    if (!generatedChart) return;
    
    setSaving(true);
    setSaveError(null);
    
    try {
      await onSave({
        ...generatedChart,
        chartType: chartType
      });
      
      // Reset form and close
      resetForm();
      onOpenChange(false);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save chart');
    } finally {
      setSaving(false);
    }
  };

  // Reset form function
  const resetForm = () => {
    setSelectedSchema(null);
    setSelectedTable(null);
    setXAxis(null);
    setYAxis(null);
    setChartName("");
    setChartDescription("");
    setChartType("bar");
    setSearch("");
    setGeneratedChart(null);
    setChartData(null);
    setGenerateError(null);
    setSaveError(null);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    generateChartData();
  }

  // Filtered tables for search
  const filteredTables = tables.filter((table) =>
    table.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1600px] max-w-none max-h-[90vh] overflow-y-auto" style={{ width: '1600px', maxWidth: 'none' }}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Schema Picker */}
          <div>
            <label className="block mb-1 font-medium">Pick a Schema</label>
            <Select value={selectedSchema || undefined} onValueChange={handleSchemaChange} disabled={schemasLoading}>
              <SelectTrigger>
                <SelectValue placeholder={schemasLoading ? "Loading schemas..." : "Select a schema"} />
              </SelectTrigger>
              <SelectContent>
                {schemasError && <div className="px-3 py-2 text-red-500">{schemasError}</div>}
                {schemas.map((schema) => (
                  <SelectItem key={schema} value={schema}>
                    {schema}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Table Picker */}
          <div>
            <label className="block mb-1 font-medium">Pick a Table</label>
            <Input
              placeholder="Search tables..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
              disabled={!selectedSchema || tablesLoading}
            />
            <Select value={selectedTable || undefined} onValueChange={handleTableChange} disabled={!selectedSchema || tablesLoading}>
              <SelectTrigger>
                <SelectValue placeholder={tablesLoading ? "Loading tables..." : "Select a table"} />
              </SelectTrigger>
              <SelectContent>
                {tablesError && <div className="px-3 py-2 text-red-500">{tablesError}</div>}
                {filteredTables.length === 0 && !tablesLoading && (
                  <div className="px-3 py-2 text-muted-foreground">No tables found</div>
                )}
                {filteredTables.map((table) => (
                  <SelectItem key={table} value={table}>
                    {table}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* X Axis Picker */}
          <div>
            <label className="block mb-1 font-medium">X Axis Column</label>
            <Select value={xAxis || undefined} onValueChange={setXAxis} disabled={!selectedTable || columnsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={columnsLoading ? "Loading columns..." : "Select x axis column"} />
              </SelectTrigger>
              <SelectContent>
                {columnsError && <div className="px-3 py-2 text-red-500">{columnsError}</div>}
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name} <span className="text-xs text-muted-foreground">({col.data_type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Y Axis Picker */}
          <div>
            <label className="block mb-1 font-medium">Y Axis Column</label>
            <Select value={yAxis || undefined} onValueChange={setYAxis} disabled={!selectedTable || columnsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={columnsLoading ? "Loading columns..." : "Select y axis column"} />
              </SelectTrigger>
              <SelectContent>
                {columnsError && <div className="px-3 py-2 text-red-500">{columnsError}</div>}
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name} <span className="text-xs text-muted-foreground">({col.data_type})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Chart Name */}
          <div>
            <label className="block mb-1 font-medium">Chart Name</label>
            <Input
              placeholder="Enter chart name"
              value={chartName}
              onChange={(e) => setChartName(e.target.value)}
            />
          </div>
          
          {/* Chart Description */}
          <div>
            <label className="block mb-1 font-medium">Chart Description</label>
            <Textarea
              placeholder="Enter chart description"
              value={chartDescription}
              onChange={(e) => setChartDescription(e.target.value)}
            />
          </div>
          
          {/* Chart Type */}
          <div>
            <label className="block mb-1 font-medium">Chart Type</label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Bar Chart</SelectItem>
                <SelectItem value="line">Line Chart</SelectItem>
                <SelectItem value="pie">Pie Chart</SelectItem>
                <SelectItem value="area">Area Chart</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-2" 
            disabled={!selectedSchema || !selectedTable || !xAxis || !yAxis || !chartName || generating}
          >
            {generating ? 'Generating...' : 'Generate Chart'}
          </Button>
          
          {generateError && (
            <div className="text-red-500 text-sm">{generateError}</div>
          )}
        </form>
      </div>
      
      {/* Chart Preview Section */}
      <div className="lg:col-span-7 lg:border-l lg:pl-6">
        <h3 className="text-lg font-medium mb-4">Chart Preview</h3>
        
        {generating && (
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-muted-foreground">Generating chart...</div>
          </div>
        )}
        
        {generateError && (
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
            <div className="text-red-500">Error generating chart</div>
          </div>
        )}
        
        {!generatedChart && !generating && !generateError && (
          <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg border-2 border-dashed">
            <div className="text-center text-muted-foreground">
              <p>Fill out the form and click "Generate Chart"</p>
              <p className="text-sm">to see preview here</p>
            </div>
          </div>
        )}
        
        {generatedChart && chartData && !generating && (
          <div className="space-y-4">
            {chartLibraryType === 'echarts' && (
              <EChartsComponent
                data={chartData}
                chartName={generatedChart.chartName}
                chartDescription={generatedChart.chartDescription}
                xAxisLabel={generatedChart.xAxis}
                yAxisLabel={generatedChart.yAxis}
              />
            )}
            
            {chartLibraryType === 'nivo' && (
              <NivoComponent
                data={chartData}
                chartName={generatedChart.chartName}
                chartDescription={generatedChart.chartDescription}
                xAxisLabel={generatedChart.xAxis}
                yAxisLabel={generatedChart.yAxis}
              />
            )}
            
            {chartLibraryType === 'recharts' && (
              <RechartsComponent
                data={chartData}
                chartName={generatedChart.chartName}
                chartDescription={generatedChart.chartDescription}
                xAxisLabel={generatedChart.xAxis}
                yAxisLabel={generatedChart.yAxis}
              />
            )}
            
            <div className="flex gap-2">
              <Button 
                onClick={handleSaveChart}
                disabled={saving}
                className="flex-1"
              >
                {saving ? 'Saving...' : 'Save Chart'}
              </Button>
              <Button 
                variant="outline"
                onClick={resetForm}
                disabled={saving}
              >
                Reset
              </Button>
            </div>
            
            {saveError && (
              <div className="text-red-500 text-sm">{saveError}</div>
            )}
          </div>
        )}
      </div>
    </div>
      </DialogContent>
    </Dialog>
  );
} 