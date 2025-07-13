"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, User, Mail, Clock, FileText } from "lucide-react"
import type { Report } from "./reports-view"

// Mock dashboards data (same as in dashboard-list.tsx)
const mockDashboards = [
  {
    id: "implementation",
    title: "Implementation Dashboard",
    description: "Track field visits, protocol adherence, and team performance across all regions",
    category: "Operations",
    status: "active",
    tags: ["field-work", "protocols", "performance"],
    lastUpdated: "2023-05-23T14:30:00Z",
    views: 1247,
    owner: "Field Operations Team",
  },
  {
    id: "impact",
    title: "Impact Dashboard",
    description: "Monitor health outcomes, beneficiary reach, and program effectiveness metrics",
    category: "Health",
    status: "active",
    tags: ["health", "outcomes", "beneficiaries"],
    lastUpdated: "2023-05-23T16:45:00Z",
    views: 892,
    owner: "Health Team",
  },
  {
    id: "funder",
    title: "Funder Dashboard",
    description: "Financial metrics, budget utilization, and ROI analysis for stakeholders",
    category: "Finance",
    status: "active",
    tags: ["finance", "budget", "roi"],
    lastUpdated: "2023-05-23T11:20:00Z",
    views: 456,
    owner: "Finance Team",
  },
  {
    id: "usage",
    title: "Usage Dashboard",
    description: "Platform analytics, user engagement, and system performance monitoring",
    category: "Analytics",
    status: "active",
    tags: ["analytics", "users", "performance"],
    lastUpdated: "2023-05-23T18:00:00Z",
    views: 623,
    owner: "Tech Team",
  },
]

interface CreateReportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReportCreated: (report: Report) => void
}

export function CreateReportDialog({ open, onOpenChange, onReportCreated }: CreateReportDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    dashboardId: "",
    frequency: "daily",
    dayOfWeek: "monday",
    dayOfMonth: "1",
    time: "09:00",
    owners: ["current-user@dalgo.org"],
    recipients: [] as string[],
  })
  const [newOwner, setNewOwner] = useState("")
  const [newRecipient, setNewRecipient] = useState("")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    const errors: Record<string, string> = {}
    if (!formData.name.trim()) {
      errors.name = "Report name is required"
    }
    if (!formData.dashboardId) {
      errors.dashboardId = "Dashboard selection is required"
    }
    if (!formData.time) {
      errors.time = "Time is required"
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    // Create new report
    const selectedDashboard = mockDashboards.find((d) => d.id === formData.dashboardId)

    const newReport: Report = {
      id: `rpt-${Math.floor(Math.random() * 10000)}`,
      name: formData.name,
      description: formData.description,
      dashboardId: formData.dashboardId,
      dashboardName: selectedDashboard?.title || "",
      frequency: formData.frequency as "daily" | "weekly" | "monthly",
      time: formData.time,
      owners: formData.owners,
      recipients: formData.recipients,
      createdAt: new Date().toISOString(),
      status: "active",
    }

    onReportCreated(newReport)

    // Reset form
    setFormData({
      name: "",
      description: "",
      dashboardId: "",
      frequency: "daily",
      dayOfWeek: "monday",
      dayOfMonth: "1",
      time: "09:00",
      owners: ["current-user@dalgo.org"],
      recipients: [],
    })
    setFormErrors({})
  }

  const addOwner = () => {
    if (newOwner && !formData.owners.includes(newOwner)) {
      setFormData((prev) => ({
        ...prev,
        owners: [...prev.owners, newOwner],
      }))
      setNewOwner("")
    }
  }

  const removeOwner = (owner: string) => {
    if (owner !== "current-user@dalgo.org") {
      // Don't allow removing current user
      setFormData((prev) => ({
        ...prev,
        owners: prev.owners.filter((o) => o !== owner),
      }))
    }
  }

  const addRecipient = () => {
    if (newRecipient && !formData.recipients.includes(newRecipient)) {
      setFormData((prev) => ({
        ...prev,
        recipients: [...prev.recipients, newRecipient],
      }))
      setNewRecipient("")
    }
  }

  const removeRecipient = (recipient: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r !== recipient),
    }))
  }

  const selectedDashboard = mockDashboards.find((d) => d.id === formData.dashboardId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Report</DialogTitle>
          <DialogDescription>
            Configure a scheduled report to automatically deliver dashboard snapshots to subscribers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-1">
                Report Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                  if (formErrors.name) {
                    setFormErrors((prev) => ({ ...prev, name: "" }))
                  }
                }}
                placeholder="e.g., Monthly Implementation Summary"
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this report covers..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Dashboard Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="dashboard" className="flex items-center gap-1">
                Dashboard Source <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.dashboardId}
                onValueChange={(value) => {
                  setFormData((prev) => ({ ...prev, dashboardId: value }))
                  if (formErrors.dashboardId) {
                    setFormErrors((prev) => ({ ...prev, dashboardId: "" }))
                  }
                }}
              >
                <SelectTrigger className={formErrors.dashboardId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select a dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {mockDashboards.map((dashboard) => (
                    <SelectItem key={dashboard.id} value={dashboard.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{dashboard.title}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.dashboardId && <p className="text-sm text-red-500 mt-1">{formErrors.dashboardId}</p>}

              {selectedDashboard && (
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{selectedDashboard.title}</span>
                    <Badge variant="outline">{selectedDashboard.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedDashboard.description}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Schedule Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Schedule Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="frequency">
                  Frequency <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.frequency}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time">
                  Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.time}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, time: e.target.value }))
                    if (formErrors.time) {
                      setFormErrors((prev) => ({ ...prev, time: "" }))
                    }
                  }}
                  className={formErrors.time ? "border-red-500" : ""}
                />
                {formErrors.time && <p className="text-sm text-red-500 mt-1">{formErrors.time}</p>}
              </div>
            </div>

            {/* Day selection for weekly reports */}
            {formData.frequency === "weekly" && (
              <div>
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select
                  value={formData.dayOfWeek}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, dayOfWeek: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Day selection for monthly reports */}
            {formData.frequency === "monthly" && (
              <div>
                <Label htmlFor="dayOfMonth">Day of Month</Label>
                <Select
                  value={formData.dayOfMonth}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, dayOfMonth: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1st</SelectItem>
                    <SelectItem value="15">15th</SelectItem>
                    <SelectItem value="last">Last day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <Separator />

          {/* Report Owners */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-5 w-5" />
              Report Owners
            </h3>
            <p className="text-sm text-muted-foreground">Report owners can edit, pause, or delete this report.</p>

            <div className="flex gap-2">
              <Input
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="Enter email address"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOwner())}
              />
              <Button type="button" onClick={addOwner} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.owners.map((owner) => (
                <Badge key={owner} variant="secondary" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {owner === "current-user@dalgo.org" ? "You" : owner}
                  {owner !== "current-user@dalgo.org" && (
                    <button
                      type="button"
                      onClick={() => removeOwner(owner)}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Report Recipients */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Report Recipients
            </h3>
            <p className="text-sm text-muted-foreground">
              These people will receive the report via email when it's generated.
            </p>

            <div className="flex gap-2">
              <Input
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="Enter email address"
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRecipient())}
              />
              <Button type="button" onClick={addRecipient} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.recipients.map((recipient) => (
                <Badge key={recipient} variant="outline" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {recipient}
                  <button
                    type="button"
                    onClick={() => removeRecipient(recipient)}
                    className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Report</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
