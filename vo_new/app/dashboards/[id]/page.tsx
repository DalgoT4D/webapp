import { IndividualDashboardView } from "@/components/dashboard/individual-dashboard-view"
import { AuthGuard } from "@/components/auth-guard"

export default function IndividualDashboardPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <IndividualDashboardView dashboardId={params.id} />
    </AuthGuard>
  )
}
