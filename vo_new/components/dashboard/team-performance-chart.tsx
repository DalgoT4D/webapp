"use client"

import { useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer } from "recharts"
import type { FilterValues } from "@/components/dashboard/dashboard-filters"

interface TeamPerformanceChartProps {
  filters?: FilterValues
  isChatOpen?: boolean
}

const data = [
  { metric: "Visit Completion", teamA: 92, teamB: 88, teamC: 76, teamD: 95 },
  { metric: "Protocol Adherence", teamA: 85, teamB: 82, teamC: 70, teamD: 90 },
  { metric: "Data Quality", teamA: 88, teamB: 85, teamC: 79, teamD: 92 },
  { metric: "Beneficiary Satisfaction", teamA: 90, teamB: 87, teamC: 82, teamD: 94 },
  { metric: "Response Time", teamA: 87, teamB: 84, teamC: 75, teamD: 91 },
]

export function TeamPerformanceChart({ filters, isChatOpen = false }: TeamPerformanceChartProps) {
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
        <CardTitle className="text-base">Team Performance</CardTitle>
        <CardDescription className="text-xs">Comparative performance across key metrics</CardDescription>
      </CardHeader>
      <CardContent className="pt-0 pb-4">
        <ChartContainer
          config={{
            teamA: {
              label: "Team A",
              color: "hsl(var(--chart-1))",
            },
            teamB: {
              label: "Team B",
              color: "hsl(var(--chart-2))",
            },
            teamC: {
              label: "Team C",
              color: "hsl(var(--chart-3))",
            },
            teamD: {
              label: "Team D",
              color: "hsl(var(--chart-4))",
            },
          }}
          className="aspect-[4/3] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                name="Team A"
                dataKey="teamA"
                stroke="var(--color-teamA)"
                fill="var(--color-teamA)"
                fillOpacity={0.2}
              />
              <Radar
                name="Team B"
                dataKey="teamB"
                stroke="var(--color-teamB)"
                fill="var(--color-teamB)"
                fillOpacity={0.2}
              />
              <Radar
                name="Team C"
                dataKey="teamC"
                stroke="var(--color-teamC)"
                fill="var(--color-teamC)"
                fillOpacity={0.2}
              />
              <Radar
                name="Team D"
                dataKey="teamD"
                stroke="var(--color-teamD)"
                fill="var(--color-teamD)"
                fillOpacity={0.2}
              />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
