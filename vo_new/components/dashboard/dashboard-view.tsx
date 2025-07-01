"use client"

import { ErrorBoundary } from "react-error-boundary"
import { DashboardList } from "@/components/dashboard/dashboard-list"

// Export the DashboardType that other components are importing
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
  return (
    <div className="flex flex-col h-full">
      {/* Dashboard List - Regular page view */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Dashboards</h1>
          <p className="text-muted-foreground">Monitor and analyze your maternal health program performance</p>
        </div>
        <DashboardList />
      </ErrorBoundary>
    </div>
  )
}
