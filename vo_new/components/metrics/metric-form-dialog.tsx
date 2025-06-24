"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  BarChart3,
  Heart,
  Baby,
  Shield,
  Clock,
  Target,
  Users,
  Activity,
  Thermometer,
  Stethoscope,
  Pill,
  Building,
  DollarSign,
  ArrowUp,
} from "lucide-react"

// Mock data for tables and fields
const mockTables = [
  { id: "patients", name: "Patients", description: "Patient demographic information" },
  { id: "visits", name: "Visits", description: "Patient visit records" },
  { id: "maternal_deaths", name: "Maternal Deaths", description: "Records of maternal mortality" },
  { id: "antenatal_visits", name: "Antenatal Visits", description: "Antenatal care visit records" },
  { id: "deliveries", name: "Deliveries", description: "Birth and delivery records" },
  { id: "postnatal_visits", name: "Postnatal Visits", description: "Postnatal care visit records" },
  { id: "facilities", name: "Facilities", description: "Healthcare facility information" },
  { id: "family_planning", name: "Family Planning", description: "Family planning service records" },
  { id: "pregnancies", name: "Pregnancies", description: "Pregnancy tracking records" },
]

const mockFields = {
  patients: [
    { id: "id", name: "ID", type: "string" },
    { id: "name", name: "Name", type: "string" },
    { id: "age", name: "Age", type: "number" },
    { id: "gender", name: "Gender", type: "string" },
    { id: "location", name: "Location", type: "string" },
  ],
  visits: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "date", name: "Date", type: "date" },
    { id: "reason", name: "Reason", type: "string" },
    { id: "diagnosis", name: "Diagnosis", type: "string" },
  ],
  maternal_deaths: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "date", name: "Date", type: "date" },
    { id: "cause", name: "Cause", type: "string" },
    { id: "death_count", name: "Death Count", type: "number" },
    { id: "outcome", name: "Outcome", type: "string" },
  ],
  antenatal_visits: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "date", name: "Date", type: "date" },
    { id: "visit_count", name: "Visit Count", type: "number" },
    { id: "visit_type", name: "Visit Type", type: "string" },
    { id: "trimester", name: "Trimester", type: "number" },
  ],
  deliveries: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "date", name: "Date", type: "date" },
    { id: "outcome", name: "Outcome", type: "string" },
    { id: "attended_by", name: "Attended By", type: "string" },
    { id: "complications", name: "Complications", type: "string" },
  ],
  postnatal_visits: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "date", name: "Date", type: "date" },
    { id: "hours_since_delivery", name: "Hours Since Delivery", type: "number" },
    { id: "complications", name: "Complications", type: "string" },
  ],
  facilities: [
    { id: "id", name: "ID", type: "string" },
    { id: "name", name: "Name", type: "string" },
    { id: "location", name: "Location", type: "string" },
    { id: "facility_type", name: "Facility Type", type: "string" },
    { id: "emoc_level", name: "EmOC Level", type: "string" },
    { id: "beds", name: "Beds", type: "number" },
  ],
  family_planning: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "date", name: "Date", type: "date" },
    { id: "method", name: "Method", type: "string" },
    { id: "method_type", name: "Method Type", type: "string" },
    { id: "duration", name: "Duration", type: "number" },
  ],
  pregnancies: [
    { id: "id", name: "ID", type: "string" },
    { id: "patient_id", name: "Patient ID", type: "string" },
    { id: "start_date", name: "Start Date", type: "date" },
    { id: "expected_delivery", name: "Expected Delivery", type: "date" },
    { id: "status", name: "Status", type: "string" },
    { id: "risk_level", name: "Risk Level", type: "string" },
  ],
}

const categories = ["Health Outcomes", "Service Delivery", "Infrastructure", "Reproductive Health"]

const calculationTypes = [
  { id: "count", name: "Count", description: "Count of records" },
  { id: "sum", name: "Sum", description: "Sum of values" },
  { id: "average", name: "Average", description: "Average of values" },
  { id: "percentage", name: "Percentage", description: "Percentage calculation" },
  { id: "custom", name: "Custom", description: "Custom SQL formula" },
]

const aggregationPeriods = [
  { id: "daily", name: "Daily" },
  { id: "weekly", name: "Weekly" },
  { id: "monthly", name: "Monthly" },
  { id: "quarterly", name: "Quarterly" },
  { id: "yearly", name: "Yearly" },
]

const iconOptions = [
  { id: "heart", name: "Heart", icon: Heart },
  { id: "baby", name: "Baby", icon: Baby },
  { id: "shield", name: "Shield", icon: Shield },
  { id: "clock", name: "Clock", icon: Clock },
  { id: "target", name: "Target", icon: Target },
  { id: "users", name: "Users", icon: Users },
  { id: "activity", name: "Activity", icon: Activity },
  { id: "thermometer", name: "Thermometer", icon: Thermometer },
  { id: "stethoscope", name: "Stethoscope", icon: Stethoscope },
  { id: "pill", name: "Pill", icon: Pill },
  { id: "building", name: "Building", icon: Building },
  { id: "dollar", name: "Dollar", icon: DollarSign },
]

const colorOptions = [
  { id: "red", name: "Red" },
  { id: "blue", name: "Blue" },
  { id: "green", name: "Green" },
  { id: "purple", name: "Purple" },
  { id: "orange", name: "Orange" },
  { id: "teal", name: "Teal" },
  { id: "pink", name: "Pink" },
  { id: "indigo", name: "Indigo" },
]

interface MetricFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metric?: any
  onSave: (metricData: any) => void
}

export function MetricFormDialog({ open, onOpenChange, metric, onSave }: MetricFormDialogProps) {
  const [activeTab, setActiveTab] = useState("basic")
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
    category: "",
    unit: "",
    target: 0,
    icon: "heart",
    color: "blue",
    dataSource: {
      table: "",
      field: "",
      calculation: "count",
      filter: "",
      aggregation: "monthly",
    },
    higherIsBetter: true,
    customFormula: "",
  })

  const [selectedTable, setSelectedTable] = useState("")
  const [fields, setFields] = useState<any[]>([])

  // Initialize form data when editing an existing metric
  useEffect(() => {
    if (metric) {
      setFormData({
        id: metric.id || "",
        name: metric.name || "",
        description: metric.description || "",
        category: metric.category || "",
        unit: metric.unit || "",
        target: metric.target || 0,
        icon: metric.icon?.name?.toLowerCase() || "heart",
        color: metric.color || "blue",
        dataSource: {
          table: metric.dataSource?.table || "",
          field: metric.dataSource?.field || "",
          calculation: metric.dataSource?.calculation || "count",
          filter: metric.dataSource?.filter || "",
          aggregation: metric.dataSource?.aggregation || "monthly",
        },
        higherIsBetter: metric.trend > 0,
        customFormula: metric.dataSource?.calculation.includes("(") ? metric.dataSource?.calculation : "",
      })

      if (metric.dataSource?.table) {
        setSelectedTable(metric.dataSource.table)
        setFields(mockFields[metric.dataSource.table as keyof typeof mockFields] || [])
      }
    }
  }, [metric])

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleDataSourceChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      dataSource: {
        ...prev.dataSource,
        [field]: value,
      },
    }))
  }

  const handleTableChange = (tableId: string) => {
    setSelectedTable(tableId)
    setFields(mockFields[tableId as keyof typeof mockFields] || [])
    handleDataSourceChange("table", tableId)
    handleDataSourceChange("field", "")
  }

  const handleSave = () => {
    // Create a new ID if creating a new metric
    const metricData = {
      ...formData,
      id: formData.id || `metric-${Date.now()}`,
      // Mock current value and trend for demo purposes
      currentValue: metric?.currentValue || Math.floor(Math.random() * 100),
      trend: formData.higherIsBetter ? Math.random() * 10 : Math.random() * -10,
      // Set the icon component
      icon: iconOptions.find((i) => i.id === formData.icon)?.icon || Heart,
      // Mock time series data
      timeSeriesData: metric?.timeSeriesData || {
        week: Array(7)
          .fill(0)
          .map(() => Math.floor(Math.random() * 100)),
        month: Array(5)
          .fill(0)
          .map(() => Math.floor(Math.random() * 100)),
        quarter: Array(4)
          .fill(0)
          .map(() => Math.floor(Math.random() * 100)),
        year: Array(5)
          .fill(0)
          .map(() => Math.floor(Math.random() * 100)),
      },
    }

    onSave(metricData)
  }

  const getSelectedIcon = () => {
    const iconOption = iconOptions.find((i) => i.id === formData.icon)
    return iconOption ? iconOption.icon : Heart
  }

  const SelectedIcon = getSelectedIcon()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{metric ? "Edit Metric" : "Create New Metric"}</DialogTitle>
          <DialogDescription>
            Configure a metric to track key performance indicators for your organization.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="basic">Basic Information</TabsTrigger>
            <TabsTrigger value="data">Data Source</TabsTrigger>
            <TabsTrigger value="display">Display Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Metric Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Maternal Mortality Rate"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of what this metric measures"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger id="category">
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    placeholder="e.g., %, per 100k"
                    value={formData.unit}
                    onChange={(e) => handleInputChange("unit", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  placeholder="Target value for this metric"
                  value={formData.target.toString()}
                  onChange={(e) => handleInputChange("target", Number.parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="higher-better"
                  checked={formData.higherIsBetter}
                  onCheckedChange={(checked) => handleInputChange("higherIsBetter", checked)}
                />
                <Label htmlFor="higher-better">Higher values are better</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="table">Data Table</Label>
                <Select value={selectedTable} onValueChange={handleTableChange}>
                  <SelectTrigger id="table">
                    <SelectValue placeholder="Select data table" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockTables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTable && (
                  <p className="text-xs text-muted-foreground">
                    {mockTables.find((t) => t.id === selectedTable)?.description}
                  </p>
                )}
              </div>

              {selectedTable && (
                <div className="grid gap-2">
                  <Label htmlFor="field">Field</Label>
                  <Select
                    value={formData.dataSource.field}
                    onValueChange={(value) => handleDataSourceChange("field", value)}
                  >
                    <SelectTrigger id="field">
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name} ({field.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="calculation">Calculation Type</Label>
                <Select
                  value={formData.dataSource.calculation}
                  onValueChange={(value) => handleDataSourceChange("calculation", value)}
                >
                  <SelectTrigger id="calculation">
                    <SelectValue placeholder="Select calculation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {calculationTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.dataSource.calculation === "custom" && (
                <div className="grid gap-2">
                  <Label htmlFor="formula">Custom Formula</Label>
                  <Textarea
                    id="formula"
                    placeholder="e.g., COUNT(CASE WHEN status = 'completed' THEN 1 END) / COUNT(*) * 100"
                    value={formData.customFormula}
                    onChange={(e) => handleInputChange("customFormula", e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use SQL syntax to define your custom calculation formula.
                  </p>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="filter">Filter Condition (Optional)</Label>
                <Textarea
                  id="filter"
                  placeholder="e.g., WHERE status = 'active' AND date > '2023-01-01'"
                  value={formData.dataSource.filter}
                  onChange={(e) => handleDataSourceChange("filter", e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="aggregation">Aggregation Period</Label>
                <Select
                  value={formData.dataSource.aggregation}
                  onValueChange={(value) => handleDataSourceChange("aggregation", value)}
                >
                  <SelectTrigger id="aggregation">
                    <SelectValue placeholder="Select aggregation period" />
                  </SelectTrigger>
                  <SelectContent>
                    {aggregationPeriods.map((period) => (
                      <SelectItem key={period.id} value={period.id}>
                        {period.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Icon</Label>
                <div className="grid grid-cols-6 gap-2">
                  {iconOptions.map((iconOption) => {
                    const IconComponent = iconOption.icon
                    return (
                      <Button
                        key={iconOption.id}
                        type="button"
                        variant={formData.icon === iconOption.id ? "default" : "outline"}
                        className="h-10 w-10 p-0"
                        onClick={() => handleInputChange("icon", iconOption.id)}
                      >
                        <IconComponent className="h-5 w-5" />
                        <span className="sr-only">{iconOption.name}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Color</Label>
                <div className="grid grid-cols-8 gap-2">
                  {colorOptions.map((colorOption) => (
                    <Button
                      key={colorOption.id}
                      type="button"
                      variant="outline"
                      className={`h-8 w-8 rounded-full p-0 ${
                        formData.color === colorOption.id ? "ring-2 ring-offset-2" : ""
                      }`}
                      style={{
                        backgroundColor: `var(--${colorOption.id}-500)`,
                        borderColor: `var(--${colorOption.id}-500)`,
                      }}
                      onClick={() => handleInputChange("color", colorOption.id)}
                    >
                      <span className="sr-only">{colorOption.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-2">Preview</h3>
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center`}
                        style={{
                          backgroundColor: `var(--${formData.color}-50, #f0f9ff)`,
                          color: `var(--${formData.color}-600, #0284c7)`,
                        }}
                      >
                        <SelectedIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{formData.name || "Metric Name"}</CardTitle>
                        <p className="text-xs text-muted-foreground">{formData.description || "Metric description"}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <div className="flex items-end justify-between">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold">75</span>
                          <span className="text-sm text-muted-foreground">{formData.unit || "unit"}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-green-600">
                          <ArrowUp className="h-4 w-4" />
                          5.2%
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Progress</span>
                          <span>
                            75 / {formData.target || 100} {formData.unit || "unit"}
                          </span>
                        </div>
                        {/* Placeholder for Progress component */}
                        <div className="h-2 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <Button variant="ghost" size="sm" className="w-full flex items-center justify-center gap-1 text-xs">
                      <BarChart3 className="h-3 w-3" />
                      Show Trend
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>{metric ? "Update Metric" : "Create Metric"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
