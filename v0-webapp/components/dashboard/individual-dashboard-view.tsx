"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/main-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DashboardChat } from "@/components/dashboard/dashboard-chat"
import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Share2, Download, MoreVertical } from "lucide-react"
import Link from "next/link"
import type { DashboardType } from "./dashboard-view"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface IndividualDashboardViewProps {
  dashboardId: string
}

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <h2 className="text-base font-bold text-red-800">Component Error:</h2>
      <p className="text-sm text-red-600">{error.message}</p>
    </div>
  )
}

// Dashboard metadata mapping
const dashboardMetadata: Record<string, { title: string; description: string; type: DashboardType }> = {
  implementation: {
    title: "Implementation Dashboard",
    description: "Track program implementation metrics and field activities",
    type: "implementation",
  },
  impact: {
    title: "Impact Dashboard",
    description: "Measure program outcomes and beneficiary impact",
    type: "impact",
  },
  funder: {
    title: "Funder Dashboard",
    description: "Key metrics and outcomes for program funders",
    type: "funder",
  },
  usage: {
    title: "Usage Dashboard",
    description: "Platform usage statistics and user engagement",
    type: "usage",
  },
  "regional-performance": {
    title: "Regional Performance",
    description: "Geographic analysis of program performance across different regions",
    type: "implementation",
  },
  "maternal-mortality": {
    title: "Maternal Mortality Tracking",
    description: "Specialized dashboard for tracking maternal mortality rates and risk factors",
    type: "impact",
  },
  "supply-chain": {
    title: "Supply Chain Management",
    description: "Monitor inventory levels, supply distribution, and procurement needs",
    type: "implementation",
  },
  "training-effectiveness": {
    title: "Training Effectiveness",
    description: "Evaluate training programs and their impact on field worker performance",
    type: "usage",
  },
  "emergency-response": {
    title: "Emergency Response",
    description: "Real-time monitoring of emergency cases and response times",
    type: "implementation",
  },
  "quality-assurance": {
    title: "Quality Assurance",
    description: "Monitor data quality, protocol compliance, and service standards",
    type: "usage",
  },
  "partner-organizations": {
    title: "Partner Organizations",
    description: "Track performance and collaboration with partner organizations",
    type: "funder",
  },
  "monthly-reports": {
    title: "Monthly Reports",
    description: "Comprehensive monthly reporting dashboard for all program metrics",
    type: "funder",
  },
  "system-administration": {
    title: "System Administration",
    description: "System health, user management, and administrative controls",
    type: "usage",
  },
  "seasonal-trends": {
    title: "Seasonal Trends Analysis",
    description: "Analyze seasonal patterns in health outcomes and program effectiveness",
    type: "impact",
  },
}

export function IndividualDashboardView({ dashboardId }: IndividualDashboardViewProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Trigger resize event when chat opens/closes to help charts adapt
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 300) // Small delay to allow transition to complete

    return () => clearTimeout(timer)
  }, [isChatOpen])

  // Get dashboard metadata
  const dashboard = dashboardMetadata[dashboardId]

  if (!dashboard) {
    return (
      <MainLayout>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboards">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboards
              </Link>
            </Button>
          </div>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-muted-foreground mb-2">Dashboard Not Found</h1>
            <p className="text-muted-foreground">The requested dashboard could not be found.</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  // Handle element selection for targeted questions
  const handleElementSelect = (elementId: string) => {
    if (elementId) {
      setSelectedElement(elementId)
      setIsChatOpen(true)
    }
  }

  return (
    <MainLayout>
      <div className="flex flex-col h-screen">
        {/* Dashboard Header with navigation and actions */}
        <div className="flex items-center justify-between gap-4 p-4 border-b">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboards">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboards
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={isChatOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="relative"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {isChatOpen ? "Close Assistant" : "Ask Assistant"}
              {!isChatOpen && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                </span>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Dashboard Title and Description */}
        <div className="p-4 border-b">
          <h1 className="text-2xl font-bold tracking-tight">{dashboard.title}</h1>
          <p className="text-muted-foreground">{dashboard.description}</p>
        </div>

        {/* Main content area with chat sidebar */}
        <div className="flex flex-1 overflow-hidden">
          {/* Dashboard Content */}
          <div className={`flex-1 overflow-auto transition-all duration-300 ${isChatOpen ? "md:w-2/3" : "w-full"}`}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
              <DashboardContent
                dashboardType={dashboard.type}
                onElementSelect={handleElementSelect}
                isChatOpen={isChatOpen}
              />
            </ErrorBoundary>
          </div>

          {/* Chat Sidebar */}
          {isChatOpen && (
            <div className="w-full md:w-1/3 border-l border-border overflow-hidden flex flex-col">
              <ErrorBoundary FallbackComponent={ErrorFallback}>
                <DashboardChat
                  dashboardType={dashboard.type}
                  selectedElement={selectedElement}
                  onClose={() => setIsChatOpen(false)}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
