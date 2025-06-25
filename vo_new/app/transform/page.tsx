import { MainLayout } from "@/components/main-layout"
import Transform from "@/components/transform"
import { AuthGuard } from "@/components/auth-guard"

export default function IngestPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Transform />
      </MainLayout>
    </AuthGuard>
  )
}
