"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { name: "Antenatal Care", investment: 25000, outcome: 87 },
  { name: "Nutritional Support", investment: 35000, outcome: 92 },
  { name: "Health Education", investment: 15000, outcome: 78 },
  { name: "Field Visits", investment: 45000, outcome: 95 },
  { name: "Medical Supplies", investment: 30000, outcome: 85 },
]

export function OutcomesByInvestmentChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Outcomes By Investment</CardTitle>
        <CardDescription>Effectiveness of different program investments</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            outcome: {
              label: "Outcome Score",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="investment"
                name="Investment"
                unit="$"
                domain={[10000, 50000]}
                tickFormatter={(value) => `$${value / 1000}k`}
              />
              <YAxis type="number" dataKey="outcome" name="Outcome" unit="%" domain={[70, 100]} />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3" }}
                content={<ChartTooltipContent />}
                formatter={(value: any, name: string) => {
                  if (name === "investment") return [`$${value}`, "Investment"]
                  return [value, name]
                }}
              />
              <Scatter name="Programs" data={data || []} fill="var(--color-outcome)" />
              <Legend />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
