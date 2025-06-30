"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MetricCard } from "./metric-card"
import { BarChart3, Users, Heart, Baby, Shield, Clock, Target, Plus } from "lucide-react"
import { MetricFormDialog } from "./metric-form-dialog"

// Mock metrics data for maternal health organization
const metricsData = [
  {
    id: "maternal-mortality",
    name: "Maternal Mortality Rate",
    description: "Deaths per 100,000 live births",
    category: "Health Outcomes",
    currentValue: 145,
    unit: "per 100k",
    target: 120,
    trend: -8.2,
    icon: Heart,
    color: "red",
    timeSeriesData: {
      week: [152, 148, 151, 149, 147, 146, 145],
      month: [165, 158, 152, 148, 145],
      quarter: [180, 165, 152, 145],
      year: [220, 195, 175, 160, 145],
    },
    dataSource: {
      table: "maternal_deaths",
      field: "death_count",
      calculation: "SUM",
      filter: "WHERE outcome = 'death' AND cause LIKE 'maternal%'",
      aggregation: "monthly",
    },
  },
  {
    id: "anc-coverage",
    name: "Antenatal Care Coverage",
    description: "Percentage of pregnant women receiving ANC",
    category: "Service Delivery",
    currentValue: 87.3,
    unit: "%",
    target: 95,
    trend: 5.7,
    icon: Shield,
    color: "blue",
    timeSeriesData: {
      week: [86.1, 86.5, 86.8, 87.0, 87.1, 87.2, 87.3],
      month: [84.2, 85.1, 86.0, 86.8, 87.3],
      quarter: [82.5, 84.8, 86.2, 87.3],
      year: [78.2, 81.5, 84.7, 86.9, 87.3],
    },
    dataSource: {
      table: "antenatal_visits",
      field: "visit_count",
      calculation: "COUNT(DISTINCT patient_id) / (SELECT COUNT(*) FROM pregnancies WHERE status = 'active') * 100",
      filter: "WHERE visit_type = 'antenatal'",
      aggregation: "monthly",
    },
  },
  {
    id: "skilled-birth",
    name: "Skilled Birth Attendance",
    description: "Births attended by skilled health personnel",
    category: "Service Delivery",
    currentValue: 92.1,
    unit: "%",
    target: 98,
    trend: 3.4,
    icon: Baby,
    color: "green",
    timeSeriesData: {
      week: [91.5, 91.7, 91.8, 92.0, 92.0, 92.1, 92.1],
      month: [90.8, 91.2, 91.6, 91.9, 92.1],
      quarter: [89.5, 90.8, 91.5, 92.1],
      year: [85.2, 87.8, 90.1, 91.4, 92.1],
    },
    dataSource: {
      table: "deliveries",
      field: "id",
      calculation: "COUNT(CASE WHEN attended_by IN ('doctor', 'nurse', 'midwife') THEN 1 END) / COUNT(*) * 100",
      filter: "",
      aggregation: "monthly",
    },
  },
  {
    id: "postnatal-care",
    name: "Postnatal Care Coverage",
    description: "Women receiving postnatal care within 48 hours",
    category: "Service Delivery",
    currentValue: 78.9,
    unit: "%",
    target: 85,
    trend: 2.1,
    icon: Users,
    color: "purple",
    timeSeriesData: {
      week: [78.2, 78.4, 78.6, 78.7, 78.8, 78.9, 78.9],
      month: [77.1, 77.8, 78.2, 78.6, 78.9],
      quarter: [75.8, 77.2, 78.1, 78.9],
      year: [72.5, 74.8, 76.9, 78.2, 78.9],
    },
    dataSource: {
      table: "postnatal_visits",
      field: "id",
      calculation: "COUNT(DISTINCT patient_id) / (SELECT COUNT(*) FROM deliveries) * 100",
      filter: "WHERE hours_since_delivery <= 48",
      aggregation: "monthly",
    },
  },
  {
    id: "emergency-obstetric",
    name: "Emergency Obstetric Care",
    description: "Availability of comprehensive EmOC facilities",
    category: "Infrastructure",
    currentValue: 68.4,
    unit: "%",
    target: 80,
    trend: 1.8,
    icon: Clock,
    color: "orange",
    timeSeriesData: {
      week: [68.0, 68.1, 68.2, 68.3, 68.3, 68.4, 68.4],
      month: [67.2, 67.6, 68.0, 68.2, 68.4],
      quarter: [66.1, 67.0, 67.8, 68.4],
      year: [62.5, 64.8, 66.7, 67.9, 68.4],
    },
    dataSource: {
      table: "facilities",
      field: "id",
      calculation: "COUNT(CASE WHEN emoc_level = 'comprehensive' THEN 1 END) / COUNT(*) * 100",
      filter: "WHERE facility_type IN ('hospital', 'health center')",
      aggregation: "quarterly",
    },
  },
  {
    id: "family-planning",
    name: "Family Planning Coverage",
    description: "Women using modern contraceptive methods",
    category: "Reproductive Health",
    currentValue: 73.6,
    unit: "%",
    target: 80,
    trend: 4.2,
    icon: Target,
    color: "teal",
    timeSeriesData: {
      week: [72.8, 73.0, 73.2, 73.4, 73.5, 73.6, 73.6],
      month: [71.5, 72.1, 72.8, 73.2, 73.6],
      quarter: [69.8, 71.2, 72.5, 73.6],
      year: [65.2, 68.1, 70.8, 72.4, 73.6],
    },
    dataSource: {
      table: "family_planning",
      field: "method",
      calculation:
        "COUNT(DISTINCT patient_id) / (SELECT COUNT(*) FROM patients WHERE gender = 'female' AND age BETWEEN 15 AND 49) * 100",
      filter: "WHERE method_type = 'modern'",
      aggregation: "monthly",
    },
  },
]

const categories = ["All", "Health Outcomes", "Service Delivery", "Infrastructure", "Reproductive Health"]

export function MetricsView() {
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [timeHorizon, setTimeHorizon] = useState<"week" | "month" | "quarter" | "year">("month")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingMetric, setEditingMetric] = useState<any>(null)

  const filteredMetrics =
    selectedCategory === "All" ? metricsData : metricsData.filter((metric) => metric.category === selectedCategory)

  const handleCreateMetric = () => {
    setEditingMetric(null)
    setIsDialogOpen(true)
  }

  const handleEditMetric = (metric: any) => {
    setEditingMetric(metric)
    setIsDialogOpen(true)
  }

  const handleSaveMetric = (metricData: any) => {
    console.log("Saving metric:", metricData)
    // Here you would typically save the metric to your backend
    setIsDialogOpen(false)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Metrics</h1>
          <p className="text-muted-foreground">Key performance indicators for maternal health outcomes</p>
        </div>

        <div className="flex gap-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={timeHorizon}
            onValueChange={(value: "week" | "month" | "quarter" | "year") => setTimeHorizon(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="year">Year</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={handleCreateMetric} className="flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Create Metric
          </Button>
        </div>
      </div>

      {/* Category Filter Badges */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge
            key={category}
            variant={selectedCategory === category ? "default" : "secondary"}
            className="cursor-pointer"
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </Badge>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            timeHorizon={timeHorizon}
            onEdit={() => handleEditMetric(metric)}
          />
        ))}
      </div>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Summary Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {filteredMetrics.filter((m) => m.trend > 0).length}
              </div>
              <div className="text-sm text-muted-foreground">Improving Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{filteredMetrics.filter((m) => m.trend < 0).length}</div>
              <div className="text-sm text-muted-foreground">Declining Metrics</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {filteredMetrics.filter((m) => m.currentValue >= m.target).length}
              </div>
              <div className="text-sm text-muted-foreground">Targets Met</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {filteredMetrics.filter((m) => m.currentValue < m.target).length}
              </div>
              <div className="text-sm text-muted-foreground">Below Target</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metric Form Dialog */}
      <MetricFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        metric={editingMetric}
        onSave={handleSaveMetric}
      />
    </div>
  )
}
