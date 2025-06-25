"use client"

import { MainLayout } from "@/components/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Upload, Download, RefreshCw, BarChart3, Settings } from "lucide-react"
import { useEffect } from "react"
import { AuthGuard } from "@/components/auth-guard"

export default function DataPage() {
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("authToken")) {
      window.location.href = "/login";
    }
  }, []);

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex-1 space-y-8 p-8">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
            <p className="text-muted-foreground">
              Manage your maternal health program data sources and integrations
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <CardTitle>Import Data</CardTitle>
                </div>
                <CardDescription>
                  Upload new data files or connect external data sources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  Import Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Download className="h-5 w-5" />
                  <CardTitle>Export Data</CardTitle>
                </div>
                <CardDescription>
                  Download data in various formats for analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Export Data
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <RefreshCw className="h-5 w-5" />
                  <CardTitle>Sync Status</CardTitle>
                </div>
                <CardDescription>
                  Monitor data synchronization and refresh status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Check Status
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Data Sources</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-5 w-5" />
                      <CardTitle>Health Information System</CardTitle>
                    </div>
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                  </div>
                  <CardDescription>
                    Connected • Last sync: 2 hours ago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Records:</span>
                      <span>12,453</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span className="text-green-600">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5" />
                      <CardTitle>Program Monitoring</CardTitle>
                    </div>
                    <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
                  </div>
                  <CardDescription>
                    Syncing • Last sync: 5 minutes ago
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Records:</span>
                      <span>8,921</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <span className="text-yellow-600">Syncing</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Data Quality</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Completeness</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">94.2%</div>
                  <p className="text-xs text-muted-foreground">+2.1% from last week</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Accuracy</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">98.7%</div>
                  <p className="text-xs text-muted-foreground">Excellent quality</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Freshness</CardTitle>
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3h</div>
                  <p className="text-xs text-muted-foreground">Average delay</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  )
} 