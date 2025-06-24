"use client"

import type React from "react"
import { useState } from "react"
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

interface Dashboard {
  id: string
  title: string
  description: string
  category: string
  tags: string[]
  icon: React.ElementType
  lastUpdated: string
  status: "active" | "draft" | "archived"
  type: string
}

const dashboards: Dashboard[] = [
  {
    id: "implementation",
    title: "Implementation Dashboard",
    description: "Track program implementation metrics, field activities, and operational performance",
    category: "Operations",
    tags: ["field-work", "visits", "protocols", "teams"],
    icon: BarChart3,
    lastUpdated: "Monday at 14:30",
    status: "active",
    type: "implementation",
  },
  {
    id: "impact",
    title: "Impact Dashboard",
    description: "Measure program outcomes, beneficiary impact, and health improvements",
    category: "Health Outcomes",
    tags: ["health", "outcomes", "beneficiaries", "impact"],
    icon: TrendingUp,
    lastUpdated: "Monday at 15:30",
    status: "active",
    type: "impact",
  },
  {
    id: "funder",
    title: "Funder Dashboard",
    description: "Key metrics and financial outcomes for program funders and stakeholders",
    category: "Financial",
    tags: ["budget", "roi", "sustainability", "funding"],
    icon: DollarSign,
    lastUpdated: "Monday at 13:30",
    status: "active",
    type: "funder",
  },
  {
    id: "usage",
    title: "Usage Dashboard",
    description: "Platform usage statistics, user engagement, and system performance",
    category: "Technology",
    tags: ["platform", "users", "engagement", "performance"],
    icon: Users,
    lastUpdated: "Monday at 16:00",
    status: "active",
    type: "usage",
  },
  {
    id: "regional-performance",
    title: "Regional Performance",
    description: "Geographic analysis of program performance across different regions",
    category: "Geographic",
    tags: ["regional", "geographic", "performance", "mapping"],
    icon: Globe,
    lastUpdated: "Monday at 12:30",
    status: "active",
    type: "implementation",
  },
  {
    id: "maternal-mortality",
    title: "Maternal Mortality Tracking",
    description: "Specialized dashboard for tracking maternal mortality rates and risk factors",
    category: "Health Outcomes",
    tags: ["mortality", "risk", "maternal", "tracking"],
    icon: Heart,
    lastUpdated: "Monday at 10:30",
    status: "active",
    type: "impact",
  },
  {
    id: "supply-chain",
    title: "Supply Chain Management",
    description: "Monitor inventory levels, supply distribution, and procurement needs",
    category: "Operations",
    tags: ["supplies", "inventory", "procurement", "logistics"],
    icon: Activity,
    lastUpdated: "Sunday at 18:00",
    status: "active",
    type: "implementation",
  },
  {
    id: "training-effectiveness",
    title: "Training Effectiveness",
    description: "Evaluate training programs and their impact on field worker performance",
    category: "Human Resources",
    tags: ["training", "education", "performance", "skills"],
    icon: Target,
    lastUpdated: "Saturday at 16:00",
    status: "active",
    type: "usage",
  },
  {
    id: "emergency-response",
    title: "Emergency Response",
    description: "Real-time monitoring of emergency cases and response times",
    category: "Emergency",
    tags: ["emergency", "response", "alerts", "critical"],
    icon: Zap,
    lastUpdated: "Monday at 11:30",
    status: "active",
    type: "implementation",
  },
  {
    id: "quality-assurance",
    title: "Quality Assurance",
    description: "Monitor data quality, protocol compliance, and service standards",
    category: "Quality",
    tags: ["quality", "compliance", "standards", "audit"],
    icon: Shield,
    lastUpdated: "Monday at 08:30",
    status: "active",
    type: "usage",
  },
  {
    id: "partner-organizations",
    title: "Partner Organizations",
    description: "Track performance and collaboration with partner organizations",
    category: "Partnerships",
    tags: ["partners", "collaboration", "organizations", "network"],
    icon: Building,
    lastUpdated: "Sunday at 20:00",
    status: "active",
    type: "funder",
  },
  {
    id: "monthly-reports",
    title: "Monthly Reports",
    description: "Comprehensive monthly reporting dashboard for all program metrics",
    category: "Reporting",
    tags: ["reports", "monthly", "comprehensive", "metrics"],
    icon: FileText,
    lastUpdated: "Friday at 17:00",
    status: "active",
    type: "funder",
  },
  {
    id: "system-administration",
    title: "System Administration",
    description: "System health, user management, and administrative controls",
    category: "Administration",
    tags: ["admin", "system", "users", "management"],
    icon: Settings,
    lastUpdated: "Monday at 04:30",
    status: "active",
    type: "usage",
  },
  {
    id: "seasonal-trends",
    title: "Seasonal Trends Analysis",
    description: "Analyze seasonal patterns in health outcomes and program effectiveness",
    category: "Analytics",
    tags: ["seasonal", "trends", "patterns", "analysis"],
    icon: Calendar,
    lastUpdated: "Last Monday at 14:00",
    status: "draft",
    type: "impact",
  },
]

export function DashboardList() {
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Get unique categories
  const categories = Array.from(new Set(dashboards.map((d) => d.category))).sort()

  // Filter dashboards
  const filteredDashboards = dashboards.filter((dashboard) => {
    const matchesSearch =
      searchQuery === "" ||
      dashboard.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dashboard.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dashboard.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

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
            "cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
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
                  <CardTitle className="text-base">{dashboard.title}</CardTitle>
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
              <span>Updated {dashboard.lastUpdated}</span>
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
              <h3 className="font-medium truncate">{dashboard.title}</h3>
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
              <span className="text-xs text-muted-foreground">Updated {dashboard.lastUpdated}</span>
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
          {filteredDashboards.length} of {dashboards.length} dashboards
        </div>
      </div>

      {/* Dashboard List */}
      <div>
        {filteredDashboards.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-2">No dashboards found</div>
            <div className="text-sm text-muted-foreground">Try adjusting your search or filter criteria</div>
          </div>
        ) : (
          <div
            className={cn(viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3")}
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
