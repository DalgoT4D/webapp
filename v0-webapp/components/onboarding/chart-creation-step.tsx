"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, ArrowLeft, BarChart3, LineChart, PieChart } from "lucide-react"
import { useOnboarding } from "./onboarding-context"
import { useRouter } from "next/navigation"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface ChartCreationStepProps {
  onNext: () => void
  onBack: () => void
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

export function ChartCreationStep({ onNext, onBack }: ChartCreationStepProps) {
  const { data, updateData } = useOnboarding()
  const router = useRouter()
  const [selectedDataset, setSelectedDataset] = useState("")
  const [chartType, setChartType] = useState("")
  const [chartTitle, setChartTitle] = useState("")
  const [xAxis, setXAxis] = useState("")
  const [yAxis, setYAxis] = useState("")

  // Get available datasets from transform step
  const availableDatasets = Object.entries(data.datasets || {}).map(([key, dataset]) => ({
    key,
    name: dataset.name,
    rowCount: dataset.data.length,
    columns: dataset.columns,
    data: dataset.data,
  }))

  const selectedDatasetInfo = availableDatasets.find((d) => d.key === selectedDataset)
  const availableColumns = selectedDatasetInfo?.columns || []

  // Prepare chart data
  const prepareChartData = () => {
    if (!selectedDatasetInfo || !xAxis || !yAxis) return []

    const rawData = selectedDatasetInfo.data

    if (chartType === "pie") {
      // For pie charts, group by X-axis and count occurrences
      const grouped = rawData.reduce((acc: any, item: any) => {
        const key = item[xAxis]
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})

      return Object.entries(grouped).map(([name, value]) => ({ name, value }))
    } else {
      // For bar and line charts, use raw data or aggregate if needed
      if (yAxis === "count") {
        // Count occurrences by X-axis
        const grouped = rawData.reduce((acc: any, item: any) => {
          const key = item[xAxis]
          acc[key] = (acc[key] || 0) + 1
          return acc
        }, {})

        return Object.entries(grouped).map(([name, value]) => ({ [xAxis]: name, [yAxis]: value }))
      } else {
        // Use first 10 rows for preview
        return rawData.slice(0, 10).map((item: any) => ({
          [xAxis]: item[xAxis],
          [yAxis]: Number.parseFloat(item[yAxis]) || 0,
        }))
      }
    }
  }

  const chartData = prepareChartData()

  const renderChart = () => {
    if (!chartType || !selectedDatasetInfo || !xAxis || !yAxis || chartData.length === 0) {
      return (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500 text-sm">Configure chart to see preview</p>
        </div>
      )
    }

    switch (chartType) {
      case "bar":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={yAxis} fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "line":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke="#0088FE" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )

      case "pie":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )

      default:
        return (
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500 text-sm">Select a chart type</p>
          </div>
        )
    }
  }

  const handleCreateChart = () => {
    const chartConfig = {
      dataset: selectedDataset,
      type: chartType,
      title: chartTitle,
      xAxis,
      yAxis,
      data: chartData,
    }

    updateData({
      chart: chartConfig,
      onboardingComplete: true,
    })

    // Clear any previous onboarding data to start fresh
    localStorage.removeItem("dashboardMetrics")
    localStorage.removeItem("dashboardAlerts")

    // Store the chart and mark as fresh onboarding
    localStorage.setItem("onboardingChart", JSON.stringify(chartConfig))
    localStorage.setItem("isOnboardingComplete", "true")

    // Redirect to the Impact at a Glance dashboard
    router.push("/dashboards/impact-at-a-glance")
  }

  const canProceed = selectedDataset && chartType && chartTitle && xAxis && yAxis

  // Add count option for Y-axis
  const yAxisOptions = [
    ...availableColumns.map((col) => ({ value: col.name, label: col.name })),
    { value: "count", label: "Count" },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center py-4">
        <h1 className="text-2xl font-bold mb-1">Create Your First Chart</h1>
        <p className="text-gray-600 text-sm">Visualize your transformed data with an interactive chart</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Chart Configuration */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chart Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dataset Selection */}
              <div className="space-y-2">
                <Label>Dataset</Label>
                <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDatasets.map((dataset) => (
                      <SelectItem key={dataset.key} value={dataset.key}>
                        {dataset.name} ({dataset.rowCount} rows)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Chart Type */}
              <div className="space-y-2">
                <Label>Chart Type</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Card
                    className={`cursor-pointer p-3 ${chartType === "bar" ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setChartType("bar")}
                  >
                    <div className="text-center">
                      <BarChart3 className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs font-medium">Bar Chart</p>
                    </div>
                  </Card>
                  <Card
                    className={`cursor-pointer p-3 ${chartType === "line" ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setChartType("line")}
                  >
                    <div className="text-center">
                      <LineChart className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs font-medium">Line Chart</p>
                    </div>
                  </Card>
                  <Card
                    className={`cursor-pointer p-3 ${chartType === "pie" ? "ring-2 ring-blue-500" : ""}`}
                    onClick={() => setChartType("pie")}
                  >
                    <div className="text-center">
                      <PieChart className="h-6 w-6 mx-auto mb-1" />
                      <p className="text-xs font-medium">Pie Chart</p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Chart Title */}
              <div className="space-y-2">
                <Label htmlFor="chart-title">Chart Title</Label>
                <Input
                  id="chart-title"
                  placeholder="Enter chart title"
                  value={chartTitle}
                  onChange={(e) => setChartTitle(e.target.value)}
                />
              </div>

              {/* X-Axis */}
              <div className="space-y-2">
                <Label>X-Axis</Label>
                <Select value={xAxis} onValueChange={setXAxis} disabled={!selectedDataset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select X-axis column" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableColumns.map((column) => (
                      <SelectItem key={column.name} value={column.name}>
                        {column.name} ({column.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Y-Axis */}
              <div className="space-y-2">
                <Label>Y-Axis</Label>
                <Select value={yAxis} onValueChange={setYAxis} disabled={!selectedDataset}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Y-axis column" />
                  </SelectTrigger>
                  <SelectContent>
                    {yAxisOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Chart Preview */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Chart Preview</CardTitle>
              {chartTitle && <p className="text-sm text-gray-600">{chartTitle}</p>}
            </CardHeader>
            <CardContent>
              {renderChart()}
              {chartData.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">
                  Showing {chartData.length} data points from {selectedDatasetInfo?.name}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0 border-t bg-white px-6 py-4">
        <div className="flex justify-between max-w-6xl mx-auto">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleCreateChart} disabled={!canProceed} className="flex items-center gap-2">
            Complete Setup & View Dashboard
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
