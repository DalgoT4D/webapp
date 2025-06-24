"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Plus, Search, Filter } from "lucide-react"
import { AlertCard } from "./alert-card"
import { AlertFormDialog } from "./alert-form-dialog"

interface Alert {
  id: string
  name: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "paused" | "triggered"
  metrics: string[]
  conditions: Array<{
    metric: string
    operator: string
    threshold: number
    timePeriod: string
  }>
  recipients: Array<{
    email: string
    name?: string
    channels: string[]
    phone?: string
  }>
  lastTriggered?: string
  createdAt: string
}

const mockAlerts: Alert[] = [
  {
    id: "1",
    name: "High Maternal Mortality Rate",
    description: "Alert when maternal mortality rate exceeds acceptable threshold for extended periods",
    severity: "critical",
    status: "active",
    metrics: ["Maternal Mortality Rate"],
    conditions: [
      {
        metric: "Maternal Mortality Rate",
        operator: ">",
        threshold: 100,
        timePeriod: "7 days",
      },
    ],
    recipients: [
      {
        email: "health.director@example.com",
        name: "Dr. Sarah Johnson",
        channels: ["email", "whatsapp"],
        phone: "+1234567890",
      },
      {
        email: "emergency.team@example.com",
        name: "Emergency Response Team",
        channels: ["email"],
      },
    ],
    lastTriggered: "2024-01-15T10:30:00Z",
    createdAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Low Antenatal Care Coverage",
    description: "Monitor declining antenatal care coverage rates across regions",
    severity: "high",
    status: "active",
    metrics: ["Antenatal Care Coverage"],
    conditions: [
      {
        metric: "Antenatal Care Coverage",
        operator: "<",
        threshold: 80,
        timePeriod: "14 days",
      },
    ],
    recipients: [
      {
        email: "program.manager@example.com",
        name: "Program Manager",
        channels: ["email", "whatsapp"],
        phone: "+1234567891",
      },
    ],
    createdAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "3",
    name: "Emergency Care Availability",
    description: "Alert when emergency obstetric care availability drops below critical levels",
    severity: "high",
    status: "triggered",
    metrics: ["Emergency Obstetric Care"],
    conditions: [
      {
        metric: "Emergency Obstetric Care",
        operator: "<",
        threshold: 90,
        timePeriod: "3 days",
      },
    ],
    recipients: [
      {
        email: "emergency.coordinator@example.com",
        name: "Emergency Coordinator",
        channels: ["email", "whatsapp"],
        phone: "+1234567892",
      },
    ],
    lastTriggered: "2024-01-20T14:15:00Z",
    createdAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "4",
    name: "Family Planning Coverage Drop",
    description: "Monitor significant drops in family planning coverage and access",
    severity: "medium",
    status: "paused",
    metrics: ["Family Planning Coverage"],
    conditions: [
      {
        metric: "Family Planning Coverage",
        operator: "<",
        threshold: 70,
        timePeriod: "30 days",
      },
    ],
    recipients: [
      {
        email: "family.planning@example.com",
        name: "Family Planning Team",
        channels: ["email"],
      },
    ],
    createdAt: "2024-01-12T00:00:00Z",
  },
  {
    id: "5",
    name: "Skilled Birth Attendance",
    description: "Track skilled birth attendance rates in rural areas",
    severity: "medium",
    status: "active",
    metrics: ["Skilled Birth Attendance"],
    conditions: [
      {
        metric: "Skilled Birth Attendance",
        operator: "<",
        threshold: 85,
        timePeriod: "21 days",
      },
    ],
    recipients: [
      {
        email: "rural.health@example.com",
        name: "Rural Health Team",
        channels: ["email"],
      },
    ],
    createdAt: "2024-01-08T00:00:00Z",
  },
  {
    id: "6",
    name: "Postnatal Care Follow-up",
    description: "Monitor postnatal care follow-up completion rates",
    severity: "low",
    status: "active",
    metrics: ["Postnatal Care Coverage"],
    conditions: [
      {
        metric: "Postnatal Care Coverage",
        operator: "<",
        threshold: 75,
        timePeriod: "28 days",
      },
    ],
    recipients: [
      {
        email: "postnatal.team@example.com",
        name: "Postnatal Care Team",
        channels: ["email"],
      },
    ],
    createdAt: "2024-01-14T00:00:00Z",
  },
]

export function AlertsView() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [severityFilter, setSeverityFilter] = useState<string>("all")
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSearch =
      alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter
    const matchesSeverity = severityFilter === "all" || alert.severity === severityFilter

    return matchesSearch && matchesStatus && matchesSeverity
  })

  const alertCounts = {
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    triggered: alerts.filter((a) => a.status === "triggered").length,
    paused: alerts.filter((a) => a.status === "paused").length,
  }

  const handleCreateAlert = () => {
    setEditingAlert(null)
    setCreateDialogOpen(true)
  }

  const handleEditAlert = (alert: Alert) => {
    setEditingAlert(alert)
    setCreateDialogOpen(true)
  }

  const handleSaveAlert = (alertData: Partial<Alert>) => {
    if (editingAlert) {
      // Update existing alert
      setAlerts((prev) => prev.map((alert) => (alert.id === editingAlert.id ? { ...alert, ...alertData } : alert)))
    } else {
      // Create new alert
      const newAlert: Alert = {
        id: Date.now().toString(),
        name: alertData.name || "",
        description: alertData.description || "",
        severity: alertData.severity || "medium",
        status: "active",
        metrics: alertData.metrics || [],
        conditions: alertData.conditions || [],
        recipients: alertData.recipients || [],
        createdAt: new Date().toISOString(),
      }
      setAlerts((prev) => [newAlert, ...prev])
    }
    setCreateDialogOpen(false)
  }

  const handleDeleteAlert = (alertId: string) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== alertId))
  }

  const handleToggleStatus = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, status: alert.status === "active" ? "paused" : "active" } : alert,
      ),
    )
  }

  return (
    <div className="w-full max-w-none px-6 py-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Alerts</h1>
          <p className="text-muted-foreground text-sm">Monitor and manage alert conditions for your metrics</p>
        </div>
        <Button onClick={handleCreateAlert}>
          <Plus className="h-4 w-4 mr-2" />
          Create Alert
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{alertCounts.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Active</CardTitle>
            <div className="h-2 w-2 bg-green-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{alertCounts.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Triggered</CardTitle>
            <div className="h-2 w-2 bg-red-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{alertCounts.triggered}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Paused</CardTitle>
            <div className="h-2 w-2 bg-gray-500 rounded-full" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{alertCounts.paused}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="triggered">Triggered</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-full sm:w-[160px] h-9">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAlerts.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-8">
                <AlertTriangle className="h-8 w-8 text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold mb-1">No alerts found</h3>
                <p className="text-muted-foreground text-center text-xs mb-3">
                  {searchTerm || statusFilter !== "all" || severityFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first alert to start monitoring your metrics"}
                </p>
                {!searchTerm && statusFilter === "all" && severityFilter === "all" && (
                  <Button onClick={handleCreateAlert} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Alert
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onEdit={handleEditAlert}
              onDelete={handleDeleteAlert}
              onToggleStatus={handleToggleStatus}
            />
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <AlertFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        alert={editingAlert}
        onSave={handleSaveAlert}
      />
    </div>
  )
}
