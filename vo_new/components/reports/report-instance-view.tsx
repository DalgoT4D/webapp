"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft,
  Download,
  Share2,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Edit,
  Save,
  X,
} from "lucide-react"
import { format } from "date-fns"
import type { ReportInstance } from "./reports-view"
import { ImplementationDashboard } from "../dashboard/implementation-dashboard"
import { ImpactDashboard } from "../dashboard/impact-dashboard"
import { FunderDashboard } from "../dashboard/funder-dashboard"
import { UsageDashboard } from "../dashboard/usage-dashboard"
import { AnnotatedDashboard } from "./annotated-dashboard"
import { AnnotationsList } from "./annotations-list"
import { DiscussionPanel } from "./discussion-panel"

interface ReportInstanceViewProps {
  instance: ReportInstance
  onBack: () => void
}

export function ReportInstanceView({ instance, onBack }: ReportInstanceViewProps) {
  const [executiveSummary, setExecutiveSummary] = useState(
    "This monthly implementation report shows strong progress across key metrics. Field visit completion rates have improved by 15% compared to last month, with particularly strong performance in rural districts. Supply chain efficiency has reached 94%, indicating successful optimization of our distribution network.\n\nKey areas requiring attention include protocol adherence in urban centers and team performance standardization across regions.",
  )
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  const [tempSummary, setTempSummary] = useState(executiveSummary)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case "generating":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
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

  const handleSaveSummary = () => {
    setExecutiveSummary(tempSummary)
    setIsEditingSummary(false)
  }

  const handleCancelEdit = () => {
    setTempSummary(executiveSummary)
    setIsEditingSummary(false)
  }

  const renderDashboard = () => {
    switch (instance.dashboardName) {
      case "Implementation Dashboard":
        return <ImplementationDashboard />
      case "Impact Dashboard":
        return <ImpactDashboard />
      case "Funder Dashboard":
        return <FunderDashboard />
      case "Usage Dashboard":
        return <UsageDashboard />
      default:
        return <ImplementationDashboard />
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Instances
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">{instance.reportName}</h1>
            <p className="text-muted-foreground mb-4">{instance.reportDescription}</p>

            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(instance.status)}
              <span className="text-lg font-medium">
                {format(new Date(instance.generatedAt), "EEE, MMMM d, yyyy 'at' h:mm a")}
              </span>
              <Badge variant="outline" className={getStatusColor(instance.status)}>
                {instance.status}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {instance.status === "completed" && instance.downloadUrl && (
              <>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Executive Summary
                </CardTitle>
                {!isEditingSummary ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingSummary(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveSummary}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isEditingSummary ? (
                <Textarea
                  value={tempSummary}
                  onChange={(e) => setTempSummary(e.target.value)}
                  className="min-h-[120px] resize-none"
                  placeholder="Add your executive summary and key insights..."
                />
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {executiveSummary || "No executive summary added yet. Click Edit to add insights."}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tabbed Interface */}
          {instance.status === "completed" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Report Content
                </CardTitle>
                <CardDescription>
                  {instance.dashboardName} captured on {format(new Date(instance.generatedAt), "EEE, PPP 'at' p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Tabs defaultValue="dashboard" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
                    <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                    <TabsTrigger value="annotations">Annotations</TabsTrigger>
                    <TabsTrigger value="comments">Comments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="dashboard" className="mt-0">
                    <div className="border-t">
                      <AnnotatedDashboard reportInstanceId={instance.id}>{renderDashboard()}</AnnotatedDashboard>
                    </div>
                  </TabsContent>

                  <TabsContent value="annotations" className="mt-0">
                    <div className="border-t p-6">
                      <AnnotationsList reportInstanceId={instance.id} />
                    </div>
                  </TabsContent>

                  <TabsContent value="comments" className="mt-0">
                    <div className="border-t p-6">
                      <DiscussionPanel reportInstanceId={instance.id} />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : instance.status === "failed" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Generation Failed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 mb-2">The report generation failed due to an error.</p>
                  <p className="text-red-600 text-sm">
                    Common causes include dashboard data unavailability, system maintenance, or configuration issues.
                    Please try regenerating the report or contact support if the issue persists.
                  </p>
                  <div className="mt-4">
                    <Button variant="outline" size="sm">
                      Retry Generation
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 mb-2">Your report is currently being generated.</p>
                  <p className="text-blue-600 text-sm">
                    This process typically takes 2-5 minutes depending on the dashboard complexity and data volume.
                    You'll receive an email notification when the report is ready.
                  </p>
                  <div className="mt-4">
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full w-3/4 animate-pulse"></div>
                    </div>
                    <p className="text-xs text-blue-600 mt-2">Estimated completion: 2-3 minutes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Dashboard Source</label>
                    <p className="text-sm font-medium">{instance.dashboardName}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Generated At</label>
                    <p className="text-sm font-medium">{format(new Date(instance.generatedAt), "PPP 'at' p")}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(instance.status)}
                      <span className="text-sm font-medium capitalize">{instance.status}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {instance.fileSize && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">File Size</label>
                      <p className="text-sm font-medium">{instance.fileSize}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Format</label>
                    <p className="text-sm font-medium">PDF</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Instance ID</label>
                    <p className="text-sm font-mono">{instance.id}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
