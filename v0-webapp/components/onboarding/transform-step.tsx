"use client"

import React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowRight, ArrowLeft, Play, Plus, Settings, X, Maximize2, Minimize2, GripHorizontal } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

interface TransformStepProps {
  onNext: () => void
  onBack: () => void
}

// Generate realistic maternal health demo data
const generateMaternalHealthData = () => {
  const locations = [
    "Mumbai",
    "Delhi",
    "Bangalore",
    "Chennai",
    "Kolkata",
    "Hyderabad",
    "Pune",
    "Ahmedabad",
    "Jaipur",
    "Lucknow",
  ]
  const educationLevels = ["None", "Primary", "Secondary", "Higher Secondary", "Graduate", "Post Graduate"]
  const deliveryTypes = ["Normal", "C-Section", "Assisted", "Vacuum", "Forceps"]
  const complications = ["None", "Hypertension", "Diabetes", "Anemia", "Bleeding", "Infection", "Pre-eclampsia"]
  const outcomes = ["Healthy", "Complications", "Critical", "Recovered"]

  const data = []
  for (let i = 1; i <= 120; i++) {
    const age = Math.floor(Math.random() * 20) + 18 // 18-38 years
    const systolic = Math.floor(Math.random() * 60) + 90 // 90-150
    const diastolic = Math.floor(Math.random() * 40) + 60 // 60-100

    data.push({
      patient_id: `P${String(i).padStart(3, "0")}`,
      age: age.toString(),
      blood_pressure: `${systolic}/${diastolic}`,
      education: educationLevels[Math.floor(Math.random() * educationLevels.length)],
      location: locations[Math.floor(Math.random() * locations.length)],
      anc_visits: (Math.floor(Math.random() * 8) + 1).toString(),
      delivery_type: deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)],
      complications: complications[Math.floor(Math.random() * complications.length)],
      outcome: outcomes[Math.floor(Math.random() * outcomes.length)],
      weight_gain: (Math.random() * 20 + 8).toFixed(1), // 8-28 kg
      hemoglobin: (Math.random() * 6 + 8).toFixed(1), // 8-14 g/dL
    })
  }
  return data
}

// Sample datasets with realistic data
const baseSampleDatasets = {
  "maternal-health": {
    name: "Maternal Health Dataset",
    columns: [
      { name: "patient_id", type: "character varying" },
      { name: "age", type: "integer" },
      { name: "blood_pressure", type: "character varying" },
      { name: "education", type: "character varying" },
      { name: "location", type: "character varying" },
      { name: "anc_visits", type: "integer" },
      { name: "delivery_type", type: "character varying" },
      { name: "complications", type: "character varying" },
      { name: "outcome", type: "character varying" },
      { name: "weight_gain", type: "double precision" },
      { name: "hemoglobin", type: "double precision" },
    ],
    data: generateMaternalHealthData(),
  },
}

const transformFunctions = ["Cast", "Drop", "Filter", "Rename", "Aggregate", "Join"]

// Data transformation functions
const transformData = (data: any[], transformation: any) => {
  switch (transformation.type) {
    case "Cast":
      return data.map((row) => {
        const newRow = { ...row }
        transformation.config.columns?.forEach((col: any) => {
          if (col.column && col.newType) {
            switch (col.newType) {
              case "integer":
                newRow[col.column] = Number.parseInt(row[col.column]) || 0
                break
              case "double precision":
                newRow[col.column] = Number.parseFloat(row[col.column]) || 0
                break
              case "character varying":
                newRow[col.column] = String(row[col.column])
                break
              case "boolean":
                newRow[col.column] = Boolean(row[col.column])
                break
            }
          }
        })
        return newRow
      })

    case "Drop":
      return data.map((row) => {
        const newRow = { ...row }
        transformation.config.columns?.forEach((col: string) => {
          delete newRow[col]
        })
        return newRow
      })

    case "Filter":
      return data.filter((row) => {
        const { column, operator, value } = transformation.config
        if (!column || !operator || value === undefined) return true

        const rowValue = row[column]
        switch (operator) {
          case "equals":
            return rowValue === value
          case "not_equals":
            return rowValue !== value
          case "greater_than":
            return Number.parseFloat(rowValue) > Number.parseFloat(value)
          case "less_than":
            return Number.parseFloat(rowValue) < Number.parseFloat(value)
          case "contains":
            return String(rowValue).toLowerCase().includes(String(value).toLowerCase())
          default:
            return true
        }
      })

    case "Rename":
      return data.map((row) => {
        const newRow = { ...row }
        transformation.config.columns?.forEach((col: any) => {
          if (col.oldName && col.newName && newRow[col.oldName] !== undefined) {
            newRow[col.newName] = newRow[col.oldName]
            delete newRow[col.oldName]
          }
        })
        return newRow
      })

    default:
      return data
  }
}

export function TransformStep({ onNext, onBack }: TransformStepProps) {
  const { data, updateData } = useOnboarding()
  const [datasets, setDatasets] = useState(baseSampleDatasets)
  const [selectedDataset, setSelectedDataset] = useState<string>("maternal-health")
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showFunctionPanel, setShowFunctionPanel] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null)
  const [functionNodes, setFunctionNodes] = useState<
    Array<{ type: string; id: string; sourceDataset: string; config: any; resultDataset?: string }>
  >([])
  const [activeTab, setActiveTab] = useState("preview")
  const [previewHeight, setPreviewHeight] = useState(192)
  const [isPreviewMaximized, setIsPreviewMaximized] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [functionConfig, setFunctionConfig] = useState<any>({})

  // Get the actual dataset based on selection
  const dataset = datasets[selectedDataset as keyof typeof datasets]

  const handleNodeSelect = (nodeId: string) => {
    setSelectedNode(nodeId)
    setShowFunctionPanel(true)
  }

  const handleFunctionSelect = (func: string) => {
    setSelectedFunction(func)
    setFunctionConfig({})
    setShowFunctionPanel(false)
  }

  const handleSaveFunction = () => {
    if (!selectedFunction || !selectedNode) return

    const newNodeId = `${selectedFunction.toLowerCase()}-${Date.now()}`
    const sourceDatasetKey = selectedNode === "dataset" ? selectedDataset : selectedNode

    const transformation = {
      type: selectedFunction,
      id: newNodeId,
      sourceDataset: sourceDatasetKey,
      config: functionConfig,
    }

    // Apply transformation and create new dataset
    const sourceData = datasets[sourceDatasetKey as keyof typeof datasets]?.data || []
    const transformedData = transformData(sourceData, transformation)

    // Update columns based on transformation
    let newColumns = [...dataset.columns]
    if (selectedFunction === "Drop") {
      newColumns = newColumns.filter((col) => !functionConfig.columns?.includes(col.name))
    } else if (selectedFunction === "Cast") {
      functionConfig.columns?.forEach((castCol: any) => {
        const colIndex = newColumns.findIndex((col) => col.name === castCol.column)
        if (colIndex !== -1) {
          newColumns[colIndex] = { ...newColumns[colIndex], type: castCol.newType }
        }
      })
    } else if (selectedFunction === "Rename") {
      functionConfig.columns?.forEach((renameCol: any) => {
        const colIndex = newColumns.findIndex((col) => col.name === renameCol.oldName)
        if (colIndex !== -1) {
          newColumns[colIndex] = { ...newColumns[colIndex], name: renameCol.newName }
        }
      })
    }

    // Create new dataset
    const newDatasetKey = `${sourceDatasetKey}-${selectedFunction.toLowerCase()}-${Date.now()}`
    const newDataset = {
      name: `${datasets[sourceDatasetKey as keyof typeof datasets]?.name || "Dataset"} (${selectedFunction})`,
      columns: newColumns,
      data: transformedData,
    }

    setDatasets((prev) => ({
      ...prev,
      [newDatasetKey]: newDataset,
    }))

    // Add function node with result dataset reference
    const newFunctionNode = {
      ...transformation,
      resultDataset: newDatasetKey,
    }

    setFunctionNodes([...functionNodes, newFunctionNode])

    // Update onboarding data with datasets
    updateData({
      transformations: [...(data.transformations || []), transformation],
      datasets: {
        ...data.datasets,
        [newDatasetKey]: newDataset,
      },
    })

    // Reset state
    setSelectedFunction(null)
    setFunctionConfig({})
    setSelectedNode(null)
  }

  // Add initial dataset to context when component mounts
  React.useEffect(() => {
    // Add the base dataset to the context
    updateData({
      datasets: {
        ...data.datasets,
        "maternal-health": baseSampleDatasets["maternal-health"],
      },
    })
  }, [])

  const handleRemoveFunctionNode = (id: string) => {
    setFunctionNodes(functionNodes.filter((node) => node.id !== id))
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    e.preventDefault()
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return

    const windowHeight = window.innerHeight
    const headerHeight = 56
    const mouseY = e.clientY
    const newHeight = windowHeight - mouseY

    const minHeight = 150
    const maxHeight = (windowHeight - headerHeight) * 0.9
    const constrainedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))

    setPreviewHeight(constrainedHeight)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging])

  const toggleMaximize = () => {
    if (isPreviewMaximized) {
      setPreviewHeight(192)
      setIsPreviewMaximized(false)
    } else {
      const windowHeight = window.innerHeight
      const headerHeight = 56
      setPreviewHeight((windowHeight - headerHeight) * 0.95)
      setIsPreviewMaximized(true)
    }
  }

  const renderFunctionConfig = () => {
    if (!selectedFunction) return null

    switch (selectedFunction) {
      case "Cast":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Cast Configuration</Label>
              <div className="mt-3 border rounded-lg">
                <div className="grid grid-cols-2 gap-0 text-sm">
                  <div className="bg-gray-50 font-medium p-3 border-b border-r">Column name</div>
                  <div className="bg-gray-50 font-medium p-3 border-b">Type</div>
                  {dataset.columns.map((column, index) => (
                    <React.Fragment key={column.name}>
                      <div className="p-3 border-b border-r text-gray-700">{column.name}</div>
                      <div className="p-3 border-b">
                        <Select
                          value={
                            functionConfig.columns?.find((c: any) => c.column === column.name)?.newType || column.type
                          }
                          onValueChange={(value) => {
                            const columns = functionConfig.columns || []
                            const existingIndex = columns.findIndex((c: any) => c.column === column.name)

                            if (existingIndex >= 0) {
                              columns[existingIndex] = { column: column.name, newType: value }
                            } else {
                              columns.push({ column: column.name, newType: value })
                            }

                            setFunctionConfig({ ...functionConfig, columns })
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="character varying">character varying</SelectItem>
                            <SelectItem value="integer">integer</SelectItem>
                            <SelectItem value="double precision">double precision</SelectItem>
                            <SelectItem value="boolean">boolean</SelectItem>
                            <SelectItem value="date">date</SelectItem>
                            <SelectItem value="timestamp">timestamp</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case "Drop":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select columns to drop:</Label>
              <div className="space-y-2 mt-2">
                {dataset.columns.map((column) => (
                  <div key={column.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.name}
                      checked={functionConfig.columns?.includes(column.name)}
                      onCheckedChange={(checked) => {
                        const columns = functionConfig.columns || []
                        if (checked) {
                          setFunctionConfig({
                            ...functionConfig,
                            columns: [...columns, column.name],
                          })
                        } else {
                          setFunctionConfig({
                            ...functionConfig,
                            columns: columns.filter((c: string) => c !== column.name),
                          })
                        }
                      }}
                    />
                    <Label htmlFor={column.name} className="text-sm">
                      {column.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case "Filter":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm">Column:</Label>
              <Select
                value={functionConfig.column}
                onValueChange={(value) => setFunctionConfig({ ...functionConfig, column: value })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  {dataset.columns.map((column) => (
                    <SelectItem key={column.name} value={column.name}>
                      {column.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Operator:</Label>
              <Select
                value={functionConfig.operator}
                onValueChange={(value) => setFunctionConfig({ ...functionConfig, operator: value })}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select operator" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equals">Equals</SelectItem>
                  <SelectItem value="not_equals">Not Equals</SelectItem>
                  <SelectItem value="greater_than">Greater Than</SelectItem>
                  <SelectItem value="less_than">Less Than</SelectItem>
                  <SelectItem value="contains">Contains</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Value:</Label>
              <Input
                value={functionConfig.value || ""}
                onChange={(e) => setFunctionConfig({ ...functionConfig, value: e.target.value })}
                className="mt-1"
                placeholder="Enter value"
              />
            </div>
          </div>
        )

      case "Rename":
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Select columns to rename:</Label>
              <div className="space-y-2 mt-2">
                {dataset.columns.map((column) => (
                  <div key={column.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.name}
                      checked={functionConfig.columns?.some((c: any) => c.oldName === column.name)}
                      onCheckedChange={(checked) => {
                        const columns = functionConfig.columns || []
                        if (checked) {
                          setFunctionConfig({
                            ...functionConfig,
                            columns: [...columns, { oldName: column.name, newName: column.name }],
                          })
                        } else {
                          setFunctionConfig({
                            ...functionConfig,
                            columns: columns.filter((c: any) => c.oldName !== column.name),
                          })
                        }
                      }}
                    />
                    <Label htmlFor={column.name} className="text-sm">
                      {column.name}
                    </Label>
                  </div>
                ))}
              </div>
              {functionConfig.columns?.map((col: any, index: number) => (
                <div key={index} className="mt-2">
                  <Label className="text-sm">New name for {col.oldName}:</Label>
                  <Input
                    value={col.newName}
                    onChange={(e) => {
                      const columns = [...functionConfig.columns]
                      columns[index] = { ...columns[index], newName: e.target.value }
                      setFunctionConfig({ ...functionConfig, columns })
                    }}
                    className="mt-1"
                    placeholder="Enter new name"
                  />
                </div>
              ))}
            </div>
          </div>
        )

      default:
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Configure your {selectedFunction.toLowerCase()} operation</p>
          </div>
        )
    }
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Compact Header */}
      <div className="bg-white border-b px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold">Dalgo</h1>
            <span className="text-sm text-muted-foreground">Transform Data</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Play className="h-4 w-4 mr-1" />
              Execute
            </Button>
            <Button variant="outline" size="sm">
              Save
            </Button>
            <div className="flex gap-1 ml-4">
              <Button variant="outline" onClick={onBack} size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <Button onClick={onNext} size="sm">
                Continue
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Datasets */}
        <div className="w-48 bg-white border-r p-3 flex-shrink-0">
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Datasets</h3>
            <div className="space-y-2">
              {Object.entries(datasets).map(([key, dataset]) => (
                <div
                  key={key}
                  className={`p-2 rounded cursor-pointer text-sm ${
                    selectedDataset === key ? "bg-blue-100 text-blue-700 border border-blue-200" : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedDataset(key)}
                >
                  <div className="font-medium">{dataset.name}</div>
                  <div className="text-xs text-gray-500">{dataset.data.length} rows</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas and Preview Area */}
        <div className="flex-1 flex flex-col">
          {/* Workflow Canvas */}
          <div
            className="flex-1 bg-gray-50 relative p-4"
            style={{
              height: `calc(100vh - 56px - ${previewHeight}px)`,
              minHeight: isPreviewMaximized ? "0" : "100px",
            }}
          >
            {/* Dataset Node */}
            <div
              className={`absolute top-4 left-4 cursor-pointer ${selectedNode === "dataset" ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => handleNodeSelect("dataset")}
            >
              <Card className="w-64 bg-white border-2 border-gray-200 hover:border-gray-300">
                <CardHeader className="pb-2 pt-3 bg-teal-600 text-white">
                  <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span>{dataset.name}</span>
                    <Settings className="h-4 w-4" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-0 text-xs">
                      <div className="bg-gray-50 font-medium p-2 border-b border-r">Column</div>
                      <div className="bg-gray-50 font-medium p-2 border-b">Type</div>
                      {dataset.columns.map((column, index) => (
                        <React.Fragment key={index}>
                          <div className="p-2 border-b border-r text-gray-700">{column.name}</div>
                          <div className="p-2 border-b text-gray-500">{column.type}</div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Function Nodes */}
            {functionNodes.map((node, index) => (
              <React.Fragment key={node.id}>
                {/* Function Node */}
                <div className="absolute" style={{ top: `${20 + (index + 1) * 160}px`, left: "18rem" }}>
                  <Card className="w-48 bg-teal-600 text-white">
                    <CardHeader className="pb-1 pt-2">
                      <CardTitle className="text-xs flex justify-between items-center">
                        <span>{node.type}</span>
                        <X
                          className="h-3 w-3 hover:text-red-300 cursor-pointer"
                          onClick={() => handleRemoveFunctionNode(node.id)}
                        />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                      <div className="text-xs text-teal-200">
                        {node.type === "Filter"
                          ? `Filter: ${node.config.column || "..."}`
                          : node.type === "Drop"
                            ? `Drop: ${node.config.columns?.length || 0} cols`
                            : node.type === "Cast"
                              ? `Cast: ${node.config.columns?.length || 0} cols`
                              : `${node.type}...`}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Connection line from previous node */}
                  <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                    <line x1="24" y1="-80" x2="24" y2="0" stroke="#14b8a6" strokeWidth="2" />
                  </svg>
                </div>

                {/* Result Dataset Node */}
                {node.resultDataset && (
                  <div className="absolute" style={{ top: `${20 + (index + 1) * 160 + 80}px`, left: "30rem" }}>
                    <Card className="w-64 bg-white border-2 border-teal-300">
                      <CardHeader className="pb-2 pt-3 bg-teal-600 text-white">
                        <CardTitle className="text-sm font-medium flex justify-between items-center">
                          <span>{datasets[node.resultDataset]?.name}</span>
                          <Settings className="h-4 w-4" />
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="max-h-32 overflow-y-auto">
                          <div className="grid grid-cols-2 gap-0 text-xs">
                            <div className="bg-gray-50 font-medium p-2 border-b border-r">Column</div>
                            <div className="bg-gray-50 font-medium p-2 border-b">Type</div>
                            {datasets[node.resultDataset]?.columns.slice(0, 4).map((column, colIndex) => (
                              <React.Fragment key={colIndex}>
                                <div className="p-2 border-b border-r text-gray-700">{column.name}</div>
                                <div className="p-2 border-b text-gray-500">{column.type}</div>
                              </React.Fragment>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Connection line from function to result */}
                    <svg className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: -1 }}>
                      <line x1="-144" y1="-40" x2="0" y2="0" stroke="#14b8a6" strokeWidth="2" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Add Function Button */}
            {selectedNode === "dataset" && !showFunctionPanel && !selectedFunction && (
              <div className="absolute top-16 left-72">
                <Button variant="outline" size="sm" className="bg-white" onClick={() => setShowFunctionPanel(true)}>
                  <Plus className="h-3 w-3 mr-1" />
                  Add Function
                </Button>
              </div>
            )}
          </div>

          {/* Resizable Handle */}
          <div
            className="h-1 bg-gray-200 hover:bg-gray-300 cursor-row-resize flex items-center justify-center group"
            onMouseDown={handleMouseDown}
          >
            <GripHorizontal className="h-3 w-3 text-gray-400 group-hover:text-gray-600" />
          </div>

          {/* Bottom Preview Panel */}
          <div
            className="bg-white border-t flex-shrink-0"
            style={{
              height: `${previewHeight}px`,
              position: isPreviewMaximized ? "absolute" : "relative",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: isPreviewMaximized ? 10 : "auto",
              boxShadow: isPreviewMaximized ? "0 -4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
            }}
          >
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-3">
                <Button
                  variant={activeTab === "preview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("preview")}
                >
                  PREVIEW
                </Button>
                <Button
                  variant={activeTab === "logs" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("logs")}
                >
                  LOGS
                </Button>
                <Button
                  variant={activeTab === "stats" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("stats")}
                >
                  STATISTICS
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={toggleMaximize}>
                {isPreviewMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>

            <div className="overflow-auto" style={{ height: `${previewHeight - 60}px` }}>
              {activeTab === "preview" && (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      {dataset.columns.map((column) => (
                        <th key={column.name} className="text-left p-2 font-medium">
                          {column.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dataset.data.slice(0, 50).map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        {dataset.columns.map((column) => (
                          <td key={column.name} className="p-2">
                            {row[column.name as keyof typeof row]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeTab === "logs" && (
                <div className="p-3">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Dataset loaded: {dataset.name}</div>
                    <div>Rows: {dataset.data.length}</div>
                    <div>Columns: {dataset.columns.length}</div>
                    {functionNodes.map((node, index) => (
                      <div key={node.id}>Applied {node.type} transformation</div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "stats" && (
                <div className="p-3">
                  <div className="text-xs">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium">Total Rows</div>
                        <div className="text-lg">{dataset.data.length}</div>
                      </div>
                      <div>
                        <div className="font-medium">Total Columns</div>
                        <div className="text-lg">{dataset.columns.length}</div>
                      </div>
                      <div>
                        <div className="font-medium">Transformations</div>
                        <div className="text-lg">{functionNodes.length}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Functions */}
        {showFunctionPanel && !selectedFunction && (
          <div className="w-64 bg-white border-l p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Functions</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFunctionPanel(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1 overflow-auto" style={{ height: "calc(100vh - 120px)" }}>
              {transformFunctions.map((func) => (
                <Button
                  key={func}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                  onClick={() => handleFunctionSelect(func)}
                >
                  {func}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Function Configuration Panel */}
        {selectedFunction && (
          <div className="w-80 bg-white border-l p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">{selectedFunction}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFunction(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 overflow-auto" style={{ height: "calc(100vh - 180px)" }}>
              {renderFunctionConfig()}

              <div className="pt-4 border-t">
                <Button onClick={handleSaveFunction} className="w-full bg-teal-600 hover:bg-teal-700">
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
