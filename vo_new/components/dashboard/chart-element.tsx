"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts"
import { Settings, Trash2, GripVertical, Maximize2, Minimize2 } from "lucide-react"
import { DashboardElementData, ChartConfig } from "./dashboard-builder"

interface ChartElementProps {
  element: DashboardElementData
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DashboardElementData>) => void
  onDelete: () => void
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const sizeOptions = [
  { label: "Small (1x1)", value: "1x1", cols: 1, rows: 1 },
  { label: "Medium (2x1)", value: "2x1", cols: 2, rows: 1 },
  { label: "Large (2x2)", value: "2x2", cols: 2, rows: 2 },
  { label: "Wide (3x1)", value: "3x1", cols: 3, rows: 1 },
  { label: "Extra Large (3x2)", value: "3x2", cols: 3, rows: 2 },
]

export function ChartElement({ element, isSelected, onSelect, onUpdate, onDelete }: ChartElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const config = element.config as ChartConfig

  const handleSizeChange = (sizeValue: string) => {
    const sizeOption = sizeOptions.find(option => option.value === sizeValue)
    if (sizeOption) {
      onUpdate({
        gridSize: {
          cols: sizeOption.cols,
          rows: sizeOption.rows,
        }
      })
    }
  }

  const getCurrentSizeValue = () => {
    const currentSize = `${element.gridSize.cols}x${element.gridSize.rows}`
    return sizeOptions.find(option => option.value === currentSize)?.value || "1x1"
  }

  const renderChart = () => {
    const { chartType, data, xKey, yKey } = config

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey={yKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xKey} />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )
      
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        )
      
      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey={xKey} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name={yKey}
                dataKey={yKey}
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.2}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
            </RadarChart>
          </ResponsiveContainer>
        )
      
      default:
        return <div className="flex items-center justify-center h-full text-muted-foreground">Unknown chart type</div>
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div>
              <CardTitle className="text-base">{config.title || "Chart"}</CardTitle>
              <CardDescription className="text-xs capitalize">{config.chartType} Chart</CardDescription>
            </div>
          </div>
          
          {isSelected && (
            <div className="flex items-center gap-1">
              <Select value={getCurrentSizeValue()} onValueChange={handleSizeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setIsEditing(!isEditing)
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div 
          className="w-full"
          style={{ 
            height: `${Math.max(200, element.gridSize.rows * 150)}px` 
          }}
        >
          <ChartContainer
            config={{
              [config.yKey]: {
                label: config.yKey,
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-full"
          >
            {renderChart()}
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
} 