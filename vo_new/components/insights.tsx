import { KpiCards } from "@/components/kpi-cards"
import { TextualInsights } from "@/components/textual-insights"
import { Recommendations } from "@/components/recommendations"
import { RecentlyViewed } from "@/components/recently-viewed"
import { RiskDistributionChart } from "@/components/risk-distribution-chart"
import { AlertNotification } from "@/components/alert-notification"
import { MainLayout } from "@/components/main-layout"
import { ErrorBoundary } from "react-error-boundary"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-bold text-red-800">Something went wrong:</h2>
      <p className="text-red-600">{error.message}</p>
    </div>
  )
}

export function Insights() {
  return (
    <MainLayout>
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Impact at a Glance</h1>
          <p className="text-muted-foreground">Your maternal health program at a glance</p>
        </div>

        {/* Alert notification bar */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <AlertNotification />
        </ErrorBoundary>

        {/* KPI Cards */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <KpiCards />
        </ErrorBoundary>

        {/* Chart and Insights/Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Risk Distribution Chart - Takes 1/3 on large screens */}
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <RiskDistributionChart />
          </ErrorBoundary>

          {/* Insights and Recommendations - Takes 2/3 on large screens */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <TextualInsights />
            </ErrorBoundary>

            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <Recommendations />
            </ErrorBoundary>
          </div>
        </div>

        {/* Recently Viewed */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <RecentlyViewed />
        </ErrorBoundary>
      </div>
    </MainLayout>
  )
}
