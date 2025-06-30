"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"
import type { FilterValues } from "@/components/dashboard/dashboard-filters"

interface ProtocolAdherenceChartProps {
  filters?: FilterValues
  isChatOpen?: boolean
}

const data = [
  { name: "Followed", value: 76 },
  { name: "Missed", value: 24 },
]

const COLORS = ["#16a34a", "#ef4444"]

export function ProtocolAdherenceChart({ filters, isChatOpen = false }: ProtocolAdherenceChartProps) {
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
        <CardTitle className="text-base">Protocol Adherence</CardTitle>
        <CardDescription className="text-xs">Percentage of protocols followed during visits</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ChartContainer className="aspect-[4/3] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
