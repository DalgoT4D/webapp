"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FilterValues } from "./dashboard-filters"
import { format } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { RefreshCw, Info, MessageSquare } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface RegionData {
  id: string
  name: string
  riskLevel: "high" | "medium" | "low" | "good"
  visitCompletion: number
  missedFollowUps: number
  protocolAdherence: number
  totalMothers: number
  highRiskCases: number
}

export const regionData: Record<string, RegionData> = {
  "Andhra Pradesh": {
    id: "Andhra Pradesh",
    name: "Andhra Pradesh",
    riskLevel: "medium",
    visitCompletion: 85,
    missedFollowUps: 5,
    protocolAdherence: 80,
    totalMothers: 245,
    highRiskCases: 32,
  },
  "Arunachal Pradesh": {
    id: "Arunachal Pradesh",
    name: "Arunachal Pradesh",
    riskLevel: "medium",
    visitCompletion: 78,
    missedFollowUps: 8,
    protocolAdherence: 75,
    totalMothers: 45,
    highRiskCases: 12,
  },
  Assam: {
    id: "Assam",
    name: "Assam",
    riskLevel: "high",
    visitCompletion: 74,
    missedFollowUps: 14,
    protocolAdherence: 70,
    totalMothers: 180,
    highRiskCases: 28,
  },
  Bihar: {
    id: "Bihar",
    name: "Bihar",
    riskLevel: "high",
    visitCompletion: 65,
    missedFollowUps: 25,
    protocolAdherence: 60,
    totalMothers: 320,
    highRiskCases: 58,
  },
  Chhattisgarh: {
    id: "Chhattisgarh",
    name: "Chhattisgarh",
    riskLevel: "high",
    visitCompletion: 73,
    missedFollowUps: 16,
    protocolAdherence: 69,
    totalMothers: 165,
    highRiskCases: 35,
  },
  Goa: {
    id: "Goa",
    name: "Goa",
    riskLevel: "good",
    visitCompletion: 96,
    missedFollowUps: 1,
    protocolAdherence: 93,
    totalMothers: 25,
    highRiskCases: 2,
  },
  Gujarat: {
    id: "Gujarat",
    name: "Gujarat",
    riskLevel: "medium",
    visitCompletion: 84,
    missedFollowUps: 6,
    protocolAdherence: 79,
    totalMothers: 285,
    highRiskCases: 38,
  },
  Haryana: {
    id: "Haryana",
    name: "Haryana",
    riskLevel: "medium",
    visitCompletion: 83,
    missedFollowUps: 7,
    protocolAdherence: 77,
    totalMothers: 145,
    highRiskCases: 22,
  },
  "Himachal Pradesh": {
    id: "Himachal Pradesh",
    name: "Himachal Pradesh",
    riskLevel: "low",
    visitCompletion: 90,
    missedFollowUps: 3,
    protocolAdherence: 85,
    totalMothers: 65,
    highRiskCases: 8,
  },
  Jharkhand: {
    id: "Jharkhand",
    name: "Jharkhand",
    riskLevel: "high",
    visitCompletion: 67,
    missedFollowUps: 20,
    protocolAdherence: 63,
    totalMothers: 195,
    highRiskCases: 42,
  },
  Karnataka: {
    id: "Karnataka",
    name: "Karnataka",
    riskLevel: "medium",
    visitCompletion: 88,
    missedFollowUps: 4,
    protocolAdherence: 82,
    totalMothers: 275,
    highRiskCases: 28,
  },
  Kerala: {
    id: "Kerala",
    name: "Kerala",
    riskLevel: "good",
    visitCompletion: 97,
    missedFollowUps: 0,
    protocolAdherence: 94,
    totalMothers: 185,
    highRiskCases: 8,
  },
  "Madhya Pradesh": {
    id: "Madhya Pradesh",
    name: "Madhya Pradesh",
    riskLevel: "high",
    visitCompletion: 70,
    missedFollowUps: 18,
    protocolAdherence: 65,
    totalMothers: 385,
    highRiskCases: 68,
  },
  Maharashtra: {
    id: "Maharashtra",
    name: "Maharashtra",
    riskLevel: "high",
    visitCompletion: 76,
    missedFollowUps: 12,
    protocolAdherence: 72,
    totalMothers: 425,
    highRiskCases: 72,
  },
  Manipur: {
    id: "Manipur",
    name: "Manipur",
    riskLevel: "medium",
    visitCompletion: 81,
    missedFollowUps: 6,
    protocolAdherence: 78,
    totalMothers: 35,
    highRiskCases: 8,
  },
  Meghalaya: {
    id: "Meghalaya",
    name: "Meghalaya",
    riskLevel: "medium",
    visitCompletion: 79,
    missedFollowUps: 9,
    protocolAdherence: 76,
    totalMothers: 42,
    highRiskCases: 10,
  },
  Mizoram: {
    id: "Mizoram",
    name: "Mizoram",
    riskLevel: "low",
    visitCompletion: 89,
    missedFollowUps: 4,
    protocolAdherence: 84,
    totalMothers: 28,
    highRiskCases: 5,
  },
  Nagaland: {
    id: "Nagaland",
    name: "Nagaland",
    riskLevel: "medium",
    visitCompletion: 80,
    missedFollowUps: 7,
    protocolAdherence: 77,
    totalMothers: 32,
    highRiskCases: 7,
  },
  Odisha: {
    id: "Odisha",
    name: "Odisha",
    riskLevel: "medium",
    visitCompletion: 80,
    missedFollowUps: 10,
    protocolAdherence: 75,
    totalMothers: 225,
    highRiskCases: 38,
  },
  Punjab: {
    id: "Punjab",
    name: "Punjab",
    riskLevel: "medium",
    visitCompletion: 86,
    missedFollowUps: 4,
    protocolAdherence: 81,
    totalMothers: 155,
    highRiskCases: 18,
  },
  Rajasthan: {
    id: "Rajasthan",
    name: "Rajasthan",
    riskLevel: "high",
    visitCompletion: 72,
    missedFollowUps: 15,
    protocolAdherence: 68,
    totalMothers: 365,
    highRiskCases: 65,
  },
  Sikkim: {
    id: "Sikkim",
    name: "Sikkim",
    riskLevel: "low",
    visitCompletion: 91,
    missedFollowUps: 2,
    protocolAdherence: 87,
    totalMothers: 18,
    highRiskCases: 3,
  },
  "Tamil Nadu": {
    id: "Tamil Nadu",
    name: "Tamil Nadu",
    riskLevel: "low",
    visitCompletion: 95,
    missedFollowUps: 1,
    protocolAdherence: 90,
    totalMothers: 315,
    highRiskCases: 22,
  },
  Telangana: {
    id: "Telangana",
    name: "Telangana",
    riskLevel: "medium",
    visitCompletion: 87,
    missedFollowUps: 3,
    protocolAdherence: 83,
    totalMothers: 185,
    highRiskCases: 24,
  },
  Tripura: {
    id: "Tripura",
    name: "Tripura",
    riskLevel: "medium",
    visitCompletion: 82,
    missedFollowUps: 8,
    protocolAdherence: 79,
    totalMothers: 48,
    highRiskCases: 12,
  },
  "Uttar Pradesh": {
    id: "Uttar Pradesh",
    name: "Uttar Pradesh",
    riskLevel: "high",
    visitCompletion: 68,
    missedFollowUps: 22,
    protocolAdherence: 62,
    totalMothers: 485,
    highRiskCases: 95,
  },
  Uttarakhand: {
    id: "Uttarakhand",
    name: "Uttarakhand",
    riskLevel: "medium",
    visitCompletion: 81,
    missedFollowUps: 9,
    protocolAdherence: 76,
    totalMothers: 85,
    highRiskCases: 15,
  },
  "West Bengal": {
    id: "West Bengal",
    name: "West Bengal",
    riskLevel: "medium",
    visitCompletion: 82,
    missedFollowUps: 8,
    protocolAdherence: 78,
    totalMothers: 295,
    highRiskCases: 42,
  },
  // Union Territories
  "Andaman and Nicobar Islands": {
    id: "Andaman and Nicobar Islands",
    name: "Andaman and Nicobar Islands",
    riskLevel: "low",
    visitCompletion: 88,
    missedFollowUps: 3,
    protocolAdherence: 83,
    totalMothers: 12,
    highRiskCases: 2,
  },
  Chandigarh: {
    id: "Chandigarh",
    name: "Chandigarh",
    riskLevel: "low",
    visitCompletion: 93,
    missedFollowUps: 1,
    protocolAdherence: 89,
    totalMothers: 22,
    highRiskCases: 3,
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    id: "Dadra and Nagar Haveli and Daman and Diu",
    name: "Dadra and Nagar Haveli and Daman and Diu",
    riskLevel: "medium",
    visitCompletion: 85,
    missedFollowUps: 4,
    protocolAdherence: 80,
    totalMothers: 15,
    highRiskCases: 3,
  },
  Delhi: {
    id: "Delhi",
    name: "Delhi",
    riskLevel: "low",
    visitCompletion: 92,
    missedFollowUps: 2,
    protocolAdherence: 88,
    totalMothers: 125,
    highRiskCases: 12,
  },
  "Jammu and Kashmir": {
    id: "Jammu and Kashmir",
    name: "Jammu and Kashmir",
    riskLevel: "medium",
    visitCompletion: 79,
    missedFollowUps: 11,
    protocolAdherence: 74,
    totalMothers: 95,
    highRiskCases: 18,
  },
  Ladakh: {
    id: "Ladakh",
    name: "Ladakh",
    riskLevel: "medium",
    visitCompletion: 77,
    missedFollowUps: 8,
    protocolAdherence: 73,
    totalMothers: 8,
    highRiskCases: 2,
  },
  Lakshadweep: {
    id: "Lakshadweep",
    name: "Lakshadweep",
    riskLevel: "good",
    visitCompletion: 94,
    missedFollowUps: 1,
    protocolAdherence: 91,
    totalMothers: 3,
    highRiskCases: 0,
  },
  Puducherry: {
    id: "Puducherry",
    name: "Puducherry",
    riskLevel: "low",
    visitCompletion: 90,
    missedFollowUps: 2,
    protocolAdherence: 86,
    totalMothers: 18,
    highRiskCases: 3,
  },
}

interface IndiaMapChartProps {
  filters: FilterValues
  onRegionClick: (region: string) => void
  isChatOpen?: boolean
}

export function IndiaMapChart({ filters, onRegionClick, isChatOpen = false }: IndiaMapChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [activeTab, setActiveTab] = useState("map")

  // Format date range for display
  const dateRangeText =
    filters.dateRange.from && filters.dateRange.to
      ? `${format(filters.dateRange.from, "MMM d, yyyy")} - ${format(filters.dateRange.to, "MMM d, yyyy")}`
      : "All time"

  // Group regions by risk level
  const highRiskRegions = Object.values(regionData).filter((region) => region.riskLevel === "high")
  const mediumRiskRegions = Object.values(regionData).filter((region) => region.riskLevel === "medium")
  const lowRiskRegions = Object.values(regionData).filter((region) => region.riskLevel === "low")
  const goodRegions = Object.values(regionData).filter((region) => region.riskLevel === "good")

  // Sort regions by name
  const sortByName = (a: RegionData, b: RegionData) => a.name.localeCompare(b.name)
  highRiskRegions.sort(sortByName)
  mediumRiskRegions.sort(sortByName)
  lowRiskRegions.sort(sortByName)
  goodRegions.sort(sortByName)

  const initializeChart = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Dynamically import ECharts
      const echarts = await import("echarts")

      // Make sure the DOM element is available
      if (!chartRef.current) {
        throw new Error("Chart container not found")
      }

      // Initialize the chart
      const chart = echarts.init(chartRef.current)

      // Try multiple GeoJSON sources for better reliability
      const geoJsonSources = [
        "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson",
        "https://raw.githubusercontent.com/datameet/maps/master/States/india_state.geojson",
        "https://raw.githubusercontent.com/bharath-krishna/india-geojson/master/state/india_state.geojson",
      ]

      let geoJson = null
      let sourceUsed = ""

      for (const source of geoJsonSources) {
        try {
          const response = await fetch(source)
          if (response.ok) {
            geoJson = await response.json()
            sourceUsed = source
            break
          }
        } catch (err) {
          console.warn(`Failed to load from ${source}:`, err)
          continue
        }
      }

      if (!geoJson) {
        throw new Error("Failed to load India GeoJSON data from all sources")
      }

      console.log(`Successfully loaded GeoJSON from: ${sourceUsed}`)

      // Register the map
      echarts.registerMap("india", geoJson)

      // Prepare data for the map with comprehensive metrics
      const mapData = Object.values(regionData).map((region) => {
        // Calculate risk score based on multiple factors
        let riskScore = 0
        const visitWeight = (100 - region.visitCompletion) * 0.3
        const protocolWeight = (100 - region.protocolAdherence) * 0.3
        const missedWeight = region.missedFollowUps * 2
        const highRiskWeight = (region.highRiskCases / region.totalMothers) * 100 * 0.4

        riskScore = visitWeight + protocolWeight + missedWeight + highRiskWeight

        return {
          name: region.name,
          value: Math.round(riskScore),
          riskLevel: region.riskLevel,
          visitCompletion: region.visitCompletion,
          missedFollowUps: region.missedFollowUps,
          protocolAdherence: region.protocolAdherence,
          totalMothers: region.totalMothers,
          highRiskCases: region.highRiskCases,
          riskPercentage: Math.round((region.highRiskCases / region.totalMothers) * 100),
        }
      })

      // Configure the chart with enhanced options
      const option = {
        title: {
          text: "Maternal Health Program - India",
          left: "center",
          top: 10,
          textStyle: {
            fontSize: 16,
            fontWeight: "bold",
            color: "#374151",
          },
        },
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderColor: "#e5e7eb",
          borderWidth: 1,
          textStyle: {
            color: "#374151",
            fontSize: 12,
          },
          formatter: (params: any) => {
            const data = params.data
            if (!data) return ""

            const riskColor =
              data.riskLevel === "high"
                ? "#dc2626"
                : data.riskLevel === "medium"
                  ? "#ea580c"
                  : data.riskLevel === "low"
                    ? "#ca8a04"
                    : "#16a34a"

            return `
              <div style="padding: 12px; min-width: 250px; font-family: system-ui;">
                <div style="font-weight: bold; margin-bottom: 10px; font-size: 14px; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px;">
                  ${params.name}
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                  <div>
                    <div style="color: #6b7280; font-size: 11px;">Total Mothers</div>
                    <div style="font-weight: 600; color: #111827; font-size: 13px;">${data.totalMothers}</div>
                  </div>
                  <div>
                    <div style="color: #6b7280; font-size: 11px;">High Risk Cases</div>
                    <div style="font-weight: 600; color: #dc2626; font-size: 13px;">${data.highRiskCases} (${data.riskPercentage}%)</div>
                  </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 8px;">
                  <div>
                    <div style="color: #6b7280; font-size: 11px;">Visit Completion</div>
                    <div style="font-weight: 600; color: #111827; font-size: 13px;">${data.visitCompletion}%</div>
                  </div>
                  <div>
                    <div style="color: #6b7280; font-size: 11px;">Missed Follow-ups</div>
                    <div style="font-weight: 600; color: #dc2626; font-size: 13px;">${data.missedFollowUps}</div>
                  </div>
                </div>
                
                <div style="margin-bottom: 8px;">
                  <div style="color: #6b7280; font-size: 11px;">Protocol Adherence</div>
                  <div style="font-weight: 600; color: #111827; font-size: 13px;">${data.protocolAdherence}%</div>
                </div>
                
                <div style="border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                  <div style="color: #6b7280; font-size: 11px;">Overall Risk Level</div>
                  <div style="font-weight: bold; color: ${riskColor}; font-size: 13px; text-transform: capitalize;">
                    ${data.riskLevel} Risk
                  </div>
                </div>
                
                <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #f3f4f6;">
                  <div style="color: #9ca3af; font-size: 10px; font-style: italic;">
                    Click to view detailed analytics
                  </div>
                </div>
              </div>
            `
          },
        },
        visualMap: {
          type: "continuous",
          left: "right",
          top: "middle",
          min: 0,
          max: 100,
          text: ["High Risk", "Low Risk"],
          textStyle: {
            color: "#374151",
            fontSize: 11,
          },
          inRange: {
            color: ["#dcfce7", "#bbf7d0", "#86efac", "#fef3c7", "#fed7aa", "#fca5a5", "#f87171", "#ef4444"],
          },
          calculable: true,
          precision: 0,
          formatter: (value: number) => {
            if (value < 20) return "Low"
            if (value < 40) return "Medium"
            if (value < 60) return "High"
            return "Critical"
          },
        },
        series: [
          {
            name: "Maternal Health Metrics",
            type: "map",
            map: "india",
            roam: true,
            zoom: 1.1,
            center: [78.9629, 20.5937],
            scaleLimit: {
              min: 0.8,
              max: 3,
            },
            emphasis: {
              focus: "self",
              label: {
                show: true,
                fontSize: 11,
                fontWeight: "bold",
                color: "#111827",
              },
              itemStyle: {
                areaColor: "#f3f4f6",
                borderColor: "#374151",
                borderWidth: 2,
                shadowColor: "rgba(0, 0, 0, 0.3)",
                shadowBlur: 10,
              },
            },
            select: {
              label: {
                show: true,
                fontSize: 11,
                fontWeight: "bold",
                color: "#111827",
              },
              itemStyle: {
                areaColor: "#e5e7eb",
                borderColor: "#1f2937",
                borderWidth: 2,
              },
            },
            itemStyle: {
              borderColor: "#ffffff",
              borderWidth: 0.8,
              areaColor: "#f9fafb",
            },
            label: {
              show: false,
              fontSize: 10,
              color: "#374151",
            },
            data: mapData,
          },
        ],
        animation: true,
        animationDuration: 1000,
        animationEasing: "cubicOut",
      }

      // Set the chart option
      chart.setOption(option, true)

      // Add click event handler
      chart.on("click", (params: any) => {
        if (params.name && onRegionClick) {
          onRegionClick(params.name)
        }
      })

      // Handle window resize
      const handleResize = () => {
        chart?.resize()
      }
      window.addEventListener("resize", handleResize)

      // Store cleanup function
      chartRef.current.setAttribute("data-cleanup", "true")

      setIsLoading(false)
      console.log("Chart initialized successfully with", mapData.length, "data points")

      return () => {
        window.removeEventListener("resize", handleResize)
        chart?.dispose()
      }
    } catch (err) {
      console.error("Error initializing chart:", err)
      setError(err instanceof Error ? err.message : "Failed to load the map")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const cleanup = initializeChart()
    return () => {
      if (cleanup && typeof cleanup === "function") {
        cleanup()
      }
    }
  }, [onRegionClick, retryCount])

  // Add resize when chat opens/closes
  useEffect(() => {
    if (chartRef.current && !isLoading && !error) {
      const timer = setTimeout(() => {
        // Trigger ECharts resize if the chart exists
        const chartInstance = (window as any).echarts?.getInstanceByDom?.(chartRef.current)
        if (chartInstance) {
          chartInstance.resize()
        }
      }, 400) // Delay to allow CSS transitions to complete

      return () => clearTimeout(timer)
    }
  }, [isChatOpen, isLoading, error])

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1)
  }

  const handleRegionClick = (region: RegionData) => {
    onRegionClick(region.id)
  }

  // Render risk badge with appropriate color
  const renderRiskBadge = (riskLevel: string) => {
    const colorMap = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-orange-100 text-orange-800 border-orange-200",
      low: "bg-yellow-100 text-yellow-800 border-yellow-200",
      good: "bg-green-100 text-green-800 border-green-200",
    }

    const color = colorMap[riskLevel as keyof typeof colorMap] || "bg-gray-100 text-gray-800 border-gray-200"

    return (
      <Badge variant="outline" className={`${color} font-medium capitalize`}>
        {riskLevel === "good" ? "Good" : `${riskLevel} Risk`}
      </Badge>
    )
  }

  // Render region card
  const renderRegionCard = (region: RegionData) => {
    return (
      <div
        key={region.id}
        className="p-3 border rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
        onClick={() => handleRegionClick(region)}
      >
        <div className="flex justify-between items-start mb-2">
          <h4 className="font-medium text-sm">{region.name}</h4>
          {renderRiskBadge(region.riskLevel)}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">Mothers:</span>{" "}
            <span className="font-medium">{region.totalMothers}</span>
          </div>
          <div>
            <span className="text-muted-foreground">High Risk:</span>{" "}
            <span className="font-medium text-red-600">{region.highRiskCases}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Visit Rate:</span>{" "}
            <span className="font-medium">{region.visitCompletion}%</span>
          </div>
          <div>
            <span className="text-muted-foreground">Missed:</span>{" "}
            <span className="font-medium">{region.missedFollowUps}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Regional Performance Map</CardTitle>
            <CardDescription>
              Interactive map showing maternal health program metrics across India for {dateRangeText}
              {filters.region !== "all" && `, filtered by ${filters.region}`}
              {filters.team !== "all" && `, ${filters.team}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRegionClick("regional-map")}
              title="Ask about Regional Performance Map"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Ask about this
            </Button>
            {error && (
              <Button variant="outline" size="sm" onClick={handleRetry} className="ml-2">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="map">Interactive Map</TabsTrigger>
            <TabsTrigger value="list">State-by-State Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="map" className="mt-2">
            <div className="relative w-full h-[500px] border rounded-md bg-gradient-to-br from-blue-50 to-indigo-50">
              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
                  <Skeleton className="h-[70%] w-[70%] rounded-md" />
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">Loading interactive map...</p>
                    <p className="text-xs text-muted-foreground mt-1">Fetching GeoJSON data and initializing ECharts</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md text-center">
                    <h3 className="text-red-800 font-medium mb-3">Unable to Load Interactive Map</h3>
                    <p className="text-red-600 text-sm mb-4">{error}</p>
                    <div className="space-y-2 text-xs text-red-600">
                      <p>• Check your internet connection</p>
                      <p>• Ensure access to external GeoJSON resources</p>
                      <p>• Try refreshing the page</p>
                    </div>
                    <Button onClick={handleRetry} className="mt-4" size="sm">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              <div
                ref={chartRef}
                className="w-full h-full"
                style={{ visibility: isLoading || error ? "hidden" : "visible" }}
              />
            </div>

            {/* Map Instructions */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-blue-700">Interactive Map Instructions</h4>
                  <p className="text-xs text-blue-600 mt-1">
                    In a full deployment, this map would be fully interactive. You would be able to:
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 space-y-1 list-disc pl-4">
                    <li>Hover over states to see detailed metrics</li>
                    <li>Click on states to drill down into detailed analytics</li>
                    <li>Zoom in/out using mouse wheel or pinch gestures</li>
                    <li>Pan the map by clicking and dragging</li>
                    <li>Filter data using the dashboard filters</li>
                  </ul>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-2">
            <div className="space-y-4">
              {/* High Risk States */}
              <Accordion type="single" collapsible defaultValue="high-risk">
                <AccordionItem value="high-risk">
                  <AccordionTrigger className="bg-red-50 px-3 rounded-md hover:bg-red-100 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                        High Risk
                      </Badge>
                      <span className="text-sm font-medium">{highRiskRegions.length} States</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {highRiskRegions.map((region) => renderRegionCard(region))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Medium Risk States */}
              <Accordion type="single" collapsible>
                <AccordionItem value="medium-risk">
                  <AccordionTrigger className="bg-orange-50 px-3 rounded-md hover:bg-orange-100 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                        Medium Risk
                      </Badge>
                      <span className="text-sm font-medium">{mediumRiskRegions.length} States</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {mediumRiskRegions.map((region) => renderRegionCard(region))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Low Risk States */}
              <Accordion type="single" collapsible>
                <AccordionItem value="low-risk">
                  <AccordionTrigger className="bg-yellow-50 px-3 rounded-md hover:bg-yellow-100 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        Low Risk
                      </Badge>
                      <span className="text-sm font-medium">{lowRiskRegions.length} States</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {lowRiskRegions.map((region) => renderRegionCard(region))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Good Performance States */}
              <Accordion type="single" collapsible>
                <AccordionItem value="good">
                  <AccordionTrigger className="bg-green-50 px-3 rounded-md hover:bg-green-100 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        Good Performance
                      </Badge>
                      <span className="text-sm font-medium">{goodRegions.length} States</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {goodRegions.map((region) => renderRegionCard(region))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>

        {/* Enhanced Legend and Controls */}
        <div className="mt-4 space-y-3">
          <div className="flex justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
              <span className="text-sm font-medium">Good Performance</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
              <span className="text-sm font-medium">Low Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded"></div>
              <span className="text-sm font-medium">Medium Risk</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
              <span className="text-sm font-medium">High Risk</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
