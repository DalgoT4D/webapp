"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Search,
  FileText,
  Clock,
  Users,
  Calendar,
  Download,
  Eye,
  MoreHorizontal,
  Play,
  Pause,
  Settings,
} from "lucide-react"
import { format } from "date-fns"
import type { Report, ReportInstance } from "./reports-view"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Mock data
const mockReports: Report[] = [
  {
    id: "rpt-001",
    name: "Monthly Implementation Summary",
    description:
      "Comprehensive monthly report covering all implementation metrics including visit completion, protocol adherence, and team performance",
    dashboardId: "implementation",
    dashboardName: "Implementation Dashboard",
    frequency: "monthly",
    time: "09:00",
    owners: ["current-user"],
    recipients: ["manager@dalgo.org", "director@dalgo.org", "field-coordinator@dalgo.org"],
    createdAt: "2023-05-01T10:00:00Z",
    lastRun: "2023-05-15T09:00:00Z",
    status: "active",
  },
  {
    id: "rpt-002",
    name: "Weekly Impact Metrics",
    description: "Weekly health outcomes and beneficiary impact analysis for program stakeholders",
    dashboardId: "impact",
    dashboardName: "Impact Dashboard",
    frequency: "weekly",
    time: "08:00",
    owners: ["current-user", "health-manager@dalgo.org"],
    recipients: ["stakeholders@dalgo.org", "health-team@dalgo.org"],
    createdAt: "2023-04-15T14:30:00Z",
    lastRun: "2023-05-22T08:00:00Z",
    status: "active",
  },
  {
    id: "rpt-003",
    name: "Funder Quarterly Report",
    description: "Quarterly financial and impact metrics for program funders and donors",
    dashboardId: "funder",
    dashboardName: "Funder Dashboard",
    frequency: "monthly",
    time: "10:00",
    owners: ["current-user"],
    recipients: ["funders@dalgo.org", "finance@dalgo.org"],
    createdAt: "2023-03-01T16:00:00Z",
    lastRun: "2023-05-01T10:00:00Z",
    status: "active",
  },
  {
    id: "rpt-004",
    name: "Daily Usage Analytics",
    description: "Daily platform usage statistics and user engagement metrics",
    dashboardId: "usage",
    dashboardName: "Usage Dashboard",
    frequency: "daily",
    time: "07:00",
    owners: ["current-user", "tech-lead@dalgo.org"],
    recipients: ["tech-team@dalgo.org"],
    createdAt: "2023-05-10T11:00:00Z",
    lastRun: "2023-05-23T07:00:00Z",
    status: "active",
  },
  {
    id: "rpt-005",
    name: "Emergency Response Summary",
    description: "Weekly emergency cases and response time analysis",
    dashboardId: "implementation",
    dashboardName: "Implementation Dashboard",
    frequency: "weekly",
    time: "16:00",
    owners: ["current-user"],
    recipients: ["emergency-team@dalgo.org", "field-managers@dalgo.org"],
    createdAt: "2023-04-20T13:00:00Z",
    status: "paused",
  },
]

const mockRecentInstances: Record<string, ReportInstance[]> = {
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
      status: "completed",
      fileSize: "1.6 MB",
      downloadUrl: "/reports/weekly-impact-may-08-2023.pdf",
    },
  ],
}

const getScheduleDisplay = (frequency: string, time: string) => {
  switch (frequency) {
    case "daily":
      return `Daily at ${time}`
    case "weekly":
      return `Mondays at ${time}`
    case "monthly":
      return `1st of month at ${time}`
    default:
      return `${frequency} at ${time}`
  }
}

interface ReportsListProps {
  onReportSelect: (report: Report) => void
  onCreateReport: () => void
  customReports?: Report[]
}

export function ReportsList({ onReportSelect, onCreateReport, customReports = [] }: ReportsListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [frequencyFilter, setFrequencyFilter] = useState("all")

  // Combine mock reports with any custom reports
  const allReports = [...customReports, ...mockReports]

  // Filter reports
  const filteredReports = allReports.filter((report) => {
    const matchesSearch =
      searchQuery === "" ||
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.dashboardName.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || report.status === statusFilter
    const matchesFrequency = frequencyFilter === "all" || report.frequency === frequencyFilter

    return matchesSearch && matchesStatus && matchesFrequency
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "error":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getFrequencyIcon = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return <Clock className="h-4 w-4" />
      case "weekly":
        return <Calendar className="h-4 w-4" />
      case "monthly":
        return <Calendar className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Scheduled dashboard snapshots delivered to subscribers</p>
          </div>
          <Button onClick={onCreateReport}>
            <Plus className="h-4 w-4 mr-2" />
            Create Report
          </Button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
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
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>

          <Select value={frequencyFilter} onValueChange={setFrequencyFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Frequency</SelectItem>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reports List */}
      <div className="flex-1 overflow-auto p-6">
        {filteredReports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No reports found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all" || frequencyFilter !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Use the Create Report button above to get started"}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredReports.map((report) => {
              const recentInstances = mockRecentInstances[report.id] || []

              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{report.name}</CardTitle>
                          <Badge variant="outline" className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                        <CardDescription className="text-base">{report.description}</CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onReportSelect(report)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View All Instances
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Edit Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {report.status === "active" ? (
                            <DropdownMenuItem>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Report
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <Play className="h-4 w-4 mr-2" />
                              Resume Report
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Key Details Row */}
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{report.dashboardName}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {getFrequencyIcon(report.frequency)}
                          <span className="font-medium capitalize">{report.frequency}</span>
                          <span className="text-muted-foreground">at {report.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{report.recipients.length} recipients</span>
                        </div>
                        {report.lastRun && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Last run {format(new Date(report.lastRun), "MMM d 'at' h:mm a")}</span>
                          </div>
                        )}
                      </div>

                      {/* Most Recent Instance */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-medium text-muted-foreground">Most Recent Instance</h4>
                          <Button variant="ghost" size="sm" onClick={() => onReportSelect(report)} className="text-xs">
                            View All
                          </Button>
                        </div>

                        {recentInstances.length === 0 ? (
                          <div className="text-sm text-muted-foreground py-3 px-4 bg-muted/30 rounded-lg">
                            No instances generated yet
                          </div>
                        ) : (
                          <div
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
                            onClick={() => onReportSelect(report)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  recentInstances[0].status === "completed"
                                    ? "bg-green-500"
                                    : recentInstances[0].status === "failed"
                                      ? "bg-red-500"
                                      : "bg-yellow-500"
                                }`}
                              />
                              <div>
                                <div className="text-sm font-medium">
                                  {format(new Date(recentInstances[0].generatedAt), "EEE, MMM d, yyyy")}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(recentInstances[0].generatedAt), "h:mm a")}
                                </div>
                              </div>
                              {recentInstances[0].fileSize && (
                                <Badge variant="outline" className="text-xs">
                                  {recentInstances[0].fileSize}
                                </Badge>
                              )}
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
