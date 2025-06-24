"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface MetricChartProps {
  data: number[]
  timeHorizon: "week" | "month" | "quarter" | "year"
  color: string
  unit: string
}

export function MetricChart({ data, timeHorizon, color, unit }: MetricChartProps) {
  const getTimeLabels = (horizon: string, dataLength: number) => {
    switch (horizon) {
      case "week":
        return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].slice(0, dataLength)
      case "month":
        return Array.from({ length: dataLength }, (_, i) => `W${i + 1}`)
      case "quarter":
        return ["Q1", "Q2", "Q3", "Q4"].slice(0, dataLength)
      case "year":
        return Array.from({ length: dataLength }, (_, i) => `Y${i + 1}`)
      default:
        return Array.from({ length: dataLength }, (_, i) => `${i + 1}`)
    }
  }

  const chartData = data.map((value, index) => ({
    name: getTimeLabels(timeHorizon, data.length)[index],
    value: value,
  }))

  const getStrokeColor = (color: string) => {
    const colorMap = {
      red: "#dc2626",
      blue: "#2563eb",
      green: "#16a34a",
      purple: "#9333ea",
      orange: "#ea580c",
      teal: "#0d9488",
    }
    return colorMap[color as keyof typeof colorMap] || "#6b7280"
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12, fill: "#6b7280" }}
          domain={["dataMin - 5", "dataMax + 5"]}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            fontSize: "12px",
          }}
          formatter={(value: any) => [`${value}${unit}`, "Value"]}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={getStrokeColor(color)}
          strokeWidth={2}
          dot={{ fill: getStrokeColor(color), strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, stroke: getStrokeColor(color), strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
