"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowDown, ArrowUp, BarChart3, Edit } from "lucide-react"
import { MetricChart } from "./metric-chart"

interface MetricCardProps {
  metric: {
    id: string
    name: string
    description: string
    category: string
    currentValue: number
    unit: string
    target: number
    trend: number
    icon: any
    color: string
    timeSeriesData: {
      week: number[]
      month: number[]
      quarter: number[]
      year: number[]
    }
  }
  timeHorizon: "week" | "month" | "quarter" | "year"
  onEdit?: () => void
}

export function MetricCard({ metric, timeHorizon, onEdit }: MetricCardProps) {
  const [showChart, setShowChart] = useState(false)
  const Icon = metric.icon

  // Calculate progress percentage (capped at 100%)
  const progressPercentage = Math.min(100, (metric.currentValue / metric.target) * 100)

  // Determine if trend is positive or negative
  const isTrendPositive = metric.trend > 0

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center`}
              style={{
                backgroundColor: `var(--${metric.color}-50, #f0f9ff)`,
                color: `var(--${metric.color}-600, #0284c7)`,
              }}
            >
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">{metric.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{metric.description}</p>
            </div>
          </div>
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Edit metric</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {showChart ? (
          <div className="h-[120px]">
            <MetricChart data={metric.timeSeriesData[timeHorizon]} timeHorizon={timeHorizon} color={metric.color} />
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{metric.currentValue}</span>
                <span className="text-sm text-muted-foreground">{metric.unit}</span>
              </div>
              <div className={`flex items-center gap-1 text-sm ${isTrendPositive ? "text-green-600" : "text-red-600"}`}>
                {isTrendPositive ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                {Math.abs(metric.trend)}%
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>
                  {metric.currentValue} / {metric.target} {metric.unit}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="w-full flex items-center justify-center gap-1 text-xs"
          onClick={() => setShowChart(!showChart)}
        >
          <BarChart3 className="h-3 w-3" />
          {showChart ? "Show Current Value" : "Show Trend"}
        </Button>
      </CardFooter>
    </Card>
  )
}
