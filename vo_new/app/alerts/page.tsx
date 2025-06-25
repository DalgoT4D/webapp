import { AlertsView } from "@/components/alerts/alerts-view"
import { MainLayout } from "@/components/main-layout"
import { AuthGuard } from "@/components/auth-guard"

export default function AlertsPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <AlertsView />
      </MainLayout>
    </AuthGuard>
  )
}
