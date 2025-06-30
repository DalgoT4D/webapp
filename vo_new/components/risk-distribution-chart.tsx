"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import type { FilterValues } from "@/components/dashboard/dashboard-filters"

interface RiskDistributionChartProps {
  filters?: FilterValues
  isChatOpen?: boolean
}

const motherData = [
  { category: "High Risk", count: 142, fill: "#ef4444" },
  { category: "Medium Risk", count: 387, fill: "#f97316" },
  { category: "Low Risk", count: 1024, fill: "#facc15" },
  { category: "Healthy", count: 1300, fill: "#22c55e" },
]

export function RiskDistributionChart({ filters, isChatOpen = false }: RiskDistributionChartProps) {
  // Trigger resize when chat state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 400)

    return () => clearTimeout(timer)
  }, [isChatOpen])

  // In a real app, you would filter the data based on the filters
  // For now, we'll just use the static data
  const chartData = motherData || []

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Risk Distribution</CardTitle>
        <CardDescription className="text-xs">Mothers by risk category</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ChartContainer
          config={{
            count: {
              label: "Count",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="aspect-[4/3] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
