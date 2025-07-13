"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { district: "Eastern", mothers: 850, children: 1200 },
  { district: "Western", mothers: 720, children: 980 },
  { district: "Northern", mothers: 650, children: 890 },
  { district: "Southern", mothers: 630, children: 850 },
]

export function BeneficiaryReachChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Beneficiary Reach</CardTitle>
        <CardDescription>Number of beneficiaries by district</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            mothers: {
              label: "Mothers",
              color: "hsl(var(--chart-1))",
            },
            children: {
              label: "Children",
              color: "hsl(var(--chart-2))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="district" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="mothers" fill="var(--color-mothers)" />
              <Bar dataKey="children" fill="var(--color-children)" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
