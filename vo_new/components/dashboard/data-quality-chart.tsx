"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { month: "Jan", completeness: 82, accuracy: 78, timeliness: 85 },
  { month: "Feb", completeness: 85, accuracy: 80, timeliness: 87 },
  { month: "Mar", completeness: 87, accuracy: 83, timeliness: 88 },
  { month: "Apr", completeness: 90, accuracy: 85, timeliness: 90 },
  { month: "May", completeness: 92, accuracy: 88, timeliness: 91 },
  { month: "Jun", completeness: 94, accuracy: 90, timeliness: 93 },
]

export function DataQualityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Quality</CardTitle>
        <CardDescription>Data quality metrics over time (%)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            completeness: {
              label: "Completeness",
              color: "hsl(var(--chart-1))",
            },
            accuracy: {
              label: "Accuracy",
              color: "hsl(var(--chart-2))",
            },
            timeliness: {
              label: "Timeliness",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[70, 100]} tickFormatter={(value) => `${value}%`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="completeness" stroke="var(--color-completeness)" activeDot={{ r: 8 }} />
              <Line type="monotone" dataKey="accuracy" stroke="var(--color-accuracy)" />
              <Line type="monotone" dataKey="timeliness" stroke="var(--color-timeliness)" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
