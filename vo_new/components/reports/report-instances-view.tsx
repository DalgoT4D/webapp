"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft,
  Search,
  Download,
  Eye,
  Calendar,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"
import type { Report, ReportInstance } from "./reports-view"

// Mock data for all instances
const mockAllInstances: Record<string, ReportInstance[]> = {
  "rpt-001": [
    {
      id: "inst-001-1",
      reportId: "rpt-001",
      reportName: "Monthly Implementation Summary",
      reportDescription: "Comprehensive monthly report covering all implementation metrics",
      dashboardName: "Implementation Dashboard",
      generatedAt: "2023-05-15T09:00:00Z",
      status: "completed",
      fileSize: "2.4 MB",
      downloadUrl: "/reports/monthly-impl-may-2023.pdf",
    },
    {
      id: "inst-001-2",
      reportId: "rpt-001",
      reportName: "Monthly Implementation Summary",
      reportDescription: "Comprehensive monthly report covering all implementation metrics",
      dashboardName: "Implementation Dashboard",
      generatedAt: "2023-04-15T09:00:00Z",
      status: "completed",
      fileSize: "2.1 MB",
      downloadUrl: "/reports/monthly-impl-apr-2023.pdf",
    },
    {
      id: "inst-001-3",
      reportId: "rpt-001",
      reportName: "Monthly Implementation Summary",
      reportDescription: "Comprehensive monthly report covering all implementation metrics",
      dashboardName: "Implementation Dashboard",
      generatedAt: "2023-03-15T09:00:00Z",
      status: "completed",
      fileSize: "1.9 MB",
      downloadUrl: "/reports/monthly-impl-mar-2023.pdf",
    },
    {
      id: "inst-001-4",
      reportId: "rpt-001",
      reportName: "Monthly Implementation Summary",
      reportDescription: "Comprehensive monthly report covering all implementation metrics",
      dashboardName: "Implementation Dashboard",
      generatedAt: "2023-02-15T09:00:00Z",
      status: "completed",
      fileSize: "2.0 MB",
      downloadUrl: "/reports/monthly-impl-feb-2023.pdf",
    },
    {
      id: "inst-001-5",
      reportId: "rpt-001",
      reportName: "Monthly Implementation Summary",
      reportDescription: "Comprehensive monthly report covering all implementation metrics",
      dashboardName: "Implementation Dashboard",
      generatedAt: "2023-01-15T09:00:00Z",
      status: "failed",
      fileSize: undefined,
      downloadUrl: undefined,
    },
  ],
  "rpt-002": [
    {
      id: "inst-002-1",
      reportId: "rpt-002",
      reportName: "Weekly Impact Metrics",
      reportDescription: "Weekly health outcomes and beneficiary impact analysis",
      dashboardName: "Impact Dashboard",
      generatedAt: "2023-05-22T08:00:00Z",
      status: "completed",
      fileSize: "1.8 MB",
      downloadUrl: "/reports/weekly-impact-may-22-2023.pdf",
    },
    {
      id: "inst-002-2",
      reportId: "rpt-002",
      reportName: "Weekly Impact Metrics",
      reportDescription: "Weekly health outcomes and beneficiary impact analysis",
      dashboardName: "Impact Dashboard",
      generatedAt: "2023-05-15T08:00:00Z",
      status: "completed",
      fileSize: "1.7 MB",
      downloadUrl: "/reports/weekly-impact-may-15-2023.pdf",
    },
    {
      id: "inst-002-3",
      reportId: "rpt-002",
      reportName: "Weekly Impact Metrics",
      reportDescription: "Weekly health outcomes and beneficiary impact analysis",
      dashboardName: "Impact Dashboard",
      generatedAt: "2023-05-08T08:00:00Z",
      status: "generating",
      fileSize: undefined,
      downloadUrl: undefined,
    },
  ],
}

interface ReportInstancesViewProps {
  report: Report
  onInstanceSelect: (instance: ReportInstance) => void
  onBack: () => void
}

export function ReportInstancesView({ report, onInstanceSelect, onBack }: ReportInstancesViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const instances = mockAllInstances[report.id] || []

  // Filter instances
  const filteredInstances = instances.filter((instance) => {
    const matchesSearch =
      searchQuery === "" ||
      format(new Date(instance.generatedAt), "PPP").toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || instance.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "generating":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      case "generating":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{report.name}</h1>
          <p className="text-muted-foreground mb-4">{report.description}</p>

          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Dashboard:</span>
              <span className="font-medium">{report.dashboardName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Frequency:</span>
              <span className="font-medium capitalize">{report.frequency}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Schedule:</span>
              <span className="font-medium">
                {report.frequency === "daily" ? "Daily" : report.frequency === "weekly" ? "Mondays" : "1st of month"} at{" "}
                {report.time}
              </span>
            </div>
            <Badge variant="outline" className={getStatusColor(report.status)}>
              {report.status}
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="generating">Generating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Instances List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredInstances.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No instances found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "No report instances have been generated yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInstances.map((instance) => (
              <Card key={instance.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(instance.status)}
                      <div>
                        <h3 className="font-medium">
                          {format(new Date(instance.generatedAt), "EEE, MMMM d, yyyy 'at' h:mm a")}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>Dashboard: {instance.dashboardName}</span>
                          {instance.fileSize && <span>Size: {instance.fileSize}</span>}
                          <Badge variant="outline" className={getStatusColor(instance.status)}>
                            {instance.status}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onInstanceSelect(instance)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      {instance.status === "completed" && instance.downloadUrl && (
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
