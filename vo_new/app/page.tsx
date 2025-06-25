"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Database, AlertTriangle, ArrowRight } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"

// Quick access cards for different sections
const quickAccessItems = [
  {
    title: "Impact Dashboards",
    description: "Monitor maternal health program performance and outcomes",
    icon: BarChart3,
    href: "/dashboards",
    color: "bg-blue-500",
  },
  {
    title: "Reports",
    description: "Generate and view detailed program reports",
    icon: FileText,
    href: "/reports", 
    color: "bg-green-500",
  },
  {
    title: "Metrics",
    description: "Track and analyze key performance metrics",
    icon: Database,
    href: "/metrics",
    color: "bg-purple-500",
  },
  {
    title: "Alerts & Notifications",
    description: "Stay informed about critical program alerts",
    icon: AlertTriangle,
    href: "/alerts",
    color: "bg-orange-500",
  },
]

export default function Home() {
  const router = useRouter()

  // Auto-redirect to dashboards after 3 seconds (optional)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push('/dashboards')
  //   }, 3000)
  //   return () => clearTimeout(timer)
  // }, [router])

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex-1 space-y-8 p-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to Dalgo
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Your comprehensive maternal health program management platform. 
              Monitor impact, track performance, and make data-driven decisions to improve healthcare outcomes.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Quick Access</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickAccessItems.map((item) => (
                <Card key={item.title} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(item.href)}>
                  <CardHeader className="space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                    <Button variant="ghost" size="sm" className="mt-4 p-0 h-auto">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Getting Started</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>View Impact Dashboards</CardTitle>
                  <CardDescription>
                    Explore comprehensive analytics and visualizations of your maternal health programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push('/dashboards')} className="w-full">
                    Open Dashboards
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>
                    Create detailed reports for stakeholders and program evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push('/reports')} variant="outline" className="w-full">
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity or Key Metrics Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">System Overview</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Points</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,432</div>
                  <p className="text-xs text-muted-foreground">Updated today</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">2 require attention</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  )
}
