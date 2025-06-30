"use client"

import { useState } from "react"
import { MainLayout } from "@/components/main-layout"
import { ReportsList } from "./reports-list"
import { CreateReportDialog } from "./create-report-dialog"
import { ReportInstancesView } from "./report-instances-view"
import { ReportInstanceView } from "./report-instance-view"
import { ErrorBoundary } from "react-error-boundary"

export interface Report {
  id: string
  name: string
  description: string
  dashboardId: string
  dashboardName: string
  frequency: "daily" | "weekly" | "monthly"
  time: string
  owners: string[]
  recipients: string[]
  createdAt: string
  lastRun?: string
  status: "active" | "paused" | "error"
}

export interface ReportInstance {
  id: string
  reportId: string
  reportName: string
  reportDescription: string
  dashboardName: string
  generatedAt: string
  status: "completed" | "failed" | "generating"
  fileSize?: string
  downloadUrl?: string
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Component Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

export function ReportsView() {
  const [view, setView] = useState<"list" | "instances" | "instance">("list")
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [selectedInstance, setSelectedInstance] = useState<ReportInstance | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [reports, setReports] = useState<Report[]>([])

  const handleReportSelect = (report: Report) => {
    setSelectedReport(report)
    setView("instances")
  }

  const handleInstanceSelect = (instance: ReportInstance) => {
    setSelectedInstance(instance)
    setView("instance")
  }

  const handleBackToList = () => {
    setSelectedReport(null)
    setSelectedInstance(null)
    setView("list")
  }

  const handleBackToInstances = () => {
    setSelectedInstance(null)
    setView("instances")
  }

  const handleCreateReport = () => {
    setCreateDialogOpen(true)
  }

  const handleReportCreated = (report: Report) => {
    setCreateDialogOpen(false)
    // Add the new report to our list
    setReports((prev) => [report, ...prev])
    console.log("Report created:", report)
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          {view === "list" && (
            <ReportsList
              onReportSelect={handleReportSelect}
              onCreateReport={handleCreateReport}
              customReports={reports}
            />
          )}

          {view === "instances" && selectedReport && (
            <ReportInstancesView
              report={selectedReport}
              onInstanceSelect={handleInstanceSelect}
              onBack={handleBackToList}
            />
          )}

          {view === "instance" && selectedInstance && (
            <ReportInstanceView instance={selectedInstance} onBack={handleBackToInstances} />
          )}
        </ErrorBoundary>

        <CreateReportDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onReportCreated={handleReportCreated}
        />
      </div>
    </MainLayout>
  )
}
