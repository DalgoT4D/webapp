"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, LineChart, Line } from "recharts"
import { regionData } from "./india-map-chart"

interface DrillDownDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  metric: string
  value: string
  regionId?: string
}

export function DrillDownDialog({ open, onOpenChange, metric, value, regionId }: DrillDownDialogProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    // Set title and description based on the metric and value
    if (metric === "mothers") {
      setTitle("Total Mothers")
      setDescription("Detailed breakdown of mother registrations and demographics")
    } else if (metric === "visits") {
      setTitle("Visit Completion")
      setDescription("Analysis of visit completion rates and trends")
    } else if (metric === "protocols") {
      setTitle("Protocol Adherence")
      setDescription("Detailed analysis of protocol adherence by type and team")
    } else if (metric === "risk") {
      setTitle("High Risk Cases")
      setDescription("Breakdown of high risk cases by region and risk factors")
    } else if (metric === "region") {
      const region = regionId ? regionData[regionId] : null
      setTitle(region ? `${region.name} Region` : "Region Analysis")
      setDescription(region ? `Detailed metrics for ${region.name}` : "Regional performance analysis")
    }
  }, [metric, value, regionId])

  // Sample data for drill-down charts
  const getChartData = () => {
    if (metric === "mothers") {
      return {
        overview: [
          { month: "Jan", count: 210 },
          { month: "Feb", count: 240 },
          { month: "Mar", count: 280 },
          { month: "Apr", count: 320 },
          { month: "May", count: 350 },
        ],
        demographics: [
          { age: "18-24", count: 620 },
          { age: "25-30", count: 980 },
          { age: "31-35", count: 750 },
          { age: "36-40", count: 380 },
          { age: "41+", count: 123 },
        ],
        regions: [
          { region: "Maharashtra", count: 580 },
          { region: "Karnataka", count: 420 },
          { region: "Tamil Nadu", count: 390 },
          { region: "Uttar Pradesh", count: 650 },
          { region: "Bihar", count: 480 },
          { region: "Others", count: 333 },
        ],
      }
    } else if (metric === "visits") {
      return {
        overview: [
          { month: "Jan", rate: 82 },
          { month: "Feb", rate: 84 },
          { month: "Mar", rate: 86 },
          { month: "Apr", rate: 85 },
          { month: "May", rate: 87 },
        ],
        teams: [
          { team: "Team A", rate: 92 },
          { team: "Team B", rate: 88 },
          { team: "Team C", rate: 76 },
          { team: "Team D", rate: 95 },
          { team: "Team E", rate: 82 },
        ],
        reasons: [
          { reason: "Mother Unavailable", count: 45 },
          { reason: "Staff Shortage", count: 32 },
          { reason: "Transportation Issues", count: 28 },
          { reason: "Weather Conditions", count: 15 },
          { reason: "Other", count: 10 },
        ],
      }
    } else if (metric === "protocols") {
      return {
        overview: [
          { month: "Jan", rate: 79 },
          { month: "Feb", rate: 78 },
          { month: "Mar", rate: 77 },
          { month: "Apr", rate: 75 },
          { month: "May", rate: 76 },
        ],
        types: [
          { type: "Nutritional Assessment", rate: 68 },
          { type: "Vital Signs", rate: 92 },
          { type: "Medication Review", rate: 85 },
          { type: "Education", rate: 72 },
          { type: "Risk Assessment", rate: 80 },
        ],
        teams: [
          { team: "Team A", rate: 85 },
          { team: "Team B", rate: 82 },
          { team: "Team C", rate: 70 },
          { team: "Team D", rate: 90 },
          { team: "Team E", rate: 78 },
        ],
      }
    } else if (metric === "risk") {
      return {
        overview: [
          { month: "Jan", count: 120 },
          { month: "Feb", count: 125 },
          { month: "Mar", count: 130 },
          { month: "Apr", count: 135 },
          { month: "May", count: 142 },
        ],
        factors: [
          { factor: "Previous Complications", count: 58 },
          { factor: "Hypertension", count: 42 },
          { factor: "Diabetes", count: 35 },
          { factor: "Age Risk", count: 28 },
          { factor: "Multiple Factors", count: 24 },
        ],
        regions: [
          { region: "Maharashtra", count: 38 },
          { region: "Uttar Pradesh", count: 45 },
          { region: "Bihar", count: 32 },
          { region: "Madhya Pradesh", count: 28 },
          { region: "Rajasthan", count: 24 },
          { region: "Others", count: 15 },
        ],
      }
    } else if (metric === "region" && regionId) {
      const region = regionData[regionId]
      return {
        overview: [
          { month: "Jan", visitRate: region.visitCompletion - 5, protocolRate: region.protocolAdherence - 4 },
          { month: "Feb", visitRate: region.visitCompletion - 3, protocolRate: region.protocolAdherence - 2 },
          { month: "Mar", visitRate: region.visitCompletion - 1, protocolRate: region.protocolAdherence - 1 },
          { month: "Apr", visitRate: region.visitCompletion, protocolRate: region.protocolAdherence },
          { month: "May", visitRate: region.visitCompletion + 1, protocolRate: region.protocolAdherence + 1 },
        ],
        teams: [
          { team: "Team A", visitRate: 92, protocolRate: 85 },
          { team: "Team B", visitRate: 88, protocolRate: 82 },
          { team: "Team C", visitRate: 76, protocolRate: 70 },
          { team: "Team D", visitRate: 95, protocolRate: 90 },
        ],
        riskFactors: [
          { factor: "Previous Complications", count: 28 },
          { factor: "Hypertension", count: 22 },
          { factor: "Diabetes", count: 18 },
          { factor: "Age Risk", count: 15 },
          { factor: "Multiple Factors", count: 12 },
        ],
      }
    }
    return { overview: [], demographics: [], regions: [] }
  }

  const chartData = getChartData()

  const renderChart = () => {
    if (metric === "mothers") {
      if (activeTab === "overview") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "demographics") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.demographics} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="age" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "regions") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.regions} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    } else if (metric === "visits") {
      if (activeTab === "overview") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "teams") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.teams} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis domain={[70, 100]} />
              <Tooltip />
              <Bar dataKey="rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "reasons") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.reasons} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="reason" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    } else if (metric === "protocols") {
      if (activeTab === "overview") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="rate" stroke="#3b82f6" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "types") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.types} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Bar dataKey="rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "teams") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.teams} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Bar dataKey="rate" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    } else if (metric === "risk") {
      if (activeTab === "overview") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#ef4444" activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "factors") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.factors} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="factor" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "regions") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.regions} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="region" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    } else if (metric === "region") {
      if (activeTab === "overview") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.overview} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="visitRate" name="Visit Completion" stroke="#3b82f6" activeDot={{ r: 8 }} />
              <Line
                type="monotone"
                dataKey="protocolRate"
                name="Protocol Adherence"
                stroke="#22c55e"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "teams") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.teams} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis domain={[60, 100]} />
              <Tooltip />
              <Bar dataKey="visitRate" name="Visit Completion" fill="#3b82f6" />
              <Bar dataKey="protocolRate" name="Protocol Adherence" fill="#22c55e" />
            </BarChart>
          </ResponsiveContainer>
        )
      } else if (activeTab === "riskFactors") {
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.riskFactors} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="factor" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )
      }
    }
    return null
  }

  const renderTabs = () => {
    if (metric === "mothers") {
      return (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Monthly Trend</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="regions">Regional</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="demographics" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="regions" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
        </Tabs>
      )
    } else if (metric === "visits") {
      return (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Monthly Trend</TabsTrigger>
            <TabsTrigger value="teams">By Team</TabsTrigger>
            <TabsTrigger value="reasons">Missed Reasons</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="teams" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="reasons" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
        </Tabs>
      )
    } else if (metric === "protocols") {
      return (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Monthly Trend</TabsTrigger>
            <TabsTrigger value="types">By Protocol Type</TabsTrigger>
            <TabsTrigger value="teams">By Team</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="types" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="teams" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
        </Tabs>
      )
    } else if (metric === "risk") {
      return (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Monthly Trend</TabsTrigger>
            <TabsTrigger value="factors">Risk Factors</TabsTrigger>
            <TabsTrigger value="regions">By Region</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="factors" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="regions" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
        </Tabs>
      )
    } else if (metric === "region") {
      return (
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Performance Trend</TabsTrigger>
            <TabsTrigger value="teams">Team Performance</TabsTrigger>
            <TabsTrigger value="riskFactors">Risk Factors</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="teams" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
          <TabsContent value="riskFactors" className="pt-4">
            <Card className="p-4">{renderChart()}</Card>
          </TabsContent>
        </Tabs>
      )
    }
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="py-4">{renderTabs()}</div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
