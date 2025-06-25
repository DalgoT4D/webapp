import { ReportsView } from "@/components/reports/reports-view"
import { AuthGuard } from "@/components/auth-guard"

export default function ReportsPage() {
  return (
    <AuthGuard>
      <ReportsView />
    </AuthGuard>
  )
}
