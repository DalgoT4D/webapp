"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { month: "Jan", maternalMortality: 12, infantMortality: 18, malnutrition: 24 },
  { month: "Feb", maternalMortality: 11, infantMortality: 17, malnutrition: 22 },
  { month: "Mar", maternalMortality: 10, infantMortality: 15, malnutrition: 20 },
  { month: "Apr", maternalMortality: 9, infantMortality: 14, malnutrition: 18 },
  { month: "May", maternalMortality: 8, infantMortality: 13, malnutrition: 15 },
  { month: "Jun", maternalMortality: 7, infantMortality: 11, malnutrition: 14 },
]

export function HealthOutcomesChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Health Outcomes</CardTitle>
        <CardDescription>Key health indicators over time (per 1000)</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            maternalMortality: {
              label: "Maternal Mortality",
              color: "hsl(var(--chart-1))",
            },
            infantMortality: {
              label: "Infant Mortality",
              color: "hsl(var(--chart-2))",
            },
            malnutrition: {
              label: "Malnutrition",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="maternalMortality"
                stroke="var(--color-maternalMortality)"
                activeDot={{ r: 8 }}
              />
              <Line type="monotone" dataKey="infantMortality" stroke="var(--color-infantMortality)" />
              <Line type="monotone" dataKey="malnutrition" stroke="var(--color-malnutrition)" />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
