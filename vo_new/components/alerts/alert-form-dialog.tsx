"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Mail, MessageCircle, User } from "lucide-react"

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

interface AlertFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  alert?: Alert | null
  onSave: (alert: Partial<Alert>) => void
}

const availableMetrics = [
  "Maternal Mortality Rate",
  "Antenatal Care Coverage",
  "Skilled Birth Attendance",
  "Postnatal Care Coverage",
  "Emergency Obstetric Care",
  "Family Planning Coverage",
  "Institutional Delivery Rate",
  "Contraceptive Prevalence Rate",
]

const operators = [
  { value: ">", label: "Greater than (>)" },
  { value: "<", label: "Less than (<)" },
  { value: ">=", label: "Greater than or equal (≥)" },
  { value: "<=", label: "Less than or equal (≤)" },
  { value: "=", label: "Equal to (=)" },
  { value: "!=", label: "Not equal to (≠)" },
]

const timePeriods = ["1 hour", "6 hours", "12 hours", "1 day", "3 days", "7 days", "14 days", "30 days"]

const notificationChannels = [
  { value: "email", label: "Email", icon: Mail },
  { value: "whatsapp", label: "WhatsApp", icon: MessageCircle },
]

export function AlertFormDialog({ open, onOpenChange, alert, onSave }: AlertFormDialogProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    severity: "medium" as const,
    conditions: [{ metric: "", operator: ">", threshold: 0, timePeriod: "1 day" }],
    recipients: [] as Array<{
      email: string
      name?: string
      channels: string[]
      phone?: string
    }>,
  })
  const [newRecipient, setNewRecipient] = useState({
    email: "",
    name: "",
    phone: "",
    channels: ["email"] as string[],
  })

  useEffect(() => {
    if (alert) {
      setFormData({
        name: alert.name,
        description: alert.description,
        severity: alert.severity,
        conditions: alert.conditions,
        recipients: alert.recipients || [],
      })
    } else {
      setFormData({
        name: "",
        description: "",
        severity: "medium",
        conditions: [{ metric: "", operator: ">", threshold: 0, timePeriod: "1 day" }],
        recipients: [],
      })
    }
  }, [alert, open])

  const handleSave = () => {
    const metrics = formData.conditions.map((c) => c.metric).filter(Boolean)
    onSave({
      ...formData,
      metrics,
    })
  }

  const addCondition = () => {
    setFormData((prev) => ({
      ...prev,
      conditions: [...prev.conditions, { metric: "", operator: ">", threshold: 0, timePeriod: "1 day" }],
    }))
  }

  const removeCondition = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }))
  }

  const updateCondition = (index: number, field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => (i === index ? { ...condition, [field]: value } : condition)),
    }))
  }

  const addRecipient = () => {
    if (newRecipient.email && !formData.recipients.find((r) => r.email === newRecipient.email)) {
      setFormData((prev) => ({
        ...prev,
        recipients: [...prev.recipients, { ...newRecipient }],
      }))
      setNewRecipient({
        email: "",
        name: "",
        phone: "",
        channels: ["email"],
      })
    }
  }

  const removeRecipient = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((r) => r.email !== email),
    }))
  }

  const updateRecipientChannels = (email: string, channels: string[]) => {
    setFormData((prev) => ({
      ...prev,
      recipients: prev.recipients.map((r) => (r.email === email ? { ...r, channels } : r)),
    }))
  }

  const handleChannelChange = (channel: string, checked: boolean) => {
    setNewRecipient((prev) => ({
      ...prev,
      channels: checked ? [...prev.channels, channel] : prev.channels.filter((c) => c !== channel),
    }))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addRecipient()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{alert ? "Edit Alert" : "Create New Alert"}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="conditions">Conditions</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Alert Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter alert name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity">Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, severity: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this alert monitors"
                rows={3}
              />
            </div>
          </TabsContent>

          <TabsContent value="conditions" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Alert Conditions</h3>
                <Button onClick={addCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {formData.conditions.map((condition, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Condition {index + 1}</CardTitle>
                      {formData.conditions.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeCondition(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Metric</Label>
                        <Select
                          value={condition.metric}
                          onValueChange={(value) => updateCondition(index, "metric", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableMetrics.map((metric) => (
                              <SelectItem key={metric} value={metric}>
                                {metric}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(index, "operator", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {operators.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Threshold Value</Label>
                        <Input
                          type="number"
                          value={condition.threshold}
                          onChange={(e) => updateCondition(index, "threshold", Number.parseFloat(e.target.value) || 0)}
                          placeholder="Enter threshold"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Time Period</Label>
                        <Select
                          value={condition.timePeriod}
                          onValueChange={(value) => updateCondition(index, "timePeriod", value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {timePeriods.map((period) => (
                              <SelectItem key={period} value={period}>
                                {period}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Notification Recipients</h3>

              {/* Add New Recipient */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add New Recipient</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email Address *</Label>
                      <Input
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient((prev) => ({ ...prev, email: e.target.value }))}
                        onKeyPress={handleKeyPress}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Name (Optional)</Label>
                      <Input
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone Number (for WhatsApp)</Label>
                    <Input
                      value={newRecipient.phone}
                      onChange={(e) => setNewRecipient((prev) => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter phone number with country code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Notification Channels</Label>
                    <div className="flex gap-4">
                      {notificationChannels.map((channel) => (
                        <div key={channel.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={`new-${channel.value}`}
                            checked={newRecipient.channels.includes(channel.value)}
                            onCheckedChange={(checked) => handleChannelChange(channel.value, checked as boolean)}
                            disabled={channel.value === "whatsapp" && !newRecipient.phone}
                          />
                          <Label htmlFor={`new-${channel.value}`} className="flex items-center gap-2">
                            <channel.icon className="h-4 w-4" />
                            {channel.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={addRecipient} disabled={!newRecipient.email} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </CardContent>
              </Card>

              {/* Current Recipients */}
              {formData.recipients.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">Current Recipients ({formData.recipients.length})</h4>
                  <div className="space-y-3">
                    {formData.recipients.map((recipient) => (
                      <Card key={recipient.email}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{recipient.name || recipient.email}</span>
                                {recipient.name && (
                                  <span className="text-sm text-muted-foreground">({recipient.email})</span>
                                )}
                              </div>
                              {recipient.phone && (
                                <div className="text-sm text-muted-foreground">Phone: {recipient.phone}</div>
                              )}
                              <div className="flex gap-2">
                                {notificationChannels.map((channel) => (
                                  <div key={channel.value} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${recipient.email}-${channel.value}`}
                                      checked={recipient.channels.includes(channel.value)}
                                      onCheckedChange={(checked) => {
                                        const newChannels = checked
                                          ? [...recipient.channels, channel.value]
                                          : recipient.channels.filter((c) => c !== channel.value)
                                        updateRecipientChannels(recipient.email, newChannels)
                                      }}
                                      disabled={channel.value === "whatsapp" && !recipient.phone}
                                    />
                                    <Label
                                      htmlFor={`${recipient.email}-${channel.value}`}
                                      className="flex items-center gap-1 text-sm"
                                    >
                                      <channel.icon className="h-3 w-3" />
                                      {channel.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRecipient(recipient.email)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{alert ? "Update Alert" : "Create Alert"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
