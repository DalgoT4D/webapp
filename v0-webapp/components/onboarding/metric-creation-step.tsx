"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowRight, ArrowLeft, Target, TrendingUp } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

interface MetricCreationStepProps {
  onNext: () => void
  onBack: () => void
}

export function MetricCreationStep({ onNext, onBack }: MetricCreationStepProps) {
  const { updateData } = useOnboarding()
  const [metricName, setMetricName] = useState("")
  const [metricDescription, setMetricDescription] = useState("")
  const [metricColumn, setMetricColumn] = useState("")
  const [aggregation, setAggregation] = useState("")
  const [target, setTarget] = useState("")

  const handleCreateMetric = () => {
    updateData({
      metric: {
        name: metricName,
        description: metricDescription,
        column: metricColumn,
        aggregation,
        target: Number.parseFloat(target),
      },
    })
    onNext()
  }

  const canProceed = metricName && metricDescription && metricColumn && aggregation

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center py-4">
        <h1 className="text-2xl font-bold mb-1">Create Your First Metric</h1>
        <p className="text-gray-600 text-sm">Define a key performance indicator to track your progress</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Metric Configuration */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Metric Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metric-name">Metric Name</Label>
                <Input
                  id="metric-name"
                  placeholder="e.g., Student Placement Rate"
                  value={metricName}
                  onChange={(e) => setMetricName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric-description">Description</Label>
                <Textarea
                  id="metric-description"
                  placeholder="Describe what this metric measures"
                  value={metricDescription}
                  onChange={(e) => setMetricDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric-column">Data Column</Label>
                <Select value={metricColumn} onValueChange={setMetricColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column to measure" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Placement_Status">Placement Status</SelectItem>
                    <SelectItem value="Attendance">Attendance</SelectItem>
                    <SelectItem value="Quiz_Score">Quiz Score</SelectItem>
                    <SelectItem value="Course_Enrolled">Course Enrolled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aggregation">Aggregation</Label>
                <Select value={aggregation} onValueChange={setAggregation}>
                  <SelectTrigger>
                    <SelectValue placeholder="How to calculate the metric" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="average">Average</SelectItem>
                    <SelectItem value="sum">Sum</SelectItem>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                    <SelectItem value="min">Minimum</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Value (Optional)</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="e.g., 85"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Metric Preview */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Metric Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Target className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{metricName || "Your Metric Name"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {metricDescription || "Metric description will appear here"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {metricColumn === "Placement_Status" && aggregation === "percentage"
                          ? "80%"
                          : metricColumn === "Attendance" && aggregation === "average"
                            ? "87.6"
                            : metricColumn === "Quiz_Score" && aggregation === "average"
                              ? "85.8"
                              : "--"}
                      </div>
                      <div className="text-sm text-muted-foreground">Current Value</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{target || "--"}</div>
                      <div className="text-sm text-muted-foreground">Target</div>
                    </div>
                  </div>

                  {metricColumn && aggregation && (
                    <div className="mt-4 flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600">+5.2% from last period</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Metric Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Source:</span>
                      <span>{metricColumn || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Calculation:</span>
                      <span>{aggregation || "Not selected"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Update Frequency:</span>
                      <span>Daily</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Navigation */}
      <div className="flex-shrink-0 border-t bg-white px-6 py-4">
        <div className="flex justify-between max-w-6xl mx-auto">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button onClick={handleCreateMetric} disabled={!canProceed} className="flex items-center gap-2">
            Create Metric & Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
