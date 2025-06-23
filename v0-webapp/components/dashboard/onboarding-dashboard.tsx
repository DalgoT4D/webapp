"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MainLayout } from "@/components/main-layout"
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout"
import {
  Plus,
  Users,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  ArrowUpIcon,
  ArrowDownIcon,
  Clock,
  Lightbulb,
  Sparkles,
  Info,
  X,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { MetricFormDialog } from "@/components/metrics/metric-form-dialog"
import { AlertFormDialog } from "@/components/alerts/alert-form-dialog"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"]

const onboardingSteps = [
  { id: 1, name: "Get Started", icon: "Play" },
  { id: 2, name: "Data Source", icon: "Database" },
  { id: 3, name: "Workspace", icon: "Cloud" },
  { id: 4, name: "Transform", icon: "ArrowUpDown" },
  { id: 5, name: "Chart", icon: "BarChart" },
  { id: 6, name: "Metric", icon: "Target" },
  { id: 7, name: "Alert", icon: "Bell" },
]

export function OnboardingDashboard() {
  const [onboardingChart, setOnboardingChart] = useState<any>(null)
  const [isMetricDialogOpen, setIsMetricDialogOpen] = useState(false)
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false)
  const [metrics, setMetrics] = useState<any[]>([])
  const [alerts, setAlerts] = useState<any[]>([])
  const [isAlertsExpanded, setIsAlertsExpanded] = useState(false)
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(6)

  useEffect(() => {
    // Load the chart created during onboarding
    const savedChart = localStorage.getItem("onboardingChart")
    if (savedChart) {
      setOnboardingChart(JSON.parse(savedChart))
    }

    // Load any created metrics
    const savedMetrics = localStorage.getItem("dashboardMetrics")
    if (savedMetrics) {
      setMetrics(JSON.parse(savedMetrics))
    }

    // Load any created alerts
    const savedAlerts = localStorage.getItem("dashboardAlerts")
    if (savedAlerts) {
      setAlerts(JSON.parse(savedAlerts))
    }
  }, [])

  // Show congratulations modal when setup is complete
  useEffect(() => {
    const isComplete = currentStep === 7 && alerts.length > 0
    const hasShownModal = localStorage.getItem("hasShownCongratulationsModal")

    if (isComplete && !hasShownModal) {
      setShowCongratulationsModal(true)
      localStorage.setItem("hasShownCongratulationsModal", "true")
    }
  }, [currentStep, alerts.length])

  const renderOnboardingChart = () => {
    if (!onboardingChart) {
      return (
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <p className="text-gray-500">No chart available</p>
        </div>
      )
    }

    const { type, data, title, xAxis, yAxis } = onboardingChart

    switch (type) {
      case "bar":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={yAxis} fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )

      case "line":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey={xAxis} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey={yAxis} stroke="#0088FE" strokeWidth={2} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        )

      case "pie":
        return (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )

      default:
        return (
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Unsupported chart type</p>
          </div>
        )
    }
  }

  const handleSaveMetric = (metricData: any) => {
    const newMetric = {
      id: Date.now().toString(),
      ...metricData,
      currentValue: Math.floor(Math.random() * 100), // Mock value
      trend: (Math.random() - 0.5) * 20, // Mock trend
      icon: Users, // Default icon
    }

    const updatedMetrics = [...metrics, newMetric]
    setMetrics(updatedMetrics)
    localStorage.setItem("dashboardMetrics", JSON.stringify(updatedMetrics))
    setIsMetricDialogOpen(false)
  }

  const handleSaveAlert = (alertData: any) => {
    const newAlert = {
      id: Date.now().toString(),
      ...alertData,
      status: "active",
      createdAt: new Date().toISOString(),
    }

    const updatedAlerts = [...alerts, newAlert]
    setAlerts(updatedAlerts)
    localStorage.setItem("dashboardAlerts", JSON.stringify(updatedAlerts))
    setIsAlertDialogOpen(false)
  }

  const handleDismissAlert = (alertId: string) => {
    const updatedAlerts = alerts.filter((alert) => alert.id !== alertId)
    setAlerts(updatedAlerts)
    localStorage.setItem("dashboardAlerts", JSON.stringify(updatedAlerts))
  }

  const getRecentlyViewedItems = () => {
    const items = []

    if (onboardingChart) {
      items.push({
        title: onboardingChart.title || "Your First Chart",
        type: "Chart",
        icon: "📊",
        time: "Created during setup",
        href: "#",
      })
    }

    if (metrics.length > 0) {
      items.push({
        title: metrics[0].name,
        type: "Metric",
        icon: "📈",
        time: "Recently created",
        href: "/metrics",
      })
    }

    if (alerts.length > 0) {
      items.push({
        title: alerts[0].name,
        type: "Alert",
        icon: "🔔",
        time: "Recently created",
        href: "/alerts",
      })
    }

    return items
  }

  // Determine current step based on what's completed
  const getCurrentStep = () => {
    if (alerts.length > 0) return 7 // All done
    if (metrics.length > 0) return 7 // Working on alerts
    return 6 // Working on metrics
  }

  useEffect(() => {
    setCurrentStep(getCurrentStep())
  }, [alerts.length, metrics.length])

  const isSetupComplete = currentStep === 7 && alerts.length > 0

  // Determine what needs attention
  const needsMetricSetup = metrics.length === 0
  const needsAlertSetup = metrics.length > 0 && alerts.length === 0

  // If setup is complete, show regular dashboard
  if (isSetupComplete) {
    return (
      <MainLayout>
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Impact at a Glance</h1>
              <p className="text-muted-foreground">Your maternal health program at a glance</p>
            </div>
            <Badge variant="outline" className="text-green-600 border-green-600">
              Setup Complete
            </Badge>
          </div>

          {/* Alert Bar - Top Position */}
          <div className="space-y-3">
            {/* Alerts Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Alerts</h2>
                <Info
                  className="h-4 w-4 text-muted-foreground cursor-help"
                  title="Get notified when a metric crosses a threshold"
                />
              </div>
              <Button
                onClick={() => setIsAlertDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
                disabled={metrics.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {alerts.length === 0 ? "Set Up Alerts" : "Add Alert"}
              </Button>
            </div>

            {/* Single Alert Bar */}
            <div
              className={`rounded-lg border transition-colors ${
                alerts.filter((a) => a.status === "fired").length > 0
                  ? "bg-red-50 border-red-200"
                  : alerts.length > 0
                    ? "bg-green-50 border-green-200"
                    : metrics.length === 0
                      ? "bg-gray-50 border-gray-200"
                      : needsAlertSetup
                        ? "bg-blue-50 border-blue-200 animate-pulse"
                        : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        alerts.filter((a) => a.status === "fired").length > 0
                          ? "text-red-500"
                          : alerts.length > 0
                            ? "text-green-500"
                            : metrics.length === 0
                              ? "text-gray-400"
                              : "text-blue-500"
                      }`}
                    />
                    <div>
                      {alerts.filter((a) => a.status === "fired").length > 0 ? (
                        <span className="text-red-700 font-medium">
                          {alerts.filter((a) => a.status === "fired").length} Alert
                          {alerts.filter((a) => a.status === "fired").length > 1 ? "s" : ""} Active
                        </span>
                      ) : alerts.length > 0 ? (
                        <span className="text-green-700 font-medium">No Urgent Alerts</span>
                      ) : metrics.length === 0 ? (
                        <span className="text-gray-500 font-medium">Set up metrics first to configure alerts</span>
                      ) : (
                        <span className="text-blue-700 font-medium">No alerts configured</span>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {alerts.length > 0
                          ? `${alerts.length} alert${alerts.length > 1 ? "s" : ""} monitoring your metrics`
                          : metrics.length === 0
                            ? "Alerts require metrics to monitor"
                            : "Ready to set up your first alert"}
                      </div>
                    </div>
                  </div>
                  {alerts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                    >
                      {isAlertsExpanded ? "Click to collapse" : "Click to expand"} ↓
                    </Button>
                  )}
                </div>

                {/* Expanded Alert Details - Only show actual configured alerts */}
                {isAlertsExpanded && alerts.length > 0 && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded border-l-4 ${
                          alert.severity === "critical"
                            ? "bg-red-100 border-red-500"
                            : alert.severity === "warning"
                              ? "bg-amber-100 border-amber-500"
                              : "bg-blue-100 border-blue-500"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 ${
                            alert.severity === "critical"
                              ? "text-red-500"
                              : alert.severity === "warning"
                                ? "text-amber-500"
                                : "text-blue-500"
                          }`}
                        />
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              alert.severity === "critical"
                                ? "text-red-800"
                                : alert.severity === "warning"
                                  ? "text-amber-800"
                                  : "text-blue-800"
                            }`}
                          >
                            {alert.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              alert.severity === "critical"
                                ? "text-red-700"
                                : alert.severity === "warning"
                                  ? "text-amber-700"
                                  : "text-blue-700"
                            }`}
                          >
                            {alert.description ||
                              `Alert triggered for ${alert.metric} ${alert.condition} ${alert.threshold}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className={`${
                            alert.severity === "critical"
                              ? "text-red-400 hover:text-red-600"
                              : alert.severity === "warning"
                                ? "text-amber-400 hover:text-amber-600"
                                : "text-blue-400 hover:text-blue-600"
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="space-y-3">
            {/* Unifying CTA Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Key Performance Metrics</h2>
                <Info
                  className="h-4 w-4 text-muted-foreground cursor-help"
                  title="Track the metrics that matter most to your maternal health program"
                />
              </div>
              <Button onClick={() => setIsMetricDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {metrics.length === 0 ? "Set Up Metrics" : "Add Metrics"}
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {metrics.length === 0 ? (
                // Empty state - generic metric placeholders with blinking effect
                <>
                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 1</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <UserCheck className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 2</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <CheckCircle2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 3</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <AlertTriangle className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 4</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                // Show created metrics (keep existing logic)
                metrics
                  .slice(0, 4)
                  .map((metric) => (
                    <Card key={metric.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metric.currentValue}
                          {metric.unit}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className={metric.trend > 0 ? "text-emerald-500" : "text-rose-500"}>
                            {metric.trend > 0 ? (
                              <ArrowUpIcon className="mr-1 h-3 w-3 inline" />
                            ) : (
                              <ArrowDownIcon className="mr-1 h-3 w-3 inline" />
                            )}
                            {Math.abs(metric.trend).toFixed(1)}% from last month
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* Call to Action for Metrics */}
          {metrics.length === 0 && (
            <Card className="bg-blue-50 border-blue-200 animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-blue-100 p-3">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900">Create Your First Metric</h3>
                    <p className="text-blue-700 text-sm">
                      Track key performance indicators for your maternal health program. Start with metrics like
                      maternal mortality rate, antenatal care coverage, or skilled birth attendance.
                    </p>
                  </div>
                  <Button onClick={() => setIsMetricDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                    Create Metric
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content - Three Column Layout with reduced height */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Your Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {onboardingChart?.title || "Your Chart"}
                  <Badge variant="secondary" className="text-xs">
                    Created in Setup
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {onboardingChart?.dataset
                    ? `Based on ${onboardingChart.dataset} dataset`
                    : "Your first visualization"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">{renderOnboardingChart()}</CardContent>
            </Card>

            {/* Middle Column - Key Insights with internal scrolling */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-base">Key Insights</CardTitle>
                  <CardDescription className="text-xs">Advanced data correlations</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto">
                <div className="space-y-3">
                  {onboardingChart ? (
                    <>
                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Geographic Disparity</h3>
                        <p className="text-xs text-muted-foreground">
                          Eastern district: 23% higher risk cases despite similar visit rates. Socioeconomic factors
                          likely contributing.
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Nutritional Protocol Impact</h3>
                        <p className="text-xs text-muted-foreground">
                          Nutritional protocols show 3.2x higher correlation to positive outcomes than other categories.
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Visit Frequency Benefits</h3>
                        <p className="text-xs text-muted-foreground">
                          Bi-weekly visits show 42% better outcomes than monthly schedules.
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Team Performance Factors</h3>
                        <p className="text-xs text-muted-foreground">
                          Cross-trained teams show 37% higher effectiveness. Team D: 90% cross-training rate.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">Insights will appear based on your data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Recommendations with internal scrolling */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                  <CardDescription className="text-xs">Data-driven action items</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto">
                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Eastern District Focus</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Increase resources by 25%. Prioritize 8 missed follow-ups.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Nutritional Training</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target Team C for nutritional protocol training. Pair with Team D members.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Bi-weekly Visits</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Switch high/medium-risk mothers to bi-weekly visits. Could reduce high-risk cases by 28%.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Emergency Supplies</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Initiate emergency procurement for prenatal vitamins to avoid stockout.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Cross-training Expansion</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expand cross-training to all teams. Could improve effectiveness by 37%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recently Viewed Section */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Recently Viewed</CardTitle>
                <CardDescription>Quick access to your recently viewed items</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {getRecentlyViewedItems().length > 0 ? (
                  getRecentlyViewedItems().map((item, index) => (
                    <div key={index} className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <span>{item.type}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">Items you create will appear here for quick access</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Congratulations Modal */}
        {showCongratulationsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-md mx-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Congratulations! 🎉</h2>
              <p className="text-gray-600 mb-6">
                You've successfully set up your Impact at a Glance dashboard! Your data is now connected and ready for
                analysis.
              </p>
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Add more metrics to track additional KPIs</li>
                    <li>• Build comprehensive dashboards for deeper insights</li>
                    <li>• Create reports to share with your team</li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowCongratulationsModal(false)} className="flex-1">
                  Continue Exploring
                </Button>
                <Button
                  onClick={() => {
                    setShowCongratulationsModal(false)
                    // Navigate to metrics page
                    window.location.href = "/metrics"
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Add More Metrics
                </Button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    )
  }

  // Show onboarding layout until setup is complete
  return (
    <OnboardingLayout currentStep={currentStep} steps={onboardingSteps}>
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Impact at a Glance</h1>
              <p className="text-muted-foreground">Your maternal health program at a glance</p>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Setup In Progress
            </Badge>
          </div>

          {/* Alert Bar - Top Position */}
          <div className="space-y-3">
            {/* Alerts Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Alerts</h2>
                <Info
                  className="h-4 w-4 text-muted-foreground cursor-help"
                  title="Get notified when a metric crosses a threshold"
                />
              </div>
              <Button
                onClick={() => setIsAlertDialogOpen(true)}
                className="bg-amber-600 hover:bg-amber-700"
                disabled={metrics.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                {alerts.length === 0 ? "Set Up Alerts" : "Add Alert"}
              </Button>
            </div>

            {/* Single Alert Bar */}
            <div
              className={`rounded-lg border transition-colors ${
                alerts.filter((a) => a.status === "fired").length > 0
                  ? "bg-red-50 border-red-200"
                  : alerts.length > 0
                    ? "bg-green-50 border-green-200"
                    : metrics.length === 0
                      ? "bg-gray-50 border-gray-200"
                      : needsAlertSetup
                        ? "bg-blue-50 border-blue-200 animate-pulse"
                        : "bg-blue-50 border-blue-200"
              }`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle
                      className={`h-5 w-5 ${
                        alerts.filter((a) => a.status === "fired").length > 0
                          ? "text-red-500"
                          : alerts.length > 0
                            ? "text-green-500"
                            : metrics.length === 0
                              ? "text-gray-400"
                              : "text-blue-500"
                      }`}
                    />
                    <div>
                      {alerts.filter((a) => a.status === "fired").length > 0 ? (
                        <span className="text-red-700 font-medium">
                          {alerts.filter((a) => a.status === "fired").length} Alert
                          {alerts.filter((a) => a.status === "fired").length > 1 ? "s" : ""} Active
                        </span>
                      ) : alerts.length > 0 ? (
                        <span className="text-green-700 font-medium">No Urgent Alerts</span>
                      ) : metrics.length === 0 ? (
                        <span className="text-gray-500 font-medium">Set up metrics first to configure alerts</span>
                      ) : (
                        <span className="text-blue-700 font-medium">No alerts configured</span>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {alerts.length > 0
                          ? `${alerts.length} alert${alerts.length > 1 ? "s" : ""} monitoring your metrics`
                          : metrics.length === 0
                            ? "Alerts require metrics to monitor"
                            : "Ready to set up your first alert"}
                      </div>
                    </div>
                  </div>
                  {alerts.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => setIsAlertsExpanded(!isAlertsExpanded)}
                    >
                      {isAlertsExpanded ? "Click to collapse" : "Click to expand"} ↓
                    </Button>
                  )}
                </div>

                {/* Expanded Alert Details - Only show actual configured alerts */}
                {isAlertsExpanded && alerts.length > 0 && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-3 p-3 rounded border-l-4 ${
                          alert.severity === "critical"
                            ? "bg-red-100 border-red-500"
                            : alert.severity === "warning"
                              ? "bg-amber-100 border-amber-500"
                              : "bg-blue-100 border-blue-500"
                        }`}
                      >
                        <AlertTriangle
                          className={`h-4 w-4 mt-0.5 ${
                            alert.severity === "critical"
                              ? "text-red-500"
                              : alert.severity === "warning"
                                ? "text-amber-500"
                                : "text-blue-500"
                          }`}
                        />
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${
                              alert.severity === "critical"
                                ? "text-red-800"
                                : alert.severity === "warning"
                                  ? "text-amber-800"
                                  : "text-blue-800"
                            }`}
                          >
                            {alert.name}
                          </h4>
                          <p
                            className={`text-sm ${
                              alert.severity === "critical"
                                ? "text-red-700"
                                : alert.severity === "warning"
                                  ? "text-amber-700"
                                  : "text-blue-700"
                            }`}
                          >
                            {alert.description ||
                              `Alert triggered for ${alert.metric} ${alert.condition} ${alert.threshold}`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDismissAlert(alert.id)}
                          className={`${
                            alert.severity === "critical"
                              ? "text-red-400 hover:text-red-600"
                              : alert.severity === "warning"
                                ? "text-amber-400 hover:text-amber-600"
                                : "text-blue-400 hover:text-blue-600"
                          }`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Top Metrics Row */}
          <div className="space-y-3">
            {/* Unifying CTA Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">Key Performance Metrics</h2>
                <Info
                  className="h-4 w-4 text-muted-foreground cursor-help"
                  title="Track the metrics that matter most to your maternal health program"
                />
              </div>
              <Button onClick={() => setIsMetricDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                {metrics.length === 0 ? "Set Up Metrics" : "Add Metrics"}
              </Button>
            </div>

            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {metrics.length === 0 ? (
                // Empty state - generic metric placeholders with blinking effect
                <>
                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <Users className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 1</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <UserCheck className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 2</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <CheckCircle2 className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 3</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>

                  <Card className={`border-dashed border-2 border-gray-300 ${needsMetricSetup ? "animate-pulse" : ""}`}>
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="rounded-full bg-gray-100 p-3 mb-3">
                        <AlertTriangle className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-500">Metric 4</p>
                      <p className="text-xs text-gray-400">Not configured</p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                // Show created metrics (keep existing logic)
                metrics
                  .slice(0, 4)
                  .map((metric) => (
                    <Card key={metric.id}>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {metric.currentValue}
                          {metric.unit}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className={metric.trend > 0 ? "text-emerald-500" : "text-rose-500"}>
                            {metric.trend > 0 ? (
                              <ArrowUpIcon className="mr-1 h-3 w-3 inline" />
                            ) : (
                              <ArrowDownIcon className="mr-1 h-3 w-3 inline" />
                            )}
                            {Math.abs(metric.trend).toFixed(1)}% from last month
                          </span>
                        </p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </div>

          {/* Main Content - Three Column Layout with reduced height */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left Column - Your Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {onboardingChart?.title || "Your Chart"}
                  <Badge variant="secondary" className="text-xs">
                    Created in Setup
                  </Badge>
                </CardTitle>
                <CardDescription>
                  {onboardingChart?.dataset
                    ? `Based on ${onboardingChart.dataset} dataset`
                    : "Your first visualization"}
                </CardDescription>
              </CardHeader>
              <CardContent className="h-64">{renderOnboardingChart()}</CardContent>
            </Card>

            {/* Middle Column - Key Insights with internal scrolling */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Lightbulb className="h-5 w-5 text-amber-500" />
                <div>
                  <CardTitle className="text-base">Key Insights</CardTitle>
                  <CardDescription className="text-xs">Advanced data correlations</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto">
                <div className="space-y-3">
                  {onboardingChart ? (
                    <>
                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Geographic Disparity</h3>
                        <p className="text-xs text-muted-foreground">
                          Eastern district: 23% higher risk cases despite similar visit rates. Socioeconomic factors
                          likely contributing.
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Nutritional Protocol Impact</h3>
                        <p className="text-xs text-muted-foreground">
                          Nutritional protocols show 3.2x higher correlation to positive outcomes than other categories.
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Visit Frequency Benefits</h3>
                        <p className="text-xs text-muted-foreground">
                          Bi-weekly visits show 42% better outcomes than monthly schedules.
                        </p>
                      </div>

                      <div className="rounded-lg border p-3">
                        <h3 className="font-medium text-sm mb-2">Team Performance Factors</h3>
                        <p className="text-xs text-muted-foreground">
                          Cross-trained teams show 37% higher effectiveness. Team D: 90% cross-training rate.
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500">Insights will appear based on your data</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right Column - Recommendations with internal scrolling */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Sparkles className="h-5 w-5 text-purple-500" />
                <div>
                  <CardTitle className="text-base">Recommendations</CardTitle>
                  <CardDescription className="text-xs">Data-driven action items</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="h-64 overflow-y-auto">
                <div className="space-y-3">
                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Eastern District Focus</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Increase resources by 25%. Prioritize 8 missed follow-ups.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Nutritional Training</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Target Team C for nutritional protocol training. Pair with Team D members.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Bi-weekly Visits</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Switch high/medium-risk mothers to bi-weekly visits. Could reduce high-risk cases by 28%.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Emergency Supplies</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Initiate emergency procurement for prenatal vitamins to avoid stockout.
                    </p>
                  </div>

                  <div className="rounded-lg border p-3">
                    <h3 className="font-medium text-sm">Cross-training Expansion</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expand cross-training to all teams. Could improve effectiveness by 37%.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recently Viewed Section */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <CardTitle>Recently Viewed</CardTitle>
                <CardDescription>Quick access to your recently viewed items</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {getRecentlyViewedItems().length > 0 ? (
                  getRecentlyViewedItems().map((item, index) => (
                    <div key={index} className="rounded-lg border p-4 hover:bg-accent transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{item.icon}</div>
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                            <span>{item.type}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8">
                    <p className="text-sm text-gray-500">Items you create will appear here for quick access</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add the dialogs here */}
      <MetricFormDialog
        open={isMetricDialogOpen}
        onOpenChange={setIsMetricDialogOpen}
        metric={null}
        onSave={handleSaveMetric}
      />

      <AlertFormDialog
        open={isAlertDialogOpen}
        onOpenChange={setIsAlertDialogOpen}
        alert={null}
        onSave={handleSaveAlert}
      />
    </OnboardingLayout>
  )
}
