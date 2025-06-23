import { ErrorBoundary } from "react-error-boundary"
import { DashboardChartWrapper } from "./dashboard-chart-wrapper"
import { UserActivityChart } from "./user-activity-chart"
import { FeatureUsageChart } from "./feature-usage-chart"
import { DataQualityChart } from "./data-quality-chart"
import { UserFeedbackTable } from "./user-feedback-table"
import { SystemPerformanceChart } from "./system-performance-chart"

interface UsageDashboardProps {
  onElementSelect: (elementId: string) => void
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Chart Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

export function UsageDashboard({ onElementSelect }: UsageDashboardProps) {
  // Ensure we have a valid onElementSelect function
  const handleElementSelect = (elementId: string) => {
    if (onElementSelect && typeof onElementSelect === "function" && elementId) {
      onElementSelect(elementId)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* User Activity */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper elementId="user-activity" title="User Activity" onElementSelect={handleElementSelect}>
          <UserActivityChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Feature Usage */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper elementId="feature-usage" title="Feature Usage" onElementSelect={handleElementSelect}>
          <FeatureUsageChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Data Quality */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper elementId="data-quality" title="Data Quality" onElementSelect={handleElementSelect}>
          <DataQualityChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* System Performance */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="system-performance"
          title="System Performance"
          onElementSelect={handleElementSelect}
          className="lg:col-span-3"
        >
          <SystemPerformanceChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* User Feedback */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="user-feedback"
          title="User Feedback"
          onElementSelect={handleElementSelect}
          className="lg:col-span-3"
        >
          <UserFeedbackTable />
        </DashboardChartWrapper>
      </ErrorBoundary>
    </div>
  )
}
