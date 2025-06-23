"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, ArrowLeft, AlertTriangle, Mail } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

interface AlertCreationStepProps {
  onNext: () => void
  onBack: () => void
}

export function AlertCreationStep({ onNext, onBack }: AlertCreationStepProps) {
  const { data, updateData } = useOnboarding()
  const [alertName, setAlertName] = useState("")
  const [alertDescription, setAlertDescription] = useState("")
  const [condition, setCondition] = useState("")
  const [threshold, setThreshold] = useState("")
  const [severity, setSeverity] = useState("")
  const [email, setEmail] = useState("")

  const handleCreateAlert = () => {
    updateData({
      alert: {
        name: alertName,
        description: alertDescription,
        metric: data.metric?.name,
        condition,
        threshold: Number.parseFloat(threshold),
        severity,
        recipients: [{ email, channels: ["email"] }],
      },
    })
    onNext()
  }

  const canProceed = alertName && alertDescription && condition && threshold && severity && email

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case "low":
        return "bg-blue-100 text-blue-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pt-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Set Up Your First Alert</h1>
        <p className="text-muted-foreground">Get notified when your metrics need attention</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Alert Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="alert-name">Alert Name</Label>
              <Input
                id="alert-name"
                placeholder="e.g., Low Placement Rate Alert"
                value={alertName}
                onChange={(e) => setAlertName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="alert-description">Description</Label>
              <Textarea
                id="alert-description"
                placeholder="Describe when this alert should trigger"
                value={alertDescription}
                onChange={(e) => setAlertDescription(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Metric to Monitor</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">{data.metric?.name || "No metric created yet"}</p>
                <p className="text-sm text-muted-foreground">{data.metric?.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="less_than">Less than</SelectItem>
                    <SelectItem value="greater_than">Greater than</SelectItem>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not equals</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  placeholder="e.g., 75"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email for Notifications</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Alert Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Alert Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="p-4 border rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-6 w-6 text-orange-500 mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{alertName || "Your Alert Name"}</h3>
                      {severity && <Badge className={getSeverityColor(severity)}>{severity}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {alertDescription || "Alert description will appear here"}
                    </p>

                    {condition && threshold && data.metric && (
                      <div className="text-sm">
                        <p className="font-medium">Trigger Condition:</p>
                        <p className="text-muted-foreground">
                          When {data.metric.name} is {condition.replace("_", " ")} {threshold}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Notification Settings</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Email</p>
                      <p className="text-xs text-muted-foreground">{email || "No email configured"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Alert Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Check Frequency:</span>
                    <span>Every 15 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className="text-green-600">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created:</span>
                    <span>Just now</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between mt-8">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleCreateAlert} disabled={!canProceed} className="flex items-center gap-2">
          Create Alert & Finish
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
