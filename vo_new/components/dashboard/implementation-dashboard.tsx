"use client"

import { useState, useEffect } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { VisitCompletionChart } from "@/components/visit-completion-chart"
import { ProtocolAdherenceChart } from "@/components/protocol-adherence-chart"
import { RiskDistributionChart } from "@/components/risk-distribution-chart"
import { DashboardChartWrapper } from "./dashboard-chart-wrapper"
import { FieldVisitTable } from "./field-visit-table"
import { SupplyLevelsChart } from "./supply-levels-chart"
import { TeamPerformanceChart } from "./team-performance-chart"
import { IndiaMapChart } from "./india-map-chart"
import { DashboardFilters, type FilterValues } from "./dashboard-filters"
import { DashboardInsight } from "./dashboard-insight"
import { KeyIndicators } from "./key-indicators"
import { DrillDownDialog } from "./drill-down-dialog"
import { Card } from "@/components/ui/card"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ImplementationDashboardProps {
  onElementSelect: (elementId: string) => void
  isChatOpen?: boolean
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Chart Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

export function ImplementationDashboard({ onElementSelect, isChatOpen = false }: ImplementationDashboardProps) {
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: {
      from: new Date(2023, 4, 1),
      to: new Date(2023, 4, 31),
    },
    region: "all",
    team: "all",
    riskLevel: "all",
  })

  // Drill-down state
  const [drillDownOpen, setDrillDownOpen] = useState(false)
  const [drillDownMetric, setDrillDownMetric] = useState("")
  const [drillDownValue, setDrillDownValue] = useState("")
  const [drillDownRegionId, setDrillDownRegionId] = useState<string | undefined>(undefined)

  // Trigger resize when chat state changes
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 350) // Slightly longer delay for chart components

    return () => clearTimeout(timer)
  }, [isChatOpen])

  // Ensure we have a valid onElementSelect function
  const handleElementSelect = (elementId: string) => {
    if (onElementSelect && typeof onElementSelect === "function" && elementId) {
      onElementSelect(elementId)
    }
  }

  // Handle filter changes
  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    // In a real app, you would fetch new data based on these filters
    console.log("Filters updated:", newFilters)
  }

  // Handle drill-down
  const handleDrillDown = (metric: string, value: string) => {
    setDrillDownMetric(metric)
    setDrillDownValue(value)
    setDrillDownRegionId(undefined)
    setDrillDownOpen(true)
  }

  // Handle region click
  const handleRegionClick = (regionId: string) => {
    setDrillDownMetric("region")
    setDrillDownValue(regionId)
    setDrillDownRegionId(regionId)
    setDrillDownOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Implementation Metrics</h2>
        <DashboardFilters onFilterChange={handleFilterChange} />
      </div>

      {/* Key Indicators */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <KeyIndicators filters={filters} onDrillDown={handleDrillDown} />
      </ErrorBoundary>

      {/* India Map and Key Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <div className="lg:col-span-2">
            <IndiaMapChart filters={filters} onRegionClick={handleRegionClick} isChatOpen={isChatOpen} />
          </div>
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Card className="p-4 space-y-4 relative group">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-medium">Key Insights</h3>
              <Button
                variant="outline"
                size="sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1.5"
                onClick={() => handleElementSelect("key-insights")}
                title="Ask about Key Insights"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-xs">Ask</span>
              </Button>
            </div>
            <div className="space-y-3">
              <DashboardInsight
                title="Maharashtra Needs Attention"
                description="12 high-risk mothers missed follow-ups in Maharashtra, 23% higher risk cases despite similar visit rates."
                type="warning"
              />
              <DashboardInsight
                title="Team C Underperforming"
                description="Visit completion rate (76%) below target for 3rd consecutive month. Recommend additional training."
                type="warning"
              />
              <DashboardInsight
                title="Protocol Adherence Declining"
                description="3% monthly decline in protocol adherence, with nutritional assessments down 7.5%."
                type="danger"
              />
              <DashboardInsight
                title="Supply Shortage Risk"
                description="Prenatal vitamins below 15% of required inventory. Stockout projected in 8 days."
                type="danger"
              />
            </div>
          </Card>
        </ErrorBoundary>
      </div>

      {/* Charts - First Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Visit Completion */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <DashboardChartWrapper
            elementId="visit-completion"
            title="Visit Completion"
            onElementSelect={handleElementSelect}
          >
            <VisitCompletionChart filters={filters} isChatOpen={isChatOpen} />
          </DashboardChartWrapper>
        </ErrorBoundary>

        {/* Protocol Adherence */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <DashboardChartWrapper
            elementId="protocol-adherence"
            title="Protocol Adherence"
            onElementSelect={handleElementSelect}
          >
            <ProtocolAdherenceChart filters={filters} isChatOpen={isChatOpen} />
          </DashboardChartWrapper>
        </ErrorBoundary>

        {/* Risk Distribution */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <DashboardChartWrapper
            elementId="risk-distribution"
            title="Risk Distribution"
            onElementSelect={handleElementSelect}
          >
            <RiskDistributionChart filters={filters} isChatOpen={isChatOpen} />
          </DashboardChartWrapper>
        </ErrorBoundary>
      </div>

      {/* Charts - Second Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supply Levels */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <DashboardChartWrapper elementId="supply-levels" title="Supply Levels" onElementSelect={handleElementSelect}>
            <SupplyLevelsChart filters={filters} isChatOpen={isChatOpen} />
          </DashboardChartWrapper>
        </ErrorBoundary>

        {/* Team Performance */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <DashboardChartWrapper
            elementId="team-performance"
            title="Team Performance"
            onElementSelect={handleElementSelect}
          >
            <TeamPerformanceChart filters={filters} isChatOpen={isChatOpen} />
          </DashboardChartWrapper>
        </ErrorBoundary>
      </div>

      {/* Recent Field Visits */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="field-visits"
          title="Recent Field Visits"
          onElementSelect={handleElementSelect}
        >
          <FieldVisitTable filters={filters} />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Drill-down Dialog */}
      <DrillDownDialog
        open={drillDownOpen}
        onOpenChange={setDrillDownOpen}
        metric={drillDownMetric}
        value={drillDownValue}
        regionId={drillDownRegionId}
      />
    </div>
  )
}
