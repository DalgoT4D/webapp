"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

const motherData = [
  { category: "High Risk", count: 142, fill: "#ef4444" },
  { category: "Medium Risk", count: 387, fill: "#f97316" },
  { category: "Low Risk", count: 1024, fill: "#facc15" },
  { category: "Healthy", count: 1300, fill: "#22c55e" },
]

const childrenData = [
  { category: "High Risk", count: 98, fill: "#ef4444" },
  { category: "Medium Risk", count: 276, fill: "#f97316" },
  { category: "Low Risk", count: 892, fill: "#facc15" },
  { category: "Healthy", count: 1587, fill: "#22c55e" },
]

export function RiskDistributionCharts() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Risk Distribution</CardTitle>
        <CardDescription>Distribution of mothers and children across risk categories</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="mothers">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="mothers">Mothers</TabsTrigger>
            <TabsTrigger value="children">Children</TabsTrigger>
          </TabsList>
          <TabsContent value="mothers" className="pt-4">
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                  color: "hsl(var(--chart-1))",
                },
              }}
              className="h-[300px] w-full overflow-hidden"
            >
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={motherData || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
          <TabsContent value="children" className="pt-4">
            <ChartContainer
              config={{
                count: {
                  label: "Count",
                  color: "hsl(var(--chart-2))",
                },
              }}
              className="h-[300px] w-full overflow-hidden"
            >
              <ResponsiveContainer width="99%" height="100%">
                <BarChart data={childrenData || []} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="count" name="Count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
