"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Database, AlertTriangle, ArrowRight, Download, Image } from "lucide-react"
import { AuthGuard } from "@/components/auth-guard"
import ReactECharts from 'echarts-for-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Quick access cards for different sections
const quickAccessItems = [
  {
    title: "Impact Dashboards",
    description: "Monitor maternal health program performance and outcomes",
    icon: BarChart3,
    href: "/dashboards",
    color: "bg-blue-500",
  },
  {
    title: "Reports",
    description: "Generate and view detailed program reports",
    icon: FileText,
    href: "/reports", 
    color: "bg-green-500",
  },
  {
    title: "Metrics",
    description: "Track and analyze key performance metrics",
    icon: Database,
    href: "/metrics",
    color: "bg-purple-500",
  },
  {
    title: "Alerts & Notifications",
    description: "Stay informed about critical program alerts",
    icon: AlertTriangle,
    href: "/alerts",
    color: "bg-orange-500",
  },
]

export default function Home() {
  const router = useRouter()
  const chartsContainerRef = useRef<HTMLDivElement>(null)
  const chart1Ref = useRef<ReactECharts>(null)
  const chart2Ref = useRef<ReactECharts>(null)

  // Auto-redirect to dashboards after 3 seconds (optional)
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     router.push('/dashboards')
  //   }, 3000)
  //   return () => clearTimeout(timer)
  // }, [router])

  // Chart data
  const barChartOption = {
    title: {
      text: 'Maternal Health Program Performance',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Prenatal Visits', 'Deliveries', 'Postnatal Care'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: 'Prenatal Visits',
        type: 'bar',
        data: [120, 132, 101, 134, 90, 230],
        itemStyle: { color: '#3b82f6' }
      },
      {
        name: 'Deliveries',
        type: 'bar',
        data: [220, 182, 191, 234, 290, 330],
        itemStyle: { color: '#10b981' }
      },
      {
        name: 'Postnatal Care',
        type: 'bar',
        data: [150, 232, 201, 154, 190, 330],
        itemStyle: { color: '#8b5cf6' }
      }
    ]
  }

  const lineChartOption = {
    title: {
      text: 'Health Outcome Trends',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['Maternal Mortality Rate', 'Infant Mortality Rate', 'Vaccination Rate'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    },
    yAxis: {
      type: 'value',
      name: 'Rate (%)'
    },
    series: [
      {
        name: 'Maternal Mortality Rate',
        type: 'line',
        data: [2.1, 1.9, 2.3, 2.0, 1.8, 1.6],
        itemStyle: { color: '#ef4444' },
        smooth: true
      },
      {
        name: 'Infant Mortality Rate',
        type: 'line',
        data: [3.2, 3.0, 2.8, 2.9, 2.7, 2.5],
        itemStyle: { color: '#f59e0b' },
        smooth: true
      },
      {
        name: 'Vaccination Rate',
        type: 'line',
        data: [85, 87, 89, 91, 93, 95],
        itemStyle: { color: '#059669' },
        smooth: true
      }
    ]
  }

  // Download functions
  const downloadChartAsPNG = async (chartRef: React.RefObject<ReactECharts>, filename: string) => {
    if (chartRef.current) {
      const chartInstance = chartRef.current.getEchartsInstance()
      const url = chartInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
    }
  }

    const downloadDashboardAsPDF = async () => {
    try {
      // Get chart images directly from ECharts instances (avoids html2canvas issues)
      const chart1Instance = chart1Ref.current?.getEchartsInstance()
      const chart2Instance = chart2Ref.current?.getEchartsInstance()
      
      if (!chart1Instance || !chart2Instance) {
        alert('Charts are not ready. Please try again in a moment.')
        return
      }

      // Get high-quality images from both charts
      const chart1DataURL = chart1Instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      
      const chart2DataURL = chart2Instance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })

      // Create PDF
      const pdf = new jsPDF('l', 'mm', 'a4') // Landscape A4
      const pageWidth = 297
      const pageHeight = 210
      const margin = 10
      const chartWidth = (pageWidth - margin * 3) / 2 // Two charts side by side with margins
      const chartHeight = 120

      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(0, 0, 0)
      pdf.text('Dalgo Analytics Dashboard', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.text('Generated on: ' + new Date().toLocaleDateString(), pageWidth / 2, 30, { align: 'center' })

      // Add Chart 1
      pdf.addImage(chart1DataURL, 'PNG', margin, 40, chartWidth, chartHeight)
      
      // Add Chart 2
      pdf.addImage(chart2DataURL, 'PNG', margin * 2 + chartWidth, 40, chartWidth, chartHeight)

      // Add chart titles
      pdf.setFontSize(14)
      pdf.text('Maternal Health Program Performance', margin + chartWidth / 2, 35, { align: 'center' })
      pdf.text('Health Outcome Trends', margin * 2 + chartWidth + chartWidth / 2, 35, { align: 'center' })

      // Add footer
      pdf.setFontSize(10)
      pdf.setTextColor(128, 128, 128)
      pdf.text('Dalgo - Maternal Health Analytics Platform', pageWidth / 2, pageHeight - 10, { align: 'center' })

      // Save PDF
      pdf.save('dalgo-dashboard-charts.pdf')
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Unable to generate PDF. Please try downloading individual charts instead.')
    }
  }

  return (
    <AuthGuard>
      <MainLayout>
        <div className="flex-1 space-y-8 p-8">
          {/* Welcome Section */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to Dalgo
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl">
              Your comprehensive maternal health program management platform. 
              Monitor impact, track performance, and make data-driven decisions to improve healthcare outcomes.
            </p>
          </div>
          {/* Charts Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChartAsPNG(chart1Ref, 'maternal-health-performance.png')}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Download Chart 1
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadChartAsPNG(chart2Ref, 'health-outcome-trends.png')}
                >
                  <Image className="h-4 w-4 mr-2" />
                  Download Chart 2
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={downloadDashboardAsPDF}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Dashboard PDF
                </Button>
              </div>
            </div>
            
            <div 
              ref={chartsContainerRef}
              className="bg-white p-6 rounded-lg border shadow-sm"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-96">
                  <ReactECharts
                    ref={chart1Ref}
                    option={barChartOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </div>
                <div className="h-96">
                  <ReactECharts
                    ref={chart2Ref}
                    option={lineChartOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Quick Access</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {quickAccessItems.map((item) => (
                <Card key={item.title} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => router.push(item.href)}>
                  <CardHeader className="space-y-4">
                    <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {item.description}
                    </CardDescription>
                    <Button variant="ghost" size="sm" className="mt-4 p-0 h-auto">
                      Get Started <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Getting Started Section */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Getting Started</h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>View Impact Dashboards</CardTitle>
                  <CardDescription>
                    Explore comprehensive analytics and visualizations of your maternal health programs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push('/dashboards')} className="w-full">
                    Open Dashboards
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Generate Reports</CardTitle>
                  <CardDescription>
                    Create detailed reports for stakeholders and program evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => router.push('/reports')} variant="outline" className="w-full">
                    View Reports
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity or Key Metrics Preview */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">System Overview</h2>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Programs</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">+2 from last month</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Points</CardTitle>
                  <Database className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8,432</div>
                  <p className="text-xs text-muted-foreground">Updated today</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">2 require attention</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </MainLayout>
    </AuthGuard>
  )
}
