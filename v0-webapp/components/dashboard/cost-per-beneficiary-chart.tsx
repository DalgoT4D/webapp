"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const data = [
  { year: "2020", cost: 58 },
  { year: "2021", cost: 52 },
  { year: "2022", cost: 47 },
  { year: "2023", cost: 42 },
]

export function CostPerBeneficiaryChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Per Beneficiary</CardTitle>
        <CardDescription>Average cost per beneficiary over time ($)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            cost: {
              label: "Cost",
              color: "hsl(var(--chart-1))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <ChartTooltip content={<ChartTooltipContent />} formatter={(value: number) => [`$${value}`, "Cost"]} />
              <Bar dataKey="cost" fill="var(--color-cost)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
