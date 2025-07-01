import { IndividualDashboardView } from "@/components/dashboard/individual-dashboard-view"

export default function IndividualDashboardPage({ params }: { params: { id: string } }) {
  return <IndividualDashboardView dashboardId={params.id} />
}
