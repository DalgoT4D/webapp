"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { year: "2023", funding: 100, costs: 95, sustainability: 105 },
  { year: "2024", funding: 110, costs: 100, sustainability: 110 },
  { year: "2025", funding: 105, costs: 105, sustainability: 100 },
  { year: "2026", funding: 115, costs: 110, sustainability: 105 },
  { year: "2027", funding: 120, costs: 115, sustainability: 104 },
]

export function ProgramSustainabilityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Program Sustainability</CardTitle>
        <CardDescription>Projected funding, costs, and sustainability index</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            funding: {
              label: "Funding",
              color: "hsl(var(--chart-1))",
            },
            costs: {
              label: "Costs",
              color: "hsl(var(--chart-2))",
            },
            sustainability: {
              label: "Sustainability Index",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="funding" stroke="var(--color-funding)" />
              <Line type="monotone" dataKey="costs" stroke="var(--color-costs)" />
              <Line
                type="monotone"
                dataKey="sustainability"
                stroke="var(--color-sustainability)"
                activeDot={{ r: 8 }}
              />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
