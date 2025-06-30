"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { ErrorBoundary } from "react-error-boundary"
import { DashboardList } from "@/components/dashboard/dashboard-list"

// Dashboard types
export type DashboardType = "implementation" | "impact" | "funder" | "usage"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Component Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

export function DashboardView() {
  // Initialize state with default values
  const [selectedDashboard, setSelectedDashboard] = useState<DashboardType>("implementation")
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  const [isDashboardListCollapsed, setIsDashboardListCollapsed] = useState(false)
  const [selectedDashboardData, setSelectedDashboardData] = useState<any>(null)

  // Handle dashboard type change
  const handleDashboardChange = (type: DashboardType) => {
    if (type) {
      setSelectedDashboard(type)
      setSelectedElement(null)
    }
  }

  const handleDashboardSelect = (dashboard: any) => {
    setSelectedDashboard(dashboard.type)
    setSelectedDashboardData(dashboard)
    setSelectedElement(null)
    setIsDashboardListCollapsed(true)
  }

  const handleToggleCollapse = () => {
    setIsDashboardListCollapsed(!isDashboardListCollapsed)
  }

  // Handle element selection for targeted questions
  const handleElementSelect = (elementId: string) => {
    if (elementId) {
      setSelectedElement(elementId)
      setIsChatOpen(true)
    }
  }

  // Trigger resize event when chat opens/closes to help charts adapt
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 300) // Small delay to allow transition to complete

    return () => clearTimeout(timer)
  }, [isChatOpen])

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        {/* Dashboard List - Regular page view */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
              <p className="text-muted-foreground">Monitor and analyze your maternal health program performance</p>
            </div>
            <DashboardList
              selectedDashboard={selectedDashboard}
              onDashboardSelect={handleDashboardSelect}
              isCollapsed={isDashboardListCollapsed}
              onToggleCollapse={handleToggleCollapse}
            />
          </div>
        </ErrorBoundary>
      </div>
    </MainLayout>
  )
}
