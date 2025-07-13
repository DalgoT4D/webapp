"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { quarter: "Q1 2022", healthOutcomes: 65, visitCompletion: 72, protocolAdherence: 68 },
  { quarter: "Q2 2022", healthOutcomes: 68, visitCompletion: 75, protocolAdherence: 70 },
  { quarter: "Q3 2022", healthOutcomes: 72, visitCompletion: 78, protocolAdherence: 73 },
  { quarter: "Q4 2022", healthOutcomes: 75, visitCompletion: 80, protocolAdherence: 76 },
  { quarter: "Q1 2023", healthOutcomes: 78, visitCompletion: 83, protocolAdherence: 79 },
  { quarter: "Q2 2023", healthOutcomes: 82, visitCompletion: 87, protocolAdherence: 76 },
]

export function TrendAnalysisChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend Analysis</CardTitle>
        <CardDescription>Key metrics over time (percentage)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            healthOutcomes: {
              label: "Health Outcomes",
              color: "hsl(var(--chart-1))",
            },
            visitCompletion: {
              label: "Visit Completion",
              color: "hsl(var(--chart-2))",
            },
            protocolAdherence: {
              label: "Protocol Adherence",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="quarter" />
              <YAxis domain={[60, 100]} tickFormatter={(value) => `${value}%`} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="healthOutcomes"
                stroke="var(--color-healthOutcomes)"
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="visitCompletion" stroke="var(--color-visitCompletion)" />
              <Line type="monotone" dataKey="protocolAdherence" stroke="var(--color-protocolAdherence)" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
