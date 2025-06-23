import { ErrorBoundary } from "react-error-boundary"
import { IndividualDashboardView } from "@/components/dashboard/individual-dashboard-view"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-bold text-red-800">Something went wrong:</h2>
      <p className="text-red-600">{error.message}</p>
    </div>
  )
}

export default function IndividualDashboardPage({ params }: { params: { id: string } }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <IndividualDashboardView dashboardId={params.id} />
    </ErrorBoundary>
  )
}
