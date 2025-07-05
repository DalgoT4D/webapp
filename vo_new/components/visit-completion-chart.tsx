"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import type { FilterValues } from "@/components/dashboard/dashboard-filters"

interface VisitCompletionChartProps {
  filters?: FilterValues
  isChatOpen?: boolean
}

const data = [
  { name: "Team A", completion: 92 },
  { name: "Team B", completion: 88 },
  { name: "Team C", completion: 76 },
  { name: "Team D", completion: 95 },
  { name: "Team E", completion: 82 },
]

const getBarColor = (value: number) => {
  if (value >= 90) return "#22c55e"
  if (value >= 80) return "#16a34a"
  if (value >= 70) return "#f97316"
  return "#ef4444"
}

export function VisitCompletionChart({ filters, isChatOpen = false }: VisitCompletionChartProps) {
  // Trigger resize when chat state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 400)

    return () => clearTimeout(timer)
  }, [isChatOpen])

  // In a real app, you would filter the data based on the filters
  // For now, we'll just use the static data
  const chartData = data || []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Visit Completion</CardTitle>
        <CardDescription className="text-xs">Percentage of scheduled visits completed by field teams</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ChartContainer
          config={{
            completion: {
              label: "Completion Rate",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="aspect-[4/3] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="name" width={60} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value}%`, "Completion Rate"]}
              />
              <Bar dataKey="completion" name="Completion Rate" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.completion)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
