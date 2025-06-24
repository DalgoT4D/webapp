"use client"

import { useState, useEffect, useRef } from "react"
import { MainLayout } from "@/components/main-layout"
import { DashboardContent } from "@/components/dashboard/dashboard-content"
import { DashboardChat } from "@/components/dashboard/dashboard-chat"
import { ErrorBoundary } from "react-error-boundary"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MessageSquare, Share2, Download, MoreVertical } from "lucide-react"
import Link from "next/link"
import type { DashboardType } from "./dashboard-view"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { apiGet } from "@/lib/api"
import { embedDashboard, EmbedDashboardParams } from "@superset-ui/embedded-sdk"

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

// Fetch dashboard info from backend
type DashboardInfo = {
  id: string;
  title: string;
  description: string;
  type: DashboardType;
};

export function IndividualDashboardView({ dashboardId }: IndividualDashboardViewProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [embedInfo, setEmbedInfo] = useState<null | { uuid: string; host: string; guest_token: string }>(null)
  const [embedLoading, setEmbedLoading] = useState(false)
  const [embedError, setEmbedError] = useState<string | null>(null)
  const supersetContainerRef = useRef<HTMLDivElement>(null)
  const [dashboard, setDashboard] = useState<DashboardInfo | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  // Fetch Superset embed info when dashboardId changes
  useEffect(() => {
    let isMounted = true
    setEmbedLoading(true)
    setEmbedError(null)
    setEmbedInfo(null)
    apiGet(`/api/superset/dashboards/${dashboardId}/embed_info/`)
      .then((data) => {
        if (isMounted) setEmbedInfo(data)
      })
      .catch((err) => {
        if (isMounted) setEmbedError(err.message || "Failed to load embed info")
      })
      .finally(() => {
        if (isMounted) setEmbedLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [dashboardId])

  // Embed the Superset dashboard when embedInfo is available
  useEffect(() => {
    if (embedInfo && supersetContainerRef.current) {
      // Clear previous embed if any
      supersetContainerRef.current.innerHTML = ""
      embedDashboard({
        id: embedInfo.uuid,
        supersetDomain: embedInfo.host,
        mountPoint: supersetContainerRef.current,
        fetchGuestToken: () => Promise.resolve(embedInfo.guest_token),
        dashboardUiConfig: {
              // dashboard UI config: hideTitle, hideTab, hideChartControls, filters.visible, filters.expanded (optional)
              hideTitle: true,
              filters: {
                expanded: true,
              },
            },
      } as EmbedDashboardParams)
    }
  }, [embedInfo])

  // Trigger resize event when chat opens/closes to help charts adapt
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 300) // Small delay to allow transition to complete

    return () => clearTimeout(timer)
  }, [isChatOpen])

  // Fetch dashboard info when dashboardId changes
  useEffect(() => {
    let isMounted = true;
    setDashboardLoading(true);
    setDashboardError(null);
    setDashboard(null);
    apiGet(`/api/superset/dashboards/${dashboardId}`)
      .then((data) => {
        if (isMounted) setDashboard(data);
      })
      .catch((err) => {
        if (isMounted) setDashboardError(err.message || "Failed to load dashboard info");
      })
      .finally(() => {
        if (isMounted) setDashboardLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [dashboardId]);

  if (dashboardLoading) {
    return (
      <MainLayout>
        <div className="p-6 text-center">Loading dashboard info...</div>
      </MainLayout>
    );
  }

  if (dashboardError || !dashboard) {
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
            <p className="text-muted-foreground">{dashboardError || "The requested dashboard could not be found."}</p>
          </div>
        </div>
      </MainLayout>
    );
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
          {/* Superset Embed */}
          <div className="w-full flex flex-col items-center justify-center p-4">
            {embedLoading && <div className="text-muted-foreground">Loading dashboard...</div>}
            {embedError && <div className="text-red-600">{embedError}</div>}
            <div className="embeddedsuperset w-full" style={{ maxWidth: "1600px" }}>
              <div
                ref={supersetContainerRef}
                className="bg-white rounded-lg shadow border"
              />
            </div>
          </div>
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
