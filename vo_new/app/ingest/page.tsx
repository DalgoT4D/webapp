import Ingest from "@/components/ingest"
import { MainLayout } from "@/components/main-layout"
import { AuthGuard } from "@/components/auth-guard"

export default function IngestPage() {
  return (
    <AuthGuard>
      <MainLayout>
        <Ingest />
      </MainLayout>
    </AuthGuard>
  )
}
