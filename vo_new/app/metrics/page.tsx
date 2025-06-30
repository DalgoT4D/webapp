import { MetricsView } from "@/components/metrics/metrics-view"
import { MainLayout } from "@/components/main-layout"
import { AuthGuard } from "@/components/auth-guard"

export default function MetricsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <MetricsView />
      </MainLayout>
    </AuthGuard>
  )
}
