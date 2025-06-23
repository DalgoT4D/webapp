"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { time: "00:00", responseTime: 120, errorRate: 0.5, userLoad: 10 },
  { time: "04:00", responseTime: 110, errorRate: 0.3, userLoad: 5 },
  { time: "08:00", responseTime: 180, errorRate: 1.2, userLoad: 45 },
  { time: "12:00", responseTime: 220, errorRate: 1.8, userLoad: 65 },
  { time: "16:00", responseTime: 250, errorRate: 2.0, userLoad: 70 },
  { time: "20:00", responseTime: 190, errorRate: 1.5, userLoad: 40 },
]

export function SystemPerformanceChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>System Performance</CardTitle>
        <CardDescription>Response time (ms), error rate (%), and user load</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            responseTime: {
              label: "Response Time (ms)",
              color: "hsl(var(--chart-1))",
            },
            errorRate: {
              label: "Error Rate (%)",
              color: "hsl(var(--chart-2))",
            },
            userLoad: {
              label: "User Load",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" orientation="left" />
              <YAxis yAxisId="right" orientation="right" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="responseTime"
                stroke="var(--color-responseTime)"
                fill="var(--color-responseTime)"
                fillOpacity={0.2}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="errorRate"
                stroke="var(--color-errorRate)"
                fill="var(--color-errorRate)"
                fillOpacity={0.2}
              />
              <Area
                yAxisId="right"
                type="monotone"
                dataKey="userLoad"
                stroke="var(--color-userLoad)"
                fill="var(--color-userLoad)"
                fillOpacity={0.2}
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
