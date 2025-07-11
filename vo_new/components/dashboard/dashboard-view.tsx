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
      {/* Dashboard List */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardList />
      </ErrorBoundary>
    </div>
  )
}
