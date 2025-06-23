"use client"

import { useState } from "react"
import { AlertTriangle, ChevronDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Alert data
const alerts = [
  {
    id: 1,
    severity: "critical",
    title: "12 Missed Follow-ups",
    description: "High-risk mothers missed appointments, 8 in eastern district.",
  },
  {
    id: 2,
    severity: "warning",
    title: "Low Supplies",
    description: "Prenatal vitamins below 15%. Stockout in 8 days.",
  },
  {
    id: 3,
    severity: "warning",
    title: "Team C Performance",
    description: "Visit completion rate (76%) below target for 3rd month.",
  },
  {
    id: 4,
    severity: "critical",
    title: "Protocol Compliance",
    description: "3% monthly decline, nutritional assessments down 7.5%.",
  },
]

export function AlertNotification() {
  const [isExpanded, setIsExpanded] = useState(false)

  const criticalCount = alerts.filter((alert) => alert.severity === "critical").length
  const warningCount = alerts.filter((alert) => alert.severity === "warning").length
  const totalCount = alerts.length

  return (
    <div className="w-full bg-background border rounded-lg shadow-sm overflow-hidden">
      {/* Alert Header - Always visible */}
      <div
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer hover:bg-accent/50",
          isExpanded && "border-b",
        )}
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        tabIndex={0}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-rose-500" />
          <span className="font-medium text-sm">
            {totalCount} Alert{totalCount !== 1 ? "s" : ""}
          </span>
          <div className="flex gap-1">
            {criticalCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-xs font-medium text-rose-800">
                {criticalCount} Critical
              </span>
            )}
            {warningCount > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                {warningCount} Warning
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{isExpanded ? "Click to collapse" : "Click to expand"}</span>
          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Alert Content - Only visible when expanded */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "rounded-lg p-3 border flex items-start gap-2",
                alert.severity === "critical" ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-amber-500",
              )}
            >
              <AlertTriangle
                className={cn("h-4 w-4 mt-0.5", alert.severity === "critical" ? "text-rose-500" : "text-amber-500")}
              />
              <div className="flex-1">
                <h3
                  className={cn(
                    "font-medium text-sm",
                    alert.severity === "critical" ? "text-rose-700" : "text-amber-700",
                  )}
                >
                  {alert.title}
                </h3>
                <p className="text-xs mt-1 text-muted-foreground">{alert.description}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 mt-0">
                <X className="h-3 w-3" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
