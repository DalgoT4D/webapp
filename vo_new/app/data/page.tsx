"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Database, Upload, ArrowRight, Download, Settings, Cpu, Activity } from "lucide-react"

interface DataSource {
  id: string
  name: string
  type: string
  status: "active" | "pending" | "error"
  lastSync: string
  records: number
}

const mockDataSources: DataSource[] = [
  {
    id: "1",
    name: "Patient Registration System",
    type: "PostgreSQL",
    status: "active",
    lastSync: "2 hours ago",
    records: 45678
  },
  {
    id: "2", 
    name: "Health Facility Data",
    type: "MySQL",
    status: "active",
    lastSync: "1 hour ago",
    records: 12456
  },
  {
    id: "3",
    name: "Supply Chain Management",
    type: "API",
    status: "pending",
    lastSync: "Syncing...",
    records: 8934
  },
  {
    id: "4",
    name: "Financial Records",
    type: "CSV Upload",
    status: "error",
    lastSync: "Failed",
    records: 0
  }
]

const quickActions = [
  {
    title: "Ingest Data",
    description: "Connect and import data from various sources",
    icon: Upload,
    href: "/ingest",
    color: "bg-blue-500"
  },
  {
    title: "Transform Data", 
    description: "Clean, process and transform your datasets",
    icon: Settings,
    href: "/transform",
    color: "bg-green-500"
  },
  {
    title: "Orchestrate Workflows",
    description: "Automate and schedule data processing pipelines",
    icon: Cpu,
    href: "/orchestrate", 
    color: "bg-purple-500"
  }
]

export default function DataPage() {
  const [selectedSource, setSelectedSource] = useState<string | null>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "pending": 
        return "bg-yellow-100 text-yellow-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Data Management</h1>
        <p className="text-muted-foreground">
          Manage your data sources, ingestion, transformation and orchestration workflows
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {quickActions.map((action, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription className="text-sm">
                    {action.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Data Sources */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Data Sources</h2>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Add Data Source
          </Button>
        </div>

        <div className="grid gap-4">
          {mockDataSources.map((source) => (
            <Card 
              key={source.id} 
              className={`cursor-pointer transition-all ${
                selectedSource === source.id ? "ring-2 ring-primary" : "hover:shadow-md"
              }`}
              onClick={() => setSelectedSource(source.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-muted">
                      <Database className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{source.name}</h3>
                      <p className="text-sm text-muted-foreground">{source.type}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{source.records.toLocaleString()} records</p>
                      <p className="text-xs text-muted-foreground">Last sync: {source.lastSync}</p>
                    </div>
                    <Badge className={getStatusColor(source.status)}>
                      {source.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Data Pipeline Status */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Pipeline Activity</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                <CardTitle>Recent Activity</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Patient data sync completed</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Facility data transformation running</span>
                  <span className="text-muted-foreground">1 hour ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Supply chain pipeline failed</span>
                  <span className="text-muted-foreground">30 minutes ago</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                <CardTitle>Data Export</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export Patient Data (CSV)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export Facility Reports (Excel)
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export API Documentation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 