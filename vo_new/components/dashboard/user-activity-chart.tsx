"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from "recharts"

const data = [
  { day: "Mon", fieldWorkers: 42, managers: 8, admins: 3 },
  { day: "Tue", fieldWorkers: 45, managers: 9, admins: 2 },
  { day: "Wed", fieldWorkers: 48, managers: 10, admins: 4 },
  { day: "Thu", fieldWorkers: 47, managers: 9, admins: 3 },
  { day: "Fri", fieldWorkers: 46, managers: 8, admins: 2 },
  { day: "Sat", fieldWorkers: 28, managers: 4, admins: 1 },
  { day: "Sun", fieldWorkers: 15, managers: 2, admins: 1 },
]

export function UserActivityChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Activity</CardTitle>
        <CardDescription>Daily active users by role</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            fieldWorkers: {
              label: "Field Workers",
              color: "hsl(var(--chart-1))",
            },
            managers: {
              label: "Managers",
              color: "hsl(var(--chart-2))",
            },
            admins: {
              label: "Admins",
              color: "hsl(var(--chart-3))",
            },
          }}
          className="h-[200px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="fieldWorkers"
                stackId="1"
                stroke="var(--color-fieldWorkers)"
                fill="var(--color-fieldWorkers)"
              />
              <Area
                type="monotone"
                dataKey="managers"
                stackId="1"
                stroke="var(--color-managers)"
                fill="var(--color-managers)"
              />
              <Area
                type="monotone"
                dataKey="admins"
                stackId="1"
                stroke="var(--color-admins)"
                fill="var(--color-admins)"
              />
              <Legend />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
