import { ErrorBoundary } from "react-error-boundary"
import type { DashboardType } from "./dashboard-view"
import { ImplementationDashboard } from "./implementation-dashboard"
import { ImpactDashboard } from "./impact-dashboard"
import { FunderDashboard } from "./funder-dashboard"
import { UsageDashboard } from "./usage-dashboard"

interface DashboardContentProps {
  dashboardType: DashboardType
  onElementSelect: (elementId: string) => void
  isChatOpen?: boolean
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Dashboard Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

export function DashboardContent({
  dashboardType = "implementation",
  onElementSelect,
  isChatOpen = false,
}: DashboardContentProps) {
  // Ensure we have a valid dashboard type
  const currentDashboard = dashboardType || "implementation"

  // Ensure we have a valid onElementSelect function
  const handleElementSelect = (elementId: string) => {
    if (onElementSelect && typeof onElementSelect === "function" && elementId) {
      onElementSelect(elementId)
    }
  }

  return (
    <div className="p-4">
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        {currentDashboard === "implementation" && (
          <ImplementationDashboard onElementSelect={handleElementSelect} isChatOpen={isChatOpen} />
        )}
        {currentDashboard === "impact" && (
          <ImpactDashboard onElementSelect={handleElementSelect} isChatOpen={isChatOpen} />
        )}
        {currentDashboard === "funder" && (
          <FunderDashboard onElementSelect={handleElementSelect} isChatOpen={isChatOpen} />
        )}
        {currentDashboard === "usage" && (
          <UsageDashboard onElementSelect={handleElementSelect} isChatOpen={isChatOpen} />
        )}
      </ErrorBoundary>
    </div>
  )
}
