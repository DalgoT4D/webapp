import { ErrorBoundary } from "react-error-boundary"
import { DashboardChartWrapper } from "./dashboard-chart-wrapper"
import { HealthOutcomesChart } from "./health-outcomes-chart"
import { BeneficiaryReachChart } from "./beneficiary-reach-chart"
import { RegionalImpactMap } from "./regional-impact-map"
import { ImpactMetricsTable } from "./impact-metrics-table"
import { TrendAnalysisChart } from "./trend-analysis-chart"

interface ImpactDashboardProps {
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

export function ImpactDashboard({ onElementSelect }: ImpactDashboardProps) {
  // Ensure we have a valid onElementSelect function
  const handleElementSelect = (elementId: string) => {
    if (onElementSelect && typeof onElementSelect === "function" && elementId) {
      onElementSelect(elementId)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Health Outcomes */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="health-outcomes"
          title="Health Outcomes"
          onElementSelect={handleElementSelect}
        >
          <HealthOutcomesChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Beneficiary Reach */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="beneficiary-reach"
          title="Beneficiary Reach"
          onElementSelect={handleElementSelect}
        >
          <BeneficiaryReachChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Regional Impact */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="regional-impact"
          title="Regional Impact"
          onElementSelect={handleElementSelect}
        >
          <RegionalImpactMap />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Trend Analysis */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="trend-analysis"
          title="Trend Analysis"
          onElementSelect={handleElementSelect}
          className="lg:col-span-2"
        >
          <TrendAnalysisChart />
        </DashboardChartWrapper>
      </ErrorBoundary>

      {/* Impact Metrics */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <DashboardChartWrapper
          elementId="impact-metrics"
          title="Impact Metrics"
          onElementSelect={handleElementSelect}
          className="lg:col-span-3"
        >
          <ImpactMetricsTable />
        </DashboardChartWrapper>
      </ErrorBoundary>
    </div>
  )
}
