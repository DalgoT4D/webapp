"use client"

import { Button } from "@/components/ui/button"
import type { DashboardType } from "./dashboard-view"
import { Edit, MessageSquare, Share2, Download } from "lucide-react"
import Link from "next/link"

interface DashboardHeaderProps {
  dashboardType: DashboardType
  isChatOpen: boolean
  onToggleChat: () => void
}

const dashboardTitles: Record<DashboardType, string> = {
  implementation: "Implementation Dashboard",
  impact: "Impact Dashboard",
  funder: "Funder Dashboard",
  usage: "Usage Dashboard",
}

const dashboardDescriptions: Record<DashboardType, string> = {
  implementation: "Track program implementation metrics and field activities",
  impact: "Measure program outcomes and beneficiary impact",
  funder: "Key metrics and outcomes for program funders",
  usage: "Platform usage statistics and user engagement",
}

export function DashboardHeader({
  dashboardType = "implementation",
  isChatOpen = false,
  onToggleChat,
}: DashboardHeaderProps) {
  // Ensure we have a valid dashboard type
  const currentDashboard = dashboardType || "implementation"

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{dashboardTitles[currentDashboard]}</h1>
        <p className="text-muted-foreground">{dashboardDescriptions[currentDashboard]}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant={isChatOpen ? "default" : "outline"} size="sm" onClick={onToggleChat} className="relative">
          <MessageSquare className="h-4 w-4 mr-2" />
          {isChatOpen ? "Close Assistant" : "Ask Assistant"}
          {!isChatOpen && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button variant="default" size="sm" asChild>
          <Link href="/data">
            <Edit className="h-4 w-4 mr-2" />
            Edit Data
          </Link>
        </Button>
      </div>
    </div>
  )
}
