"use client";

import React, { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// SWR Hooks
import { 
  useSchemas, 
  useTables, 
  useColumns, 
  useChartGeneration,
  useChartSave,
  useChartUpdate,
  useChartDelete,
  useChartData,
  type Column,
  type GenerateChartPayload,
  type SaveChartPayload 
} from '@/hooks/api/useChart'

// Chart Components
import EChartsComponent from "./EChartsComponent";
import NivoComponent from "./NivoComponent";
import RechartsComponent from "./RechartsComponent";

// Chart Utilities
import { 
  getSupportedChartTypes, 
  validateChartData, 
  getRecommendedChartType,
  generateChartTitleSuggestions,
  CHART_TYPE_CONFIGS
} from "./chartUtils";

// Form data interface
interface ChartFormData {
  schema: string;
  table: string;
  xAxis: string;
  yAxis: string;
  chartName: string;
  chartDescription: string;
  chartType: string;
  dataLimit: string;
}

interface EditChart {
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
}

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
  onUpdate?: (chartId: number, chartData: {
    schema: string;
    table: string;
    xAxis: string;
    yAxis: string;
    chartName: string;
    chartDescription: string;
    chartType: string;
  }) => void;
  onDelete?: (chartId: number) => void;
  title: string;
  chartLibraryType: 'echarts' | 'nivo' | 'recharts';
  editChart?: EditChart | null;
}

export default function ChartForm({ 
  open, 
  onOpenChange, 
  onSave, 
  onUpdate,
  onDelete,
  title, 
  chartLibraryType,
  editChart 
}: ChartFormProps) {
  
  // React Hook Form setup
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    reset: resetForm,
    formState: { errors, isValid } 
  } = useForm<ChartFormData>({
    defaultValues: {
      schema: '',
      table: '',
      xAxis: '',
      yAxis: '',
      chartName: '',
      chartDescription: '',
      chartType: 'bar',
      dataLimit: '10'
    },
    mode: 'onChange'
  })
  
  // Watch form fields for reactive updates
  const watchedSchema = watch('schema')
  const watchedTable = watch('table')
  const watchedXAxis = watch('xAxis')
  const watchedYAxis = watch('yAxis')
  const watchedChartType = watch('chartType')
  const watchedDataLimit = watch('dataLimit')
  const watchedChartName = watch('chartName')
  
  // SWR hooks for data fetching
  const { data: schemas, isLoading: schemasLoading, error: schemasError } = useSchemas()
  const { data: tables, isLoading: tablesLoading, error: tablesError } = useTables(watchedSchema)
  const { data: columns, isLoading: columnsLoading, error: columnsError } = useColumns(watchedSchema, watchedTable)
  
  // SWR mutations
  const { trigger: generateChart, isMutating: isGenerating, error: generateError } = useChartGeneration()
  const { trigger: saveChart, isMutating: isSaving } = useChartSave()
  const { trigger: updateChart, isMutating: isUpdating } = useChartUpdate()
  const { trigger: deleteChart, isMutating: isDeleting } = useChartDelete()
  
  // Chart data generation payload
  const chartPayload = useMemo((): GenerateChartPayload | null => {
    if (!watchedSchema || !watchedTable || !watchedXAxis || !watchedYAxis || !watchedChartName) {
      return null
    }
    
    return {
      chart_type: watchedChartType,
      schema_name: watchedSchema,
      table_name: watchedTable,
      xaxis_col: watchedXAxis,
      yaxis_col: watchedYAxis,
      offset: 0,
      limit: parseInt(watchedDataLimit) || 10
    }
  }, [watchedSchema, watchedTable, watchedXAxis, watchedYAxis, watchedChartType, watchedDataLimit, watchedChartName])
  
  // Chart data with SWR caching
  const { data: chartData, error: chartDataError, isLoading: isChartDataLoading } = useChartData(
    chartPayload,
    { enabled: Boolean(chartPayload) }
  )
  
  // Initialize form with edit data
  useEffect(() => {
    if (open && editChart) {
      resetForm({
        schema: editChart.schema_name,
        table: editChart.table,
        xAxis: editChart.config.xAxis,
        yAxis: editChart.config.yAxis,
        chartName: editChart.title,
        chartDescription: editChart.description,
        chartType: editChart.config.chartType,
        dataLimit: '10'
      })
    } else if (open && !editChart) {
      resetForm()
    }
  }, [open, editChart, resetForm])
  
  // Auto-suggest chart titles
  useEffect(() => {
    if (watchedXAxis && watchedYAxis && watchedChartType && !watchedChartName && !editChart) {
      const suggestions = generateChartTitleSuggestions(watchedXAxis, watchedYAxis, watchedChartType)
      if (suggestions.length > 0) {
        setValue('chartName', suggestions[0])
      }
    }
  }, [watchedXAxis, watchedYAxis, watchedChartType, watchedChartName, editChart, setValue])
  
  // Chart validation
  const chartValidation = useMemo(() => {
    if (!chartData || !watchedChartType) return null
    
    const validation = validateChartData(chartData, watchedChartType)
    const recommendedType = getRecommendedChartType(chartData, chartLibraryType)
    const suggestions = generateChartTitleSuggestions(watchedXAxis, watchedYAxis, watchedChartType)
    
    return {
      isValid: validation.isValid,
      errors: validation.errors,
      recommendations: validation.isValid ? [] : [
        `Recommended chart type: ${CHART_TYPE_CONFIGS[recommendedType]?.name || recommendedType}`,
        ...suggestions.slice(0, 2).map(s => `Suggested title: "${s}"`)
      ]
    }
  }, [chartData, watchedChartType, chartLibraryType, watchedXAxis, watchedYAxis])
  
  // Manual chart generation (for refresh button)
  const handleGenerateChart = async (data: ChartFormData) => {
    if (!chartPayload) return
    
    try {
      await generateChart(chartPayload)
    } catch (error) {
      console.error('Chart generation failed:', error)
    }
  }
  
  // Save chart function
  const handleSaveChart = async () => {
    if (!chartPayload || !chartData) return
    
    try {
      const formData = watch()
      const savePayload: SaveChartPayload = {
        title: formData.chartName,
        description: formData.chartDescription,
        chart_type: chartLibraryType,
        schema_name: formData.schema,
        table: formData.table,
        config: {
          xAxis: formData.xAxis,
          yAxis: formData.yAxis,
          chartType: formData.chartType
        }
      }
      
      if (editChart && onUpdate) {
        await updateChart({ id: editChart.id, ...savePayload })
        onUpdate(editChart.id, {
          schema: formData.schema,
          table: formData.table,
          xAxis: formData.xAxis,
          yAxis: formData.yAxis,
          chartName: formData.chartName,
          chartDescription: formData.chartDescription,
          chartType: formData.chartType
        })
      } else {
        await saveChart(savePayload)
        onSave({
          schema: formData.schema,
          table: formData.table,
          xAxis: formData.xAxis,
          yAxis: formData.yAxis,
          chartName: formData.chartName,
          chartDescription: formData.chartDescription,
          chartType: formData.chartType
        })
      }
      
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save chart:', error)
    }
  }
  
  // Delete chart function
  const handleDeleteChart = async () => {
    if (!editChart || !onDelete) return
    
    try {
      await deleteChart({ id: editChart.id })
      onDelete(editChart.id)
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to delete chart:', error)
    }
  }
  
  // Filtered tables for search
  const [tableSearch, setTableSearch] = React.useState('')
  const filteredTables = useMemo(() => {
    if (!tables) return []
    return tables.filter(table => 
      table.toLowerCase().includes(tableSearch.toLowerCase())
    )
  }, [tables, tableSearch])
  
  const isLoading = isSaving || isUpdating || isDeleting
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:w-[80vw] sm:max-w-[80vw] lg:w-[80vw] lg:max-w-[80vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editChart ? `Edit ${title}` : title}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit(handleGenerateChart)} className="space-y-4">
              
              {/* Schema Picker */}
              <div>
                <label className="block mb-1 font-medium">Pick a Schema</label>
                <Select 
                  value={watchedSchema} 
                  onValueChange={(value) => setValue('schema', value)}
                  disabled={schemasLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={schemasLoading ? "Loading schemas..." : "Select a schema"} />
                  </SelectTrigger>
                  <SelectContent>
                    {schemasError && <div className="px-3 py-2 text-red-500">{schemasError.message}</div>}
                    {schemas?.map((schema) => (
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
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="mb-2"
                  disabled={!watchedSchema || tablesLoading}
                />
                <Select 
                  value={watchedTable} 
                  onValueChange={(value) => setValue('table', value)}
                  disabled={!watchedSchema || tablesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={tablesLoading ? "Loading tables..." : "Select a table"} />
                  </SelectTrigger>
                  <SelectContent>
                    {tablesError && <div className="px-3 py-2 text-red-500">{tablesError.message}</div>}
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
              
              {/* Column Pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium">X-Axis</label>
                  <Select 
                    value={watchedXAxis} 
                    onValueChange={(value) => setValue('xAxis', value)}
                    disabled={!watchedTable || columnsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={columnsLoading ? "Loading..." : "X-Axis"} />
                    </SelectTrigger>
                    <SelectContent>
                      {columnsError && <div className="px-3 py-2 text-red-500">{columnsError.message}</div>}
                      {columns?.map((column) => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name} ({column.data_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block mb-1 font-medium">Y-Axis</label>
                  <Select 
                    value={watchedYAxis} 
                    onValueChange={(value) => setValue('yAxis', value)}
                    disabled={!watchedTable || columnsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={columnsLoading ? "Loading..." : "Y-Axis"} />
                    </SelectTrigger>
                    <SelectContent>
                      {columnsError && <div className="px-3 py-2 text-red-500">{columnsError.message}</div>}
                      {columns?.map((column) => (
                        <SelectItem key={column.name} value={column.name}>
                          {column.name} ({column.data_type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Chart Type and Data Limit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-medium">Chart Type</label>
                  <Select 
                    value={watchedChartType} 
                    onValueChange={(value) => setValue('chartType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chart Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getSupportedChartTypes(chartLibraryType).map((type) => {
                        const config = CHART_TYPE_CONFIGS[type]
                        return (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center gap-2">
                              <span>{config.icon}</span>
                              <div>
                                <div>{config.name}</div>
                                <div className="text-xs text-muted-foreground">{config.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                {chartLibraryType === 'echarts' && (
                  <div>
                    <label className="block mb-1 font-medium">Data Limit</label>
                    <Select 
                      value={watchedDataLimit} 
                      onValueChange={(value) => setValue('dataLimit', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="10" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 records</SelectItem>
                        <SelectItem value="10">10 records</SelectItem>
                        <SelectItem value="25">25 records</SelectItem>
                        <SelectItem value="50">50 records</SelectItem>
                        <SelectItem value="100">100 records</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              {/* Chart Details */}
              <div>
                <label className="block mb-1 font-medium">Chart Name</label>
                <Input
                  {...register('chartName', { required: 'Chart name is required' })}
                  placeholder="Enter chart name"
                />
                {errors.chartName && (
                  <span className="text-red-500 text-sm">{errors.chartName.message}</span>
                )}
              </div>
              
              <div>
                <label className="block mb-1 font-medium">Chart Description</label>
                <Textarea
                  {...register('chartDescription')}
                  placeholder="Enter chart description (optional)"
                  className="min-h-[60px]"
                />
              </div>
              
              {/* Validation Messages */}
              {chartValidation && !chartValidation.isValid && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-yellow-800 mb-1">⚠️ Chart Recommendations</div>
                  {chartValidation.errors.length > 0 && (
                    <div className="text-xs text-yellow-700 mb-2">
                      Issues: {chartValidation.errors.join(', ')}
                    </div>
                  )}
                  {chartValidation.recommendations && (
                    <div className="text-xs text-yellow-700">
                      {chartValidation.recommendations.map((rec, index) => (
                        <div key={index}>• {rec}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {chartValidation && chartValidation.isValid && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800">✅ Chart configuration looks good!</div>
                </div>
              )}
              
              {/* Generate Button */}
              <Button 
                type="button" 
                onClick={() => window.location.reload()} // Force refresh for SWR
                className="w-full" 
                disabled={!isValid || isChartDataLoading}
                variant="outline"
              >
                {isChartDataLoading ? 'Refreshing...' : 'Refresh Chart'}
              </Button>
              
              {generateError && (
                <div className="text-red-500 text-sm">{generateError.message}</div>
              )}
              
              {chartDataError && (
                <div className="text-red-500 text-sm">{chartDataError.message}</div>
              )}
              
            </form>
          </div>
          
          {/* Chart Preview Section */}
          <div className="lg:col-span-7 lg:border-l lg:pl-6">
            <h3 className="text-lg font-medium mb-4">Chart Preview</h3>
            
            {isChartDataLoading && (
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <div className="text-muted-foreground">Generating chart...</div>
              </div>
            )}
            
            {(chartDataError || generateError) && (
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg">
                <div className="text-red-500">Error generating chart</div>
              </div>
            )}
            
            {!chartData && !isChartDataLoading && !chartDataError && !generateError && (
              <div className="flex items-center justify-center h-64 bg-muted/50 rounded-lg border-2 border-dashed">
                <div className="text-center text-muted-foreground">
                  <p>Fill out the form to see chart preview</p>
                  <p className="text-sm">Chart will generate automatically</p>
                </div>
              </div>
            )}
            
            {chartData && !isChartDataLoading && (
              <div className="space-y-4">
                {chartLibraryType === 'echarts' && (
                  <EChartsComponent
                    data={chartData}
                    chartName={watchedChartName}
                    chartDescription={watch('chartDescription')}
                    xAxisLabel={watchedXAxis}
                    yAxisLabel={watchedYAxis}
                    chartType={watchedChartType}
                  />
                )}
                
                {chartLibraryType === 'nivo' && (
                  <NivoComponent
                    data={chartData}
                    chartName={watchedChartName}
                    chartDescription={watch('chartDescription')}
                    xAxisLabel={watchedXAxis}
                    yAxisLabel={watchedYAxis}
                    chartType={watchedChartType}
                  />
                )}
                
                {chartLibraryType === 'recharts' && (
                  <RechartsComponent
                    data={chartData}
                    chartName={watchedChartName}
                    chartDescription={watch('chartDescription')}
                    xAxisLabel={watchedXAxis}
                    yAxisLabel={watchedYAxis}
                    chartType={watchedChartType}
                  />
                )}
                
                <div className="flex gap-2">
                  <Button 
                    onClick={handleSaveChart}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (editChart ? 'Updating...' : 'Saving...') : (editChart ? 'Update Chart' : 'Save Chart')}
                  </Button>
                  {editChart && onDelete && (
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteChart}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => {
                      resetForm()
                      onOpenChange(false)
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 