import { ErrorBoundary } from "react-error-boundary"
import { ReportsView } from "@/components/reports/reports-view"

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-lg font-bold text-red-800">Something went wrong:</h2>
      <p className="text-red-600">{error.message}</p>
    </div>
  )
}

export default function ReportsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ReportsView />
    </ErrorBoundary>
  )
}
