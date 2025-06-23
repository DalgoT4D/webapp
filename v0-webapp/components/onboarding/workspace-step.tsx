"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, ArrowLeft, Database, Server } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

interface WorkspaceStepProps {
  onNext: () => void
  onBack: () => void
}

export function WorkspaceStep({ onNext, onBack }: WorkspaceStepProps) {
  const { data, updateData } = useOnboarding()
  const [selectedType, setSelectedType] = useState<"temporary" | "warehouse" | null>(data.workspace.type || null)
  const [warehouseConfig, setWarehouseConfig] = useState({
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
  })

  const handleContinue = () => {
    updateData({
      workspace: {
        type: selectedType,
        config: selectedType === "warehouse" ? warehouseConfig : undefined,
      },
    })
    onNext()
  }

  const canContinue = selectedType !== null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center py-4">
        <h1 className="text-2xl font-bold mb-1">Set Up Your Workspace</h1>
        <p className="text-gray-600 text-sm">Choose where to store and process your data</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "temporary" ? "ring-2 ring-blue-500" : "hover:border-blue-200"
            }`}
            onClick={() => setSelectedType("temporary")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Database className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Temporary Workspace</h3>
              <p className="text-sm text-gray-500 mb-4">
                Process data in memory for quick exploration. Data will not be persisted after your session ends.
              </p>
              <ul className="text-sm text-left w-full space-y-2">
                <li className="flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✓
                  </span>
                  No setup required
                </li>
                <li className="flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✓
                  </span>
                  Start analyzing immediately
                </li>
                <li className="flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✓
                  </span>
                  Storage for 30 days
                </li>
                <li className="flex items-center">
                  <span className="bg-red-100 text-red-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✗
                  </span>
                  Limited to smaller datasets
                </li>
                <li className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    i
                  </span>
                  Subscribe to use persistent hosted storage
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedType === "warehouse" ? "ring-2 ring-blue-500" : "hover:border-blue-200"
            }`}
            onClick={() => setSelectedType("warehouse")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Server className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Data Warehouse</h3>
              <p className="text-sm text-gray-500 mb-4">
                Connect to your data warehouse for persistent storage and processing of large datasets.
              </p>
              <ul className="text-sm text-left w-full space-y-2">
                <li className="flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✓
                  </span>
                  Persistent data storage
                </li>
                <li className="flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✓
                  </span>
                  Handle large datasets
                </li>
                <li className="flex items-center">
                  <span className="bg-green-100 text-green-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✓
                  </span>
                  Advanced security controls
                </li>
                <li className="flex items-center">
                  <span className="bg-red-100 text-red-800 rounded-full w-5 h-5 flex items-center justify-center mr-2">
                    ✗
                  </span>
                  Requires configuration
                </li>
              </ul>
              {selectedType === "warehouse" && (
                <div className="w-full mt-2 space-y-3">
                  <div>
                    <Label htmlFor="host" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Host
                    </Label>
                    <Input
                      id="host"
                      value={warehouseConfig.host}
                      onChange={(e) => setWarehouseConfig({ ...warehouseConfig, host: e.target.value })}
                      placeholder="e.g., warehouse.example.com"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="port" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Port
                    </Label>
                    <Input
                      id="port"
                      value={warehouseConfig.port}
                      onChange={(e) => setWarehouseConfig({ ...warehouseConfig, port: e.target.value })}
                      placeholder="e.g., 5432"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Username
                    </Label>
                    <Input
                      id="username"
                      value={warehouseConfig.username}
                      onChange={(e) => setWarehouseConfig({ ...warehouseConfig, username: e.target.value })}
                      placeholder="Username"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={warehouseConfig.password}
                      onChange={(e) => setWarehouseConfig({ ...warehouseConfig, password: e.target.value })}
                      placeholder="Password"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="database" className="block text-sm font-medium text-gray-700 mb-1 text-left">
                      Database
                    </Label>
                    <Input
                      id="database"
                      value={warehouseConfig.database}
                      onChange={(e) => setWarehouseConfig({ ...warehouseConfig, database: e.target.value })}
                      placeholder="e.g., maternal_health"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
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
          <Button onClick={handleContinue} disabled={!canContinue} className="flex items-center gap-2">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
