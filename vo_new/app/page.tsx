"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, FileText, Database, AlertTriangle, ArrowRight, Download, Image, GripVertical } from "lucide-react"
import ReactECharts from 'echarts-for-react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

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

// Sortable Chart Component
interface SortableChartProps {
  id: string
  chartOption: any
  chartRef: React.RefObject<ReactECharts>
  onDownload: () => void
  title: string
}

function SortableChart({ id, chartOption, chartRef, onDownload, title }: SortableChartProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border shadow-sm p-4 ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
      {...attributes}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
          >
            <Image className="h-4 w-4 mr-2" />
            Download PNG
          </Button>
          <div
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded"
            {...listeners}
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </div>
      <div className="h-80">
        <ReactECharts
          ref={chartRef}
          option={chartOption}
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const chartsContainerRef = useRef<HTMLDivElement>(null)
  const chart1Ref = useRef<ReactECharts>(null)
  const chart2Ref = useRef<ReactECharts>(null)

  // Drag and drop state
  const [chartItems, setChartItems] = useState([
    { id: 'chart1', title: 'Maternal Health Program Performance' },
    { id: 'chart2', title: 'Health Outcome Trends' }
  ])

  // Auto-detected layout state based on drop positions
  const [isVerticalLayout, setIsVerticalLayout] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px of movement before activating drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

  // Drag and drop handler with automatic layout detection
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over, delta } = event

    if (over && active.id !== over.id) {
      // Detect intended layout based on drag direction
      const dragDistanceX = Math.abs(delta.x)
      const dragDistanceY = Math.abs(delta.y)
      
      // If vertical movement is significantly more than horizontal, switch to vertical layout
      // If horizontal movement is more, switch to horizontal layout
      if (dragDistanceY > dragDistanceX * 1.5) {
        setIsVerticalLayout(true)
      } else if (dragDistanceX > dragDistanceY * 1.5) {
        setIsVerticalLayout(false)
      }
      // If movement is roughly equal, keep current layout

      setChartItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
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

  // Helper function to get chart data based on current order
  const getChartData = (chartId: string) => {
    if (chartId === 'chart1') {
      return {
        option: barChartOption,
        ref: chart1Ref,
        filename: 'maternal-health-performance.png'
      }
    } else {
      return {
        option: lineChartOption,
        ref: chart2Ref,
        filename: 'health-outcome-trends.png'
      }
    }
  }

    const downloadDashboardAsPDF = async () => {
    try {
      // Get chart instances based on current order
      const firstChart = getChartData(chartItems[0].id)
      const secondChart = getChartData(chartItems[1].id)
      
      const firstInstance = firstChart.ref.current?.getEchartsInstance()
      const secondInstance = secondChart.ref.current?.getEchartsInstance()
      
      if (!firstInstance || !secondInstance) {
        alert('Charts are not ready. Please try again in a moment.')
        return
      }

      // Get high-quality images from both charts in current order
      const firstDataURL = firstInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })
      
      const secondDataURL = secondInstance.getDataURL({
        type: 'png',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })

      // Create PDF with appropriate orientation
      const pdf = new jsPDF(isVerticalLayout ? 'p' : 'l', 'mm', 'a4')
      const pageWidth = isVerticalLayout ? 210 : 297
      const pageHeight = isVerticalLayout ? 297 : 210
      const margin = 10

      let chartWidth: number, chartHeight: number
      let firstX: number, firstY: number, secondX: number, secondY: number

      if (isVerticalLayout) {
        // Vertical layout: charts stacked on top of each other
        chartWidth = pageWidth - margin * 2
        chartHeight = (pageHeight - 80) / 2 - margin // Split available height
        firstX = margin
        firstY = 50
        secondX = margin
        secondY = firstY + chartHeight + margin * 2
      } else {
        // Horizontal layout: charts side by side
        chartWidth = (pageWidth - margin * 3) / 2
        chartHeight = 120
        firstX = margin
        firstY = 40
        secondX = margin * 2 + chartWidth
        secondY = 40
      }

      // Add title
      pdf.setFontSize(20)
      pdf.setTextColor(0, 0, 0)
      pdf.text('Dalgo Analytics Dashboard', pageWidth / 2, 20, { align: 'center' })
      
      pdf.setFontSize(12)
      pdf.text('Generated on: ' + new Date().toLocaleDateString(), pageWidth / 2, 30, { align: 'center' })

      // Add charts in current order and layout
      pdf.addImage(firstDataURL, 'PNG', firstX, firstY, chartWidth, chartHeight)
      pdf.addImage(secondDataURL, 'PNG', secondX, secondY, chartWidth, chartHeight)

      // Add chart titles in current order
      pdf.setFontSize(14)
      if (isVerticalLayout) {
        pdf.text(chartItems[0].title, pageWidth / 2, firstY - 5, { align: 'center' })
        pdf.text(chartItems[1].title, pageWidth / 2, secondY - 5, { align: 'center' })
      } else {
        pdf.text(chartItems[0].title, firstX + chartWidth / 2, 35, { align: 'center' })
        pdf.text(chartItems[1].title, secondX + chartWidth / 2, 35, { align: 'center' })
      }

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
    <div className="space-y-8">
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
          {/* Drag and Drop Charts Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Drag charts horizontally for side-by-side layout, or vertically to stack them
                </p>
              </div>
              <Button 
                variant="default" 
                size="sm"
                onClick={downloadDashboardAsPDF}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
            
            <div ref={chartsContainerRef}>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={chartItems.map(item => item.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className={`gap-6 transition-all duration-300 ${
                    isVerticalLayout 
                      ? 'flex flex-col max-w-4xl mx-auto' 
                      : 'grid grid-cols-1 lg:grid-cols-2'
                  }`}>
                    {chartItems.map((item) => {
                      const chartData = getChartData(item.id)
                      return (
                        <SortableChart
                          key={item.id}
                          id={item.id}
                          title={item.title}
                          chartOption={chartData.option}
                          chartRef={chartData.ref}
                          onDownload={() => downloadChartAsPNG(chartData.ref, chartData.filename)}
                        />
                      )
                    })}
                  </div>
                </SortableContext>
              </DndContext>
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
  )
}
