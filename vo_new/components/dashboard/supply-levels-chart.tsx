"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts"
import type { FilterValues } from "@/components/dashboard/dashboard-filters"

interface SupplyLevelsChartProps {
  filters?: FilterValues
  isChatOpen?: boolean
}

const data = [
  { name: "Prenatal Vitamins", level: 15, threshold: 20 },
  { name: "Iron Supplements", level: 42, threshold: 20 },
  { name: "Folic Acid", level: 38, threshold: 20 },
  { name: "Malaria Prevention", level: 65, threshold: 20 },
  { name: "Nutritional Supplements", level: 27, threshold: 20 },
]

const getBarColor = (value: number, threshold: number) => {
  if (value <= threshold) return "#ef4444"
  if (value <= threshold * 2) return "#f97316"
  return "#22c55e"
}

export function SupplyLevelsChart({ filters, isChatOpen = false }: SupplyLevelsChartProps) {
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
        <CardTitle className="text-base">Supply Levels</CardTitle>
        <CardDescription className="text-xs">Current inventory levels of critical supplies (%)</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ChartContainer
          config={{
            level: {
              label: "Current Level",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="aspect-[4/3] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <ChartTooltip
                content={<ChartTooltipContent />}
                formatter={(value: number) => [`${value}%`, "Current Level"]}
              />
              <Bar dataKey="level" name="Current Level" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.level, entry.threshold)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
