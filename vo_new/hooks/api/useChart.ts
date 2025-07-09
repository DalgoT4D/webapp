import useSWR from 'swr'
import useSWRMutation from 'swr/mutation'
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api'

// Types
export interface Column {
  name: string
  data_type: string
}

export interface ChartData {
  chart_config: any; // The ECharts configuration from backend
}

export interface GenerateChartPayload {
  chart_type: string
  computation_type?: 'raw' | 'aggregated'
  schema_name: string
  table_name: string
  xaxis?: string
  yaxis?: string
  offset?: number
  limit?: number
  dimensions?: string | string[]
  aggregate_col?: string
  aggregate_func?: string
}

export interface SaveChartPayload {
  title: string
  description: string
  chart_type: string
  schema_name: string
  table: string
  config: {
    chartType: string
    computation_type: 'raw' | 'aggregated'
    xAxis?: string
    yAxis?: string
    dimensions?: string | string[]
    aggregate_col?: string
    aggregate_func?: string
  }
}

export interface Chart {
  id: number
  title: string
  description: string
  chart_type: string
  schema_name: string
  table: string
  config: {
    chartType: string
    mode?: 'raw' | 'aggregated'
    xAxis?: string
    yAxis?: string
    dimensions?: string | string[]
    aggregate_col?: string
    aggregate_func?: string
  }
}

// Data fetching hooks
export function useSchemas() {
  return useSWR<string[]>('/api/warehouse/schemas', apiGet, {
    revalidateOnMount: true,
  })
}

export function useTables(schema: string | null) {
  return useSWR<string[]>(
    schema ? `/api/warehouse/tables/${schema}` : null,
    apiGet,
    {
      revalidateOnMount: true,
    }
  )
}

export function useColumns(schema: string | null, table: string | null) {
  return useSWR<Column[]>(
    schema && table ? `/api/warehouse/table_columns/${schema}/${table}` : null,
    apiGet,
    {
      revalidateOnMount: true,
    }
  )
}

export function useCharts() {
  return useSWR<Chart[]>('/api/visualization/charts', apiGet)
}

export function useChart(id: number | null) {
  return useSWR<Chart>(
    id ? `/api/visualization/charts/${id}` : null,
    apiGet
  )
}

// Mutation hooks
// Commenting out as it's currently unused
/*export function useChartGeneration() {
  return useSWRMutation(
    '/api/visualization/generate_chart/',
    async (url: string, { arg }: { arg: GenerateChartPayload }) => {
      const response = await apiPost(url, arg)
      return response
    }
  )
}*/

export function useChartSave() {
  return useSWRMutation(
    '/api/visualization/charts',
    async (url: string, { arg }: { arg: SaveChartPayload }) => {
      const response = await apiPost(url, arg)
      return response
    }
  )
}

export function useChartUpdate() {
  return useSWRMutation(
    '/api/visualization/charts',
    async (url: string, { arg }: { arg: { id: number } & Partial<SaveChartPayload> }) => {
      const { id, ...updateData } = arg
      const response = await apiPut(`${url}/${id}`, updateData)
      return response
    }
  )
}

export function useChartDelete() {
  return useSWRMutation(
    '/api/visualization/charts',
    async (url: string, { arg }: { arg: { id: number } }) => {
      await apiDelete(`${url}/${arg.id}`)
      return { success: true }
    }
  )
}

// Helper hook for chart data with caching
export function useChartData(
  payload: GenerateChartPayload | null,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options
  
  const cacheKey = payload && enabled 
    ? `chart-data-${JSON.stringify(payload)}` 
    : null

  return useSWR<ChartData>(
    cacheKey,
    async () => {
      if (!payload) throw new Error('No payload provided')
      
      try {
        const response = await apiPost('/api/visualization/charts/generate/', payload)
        
        if (!response.chart_config) {
          throw new Error('No chart configuration received from server')
        }
        
        return {
          chart_config: response.chart_config
        }
      } catch (error) {
        console.error('Chart data fetch error:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes aggressive caching
      shouldRetryOnError: false,
    }
  )
} 