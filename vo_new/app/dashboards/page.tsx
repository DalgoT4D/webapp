import { DashboardView } from "@/components/dashboard/dashboard-view"
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardsPage() {
  return (
    <AuthGuard>
      <DashboardView />
    </AuthGuard>
  );
}
