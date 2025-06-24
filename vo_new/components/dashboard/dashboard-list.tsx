"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Grid,
  List,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Heart,
  Target,
  Zap,
  Shield,
  Globe,
  Building,
  Calendar,
  FileText,
  Settings,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { apiGet } from "@/lib/api"

interface Dashboard {
  id: string
  dashboard_title: string
  description: string
  category: string
  tags: string[]
  icon: React.ElementType
  changed_on_utc: string
  status: "active" | "draft" | "archived"
  type: string
}

// Icon mapping from string to Lucide React component
const iconMap: Record<string, React.ElementType> = {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Activity,
  Heart,
  Target,
  Zap,
  Shield,
  Globe,
  Building,
  Calendar,
  FileText,
  Settings,
}

export function DashboardList() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  useEffect(() => {
    async function fetchDashboards() {
      setLoading(true)
      setError(null)
      try {
        const data = await apiGet("/api/superset/dashboards/")
        // Map API data to Dashboard type
        const mapped = data.map((d: any) => ({
          ...d,
          icon: iconMap[d.icon] || BarChart3, // fallback icon
        }))
        setDashboards(mapped)
      } catch (err: any) {
        setError(err.message || "Unknown error")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboards()
  }, [])

  // Get unique categories
  const categories = Array.from(new Set(dashboards.map((d) => d.category))).sort()

  // Filter dashboards
  const filteredDashboards = dashboards.filter((dashboard) => {
    const matchesSearch =
      searchQuery === "" ||
      dashboard.dashboard_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dashboard.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dashboard.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = categoryFilter === "all" || dashboard.category === categoryFilter
    const matchesStatus = statusFilter === "all" || dashboard.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  const renderDashboardCard = (dashboard: Dashboard) => {
    const Icon = dashboard.icon

    return (
      <Link key={dashboard.id} href={`/dashboards/${dashboard.id}`}>
        <Card
          className={cn(
            "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02] min-h-[260px] h-full flex flex-col",
            dashboard.status === "draft" && "opacity-75",
            dashboard.status === "archived" && "opacity-50",
          )}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">{dashboard.dashboard_title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {dashboard.category}
                    </Badge>
                    {dashboard.status !== "active" && (
                      <Badge variant={dashboard.status === "draft" ? "secondary" : "outline"} className="text-xs">
                        {dashboard.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CardDescription className="text-sm mb-3">{dashboard.description}</CardDescription>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Updated {dashboard.changed_on_utc}</span>
              <div className="flex gap-1">
                {dashboard.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {dashboard.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{dashboard.tags.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    )
  }

  const renderDashboardListItem = (dashboard: Dashboard) => {
    const Icon = dashboard.icon

    return (
      <Link key={dashboard.id} href={`/dashboards/${dashboard.id}`}>
        <div
          className={cn(
            "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 hover:shadow-sm",
            dashboard.status === "draft" && "opacity-75",
            dashboard.status === "archived" && "opacity-50",
          )}
        >
          <div className="p-2 rounded-lg flex-shrink-0 bg-muted">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium truncate">{dashboard.dashboard_title}</h3>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {dashboard.category}
              </Badge>
              {dashboard.status !== "active" && (
                <Badge
                  variant={dashboard.status === "draft" ? "secondary" : "outline"}
                  className="text-xs flex-shrink-0"
                >
                  {dashboard.status}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate mb-2">{dashboard.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Updated {dashboard.changed_on_utc}</span>
              <div className="flex gap-1">
                {dashboard.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs px-1.5 py-0.5">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        </div>
      </Link>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search dashboards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md ml-auto">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {loading ? "Loading..." : error ? `Error: ${error}` : `${filteredDashboards.length} of ${dashboards.length} dashboards`}
        </div>
      </div>

      {/* Dashboard List */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading dashboards...</div>
        ) : error ? (
          <div className="text-center py-12 text-red-500">{error}</div>
        ) : filteredDashboards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">No dashboards found</div>
            <div className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</div>
          </div>
        ) : (
          <div
            className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch" : "space-y-3")}
          >
            {filteredDashboards.map((dashboard) =>
              viewMode === "grid" ? renderDashboardCard(dashboard) : renderDashboardListItem(dashboard),
            )}
          </div>
        )}
      </div>
    </div>
  )
}
