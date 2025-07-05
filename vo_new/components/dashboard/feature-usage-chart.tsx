"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const data = [
  { feature: "Visit Logging", usage: 92 },
  { feature: "Risk Assessment", usage: 88 },
  { feature: "Data Visualization", usage: 76 },
  { feature: "Reporting", usage: 65 },
  { feature: "Chat Assistant", usage: 58 },
]

export function FeatureUsageChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Usage</CardTitle>
        <CardDescription>Percentage of users utilizing each feature</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            usage: {
              label: "Usage",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis type="category" dataKey="feature" width={100} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => [`${value}%`, "Usage"]} />
              <Bar dataKey="usage" fill="var(--color-usage)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
