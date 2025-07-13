"use client"

import type React from "react"
import { MessageSquare } from "lucide-react"
import { useState } from "react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ArrowUpIcon, ArrowDownIcon, Users, UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react"
import type { FilterValues } from "./dashboard-filters"

interface KeyIndicatorProps {
  title: string
  value: string | number
  change: number
  icon: React.ElementType
  trend?: "up" | "down"
  trendDirection?: "positive" | "negative"
  onClick?: () => void
}

function KeyIndicator({
  title,
  value,
  change,
  icon: Icon,
  trend = "up",
  trendDirection = "positive",
  onClick,
}: KeyIndicatorProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isPositive = trendDirection === "positive"
  const showPositiveColor = (trend === "up" && isPositive) || (trend === "down" && !isPositive)

  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors relative group"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-4">
        <div className="flex flex-row items-center justify-between space-y-0">
          <p className="text-sm font-medium">{title}</p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="text-2xl font-bold mt-2">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          <span className={`flex items-center ${showPositiveColor ? "text-emerald-500" : "text-rose-500"}`}>
            {trend === "up" ? <ArrowUpIcon className="mr-1 h-3 w-3" /> : <ArrowDownIcon className="mr-1 h-3 w-3" />}
            {Math.abs(change)}% from last month
          </span>
        </p>
      </CardContent>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "absolute top-2 right-2 transition-opacity duration-200 flex items-center gap-1.5",
          isHovered ? "opacity-100" : "opacity-0",
        )}
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        title={`Ask about ${title}`}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="text-xs">Ask</span>
      </Button>
    </Card>
  )
}

interface KeyIndicatorsProps {
  filters: FilterValues
  onDrillDown: (metric: string, value: string) => void
}

export function KeyIndicators({ filters, onDrillDown }: KeyIndicatorsProps) {
  // In a real app, these values would be calculated based on the filters
  return (
    <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
      <KeyIndicator
        title="Total Mothers"
        value="2,853"
        change={12}
        icon={Users}
        trend="up"
        trendDirection="positive"
        onClick={() => onDrillDown("mothers", "total")}
      />
      <KeyIndicator
        title="Visit Completion"
        value="87%"
        change={5}
        icon={UserCheck}
        trend="up"
        trendDirection="positive"
        onClick={() => onDrillDown("visits", "completion")}
      />
      <KeyIndicator
        title="Protocol Adherence"
        value="76%"
        change={3}
        icon={CheckCircle2}
        trend="down"
        trendDirection="positive"
        onClick={() => onDrillDown("protocols", "adherence")}
      />
      <KeyIndicator
        title="High Risk Cases"
        value="142"
        change={8}
        icon={AlertTriangle}
        trend="up"
        trendDirection="negative"
        onClick={() => onDrillDown("risk", "high")}
      />
    </div>
  )
}
