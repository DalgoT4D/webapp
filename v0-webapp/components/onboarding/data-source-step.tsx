"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRight, ArrowLeft, Upload, Database, FileSpreadsheet } from "lucide-react"
import { useOnboarding } from "./onboarding-context"

// Mock Airbyte connectors
const airbyteConnectors = [
  { id: "postgres", name: "PostgreSQL", icon: true, category: "Databases", requiresSchema: true, supportsSSL: true },
  { id: "mysql", name: "MySQL", icon: true, category: "Databases", requiresSchema: false, supportsSSL: true },
  {
    id: "mssql",
    name: "Microsoft SQL Server",
    icon: true,
    category: "Databases",
    requiresSchema: true,
    supportsSSL: true,
  },
  {
    id: "snowflake",
    name: "Snowflake",
    icon: true,
    category: "Data Warehouses",
    requiresSchema: true,
    supportsSSL: true,
  },
  {
    id: "bigquery",
    name: "Google BigQuery",
    icon: true,
    category: "Data Warehouses",
    requiresSchema: false,
    supportsSSL: false,
  },
  {
    id: "redshift",
    name: "Amazon Redshift",
    icon: true,
    category: "Data Warehouses",
    requiresSchema: true,
    supportsSSL: true,
  },
  { id: "oracle", name: "Oracle DB", icon: true, category: "Databases", requiresSchema: true, supportsSSL: true },
  { id: "mongodb", name: "MongoDB", icon: true, category: "Databases", requiresSchema: false, supportsSSL: true },
  { id: "salesforce", name: "Salesforce", icon: true, category: "CRM", requiresSchema: false, supportsSSL: false },
  { id: "hubspot", name: "HubSpot", icon: true, category: "CRM", requiresSchema: false, supportsSSL: false },
  {
    id: "zendesk",
    name: "Zendesk",
    icon: true,
    category: "Customer Support",
    requiresSchema: false,
    supportsSSL: false,
  },
  { id: "stripe", name: "Stripe", icon: true, category: "Payments", requiresSchema: false, supportsSSL: false },
  { id: "shopify", name: "Shopify", icon: true, category: "E-commerce", requiresSchema: false, supportsSSL: false },
  {
    id: "google-ads",
    name: "Google Ads",
    icon: true,
    category: "Marketing",
    requiresSchema: false,
    supportsSSL: false,
  },
  {
    id: "facebook-ads",
    name: "Facebook Ads",
    icon: true,
    category: "Marketing",
    requiresSchema: false,
    supportsSSL: false,
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    icon: true,
    category: "Analytics",
    requiresSchema: false,
    supportsSSL: false,
  },
  { id: "amplitude", name: "Amplitude", icon: true, category: "Analytics", requiresSchema: false, supportsSSL: false },
  { id: "mixpanel", name: "Mixpanel", icon: true, category: "Analytics", requiresSchema: false, supportsSSL: false },
  { id: "github", name: "GitHub", icon: true, category: "Development", requiresSchema: false, supportsSSL: false },
  { id: "jira", name: "Jira", icon: true, category: "Development", requiresSchema: false, supportsSSL: false },
  { id: "slack", name: "Slack", icon: true, category: "Communication", requiresSchema: false, supportsSSL: false },
  {
    id: "intercom",
    name: "Intercom",
    icon: true,
    category: "Customer Support",
    requiresSchema: false,
    supportsSSL: false,
  },
  { id: "mailchimp", name: "Mailchimp", icon: true, category: "Marketing", requiresSchema: false, supportsSSL: false },
  { id: "sendgrid", name: "SendGrid", icon: true, category: "Marketing", requiresSchema: false, supportsSSL: false },
  { id: "twilio", name: "Twilio", icon: true, category: "Communication", requiresSchema: false, supportsSSL: false },
  // Add more connectors to reach ~200
  {
    id: "kobo-toolbox",
    name: "KoBo Toolbox",
    icon: true,
    category: "Data Collection",
    requiresSchema: false,
    supportsSSL: false,
  },
  { id: "avni", name: "Avni", icon: true, category: "Data Collection", requiresSchema: false, supportsSSL: false },
  {
    id: "commcare",
    name: "CommCare",
    icon: true,
    category: "Data Collection",
    requiresSchema: false,
    supportsSSL: false,
  },
  {
    id: "survey-cto",
    name: "SurveyCTO",
    icon: true,
    category: "Data Collection",
    requiresSchema: false,
    supportsSSL: false,
  },
]

interface DataSourceStepProps {
  onNext: () => void
  onBack: () => void
}

export function DataSourceStep({ onNext, onBack }: DataSourceStepProps) {
  const { data, updateData } = useOnboarding()
  const [selectedSource, setSelectedSource] = useState<"csv" | "sample" | "external" | null>(
    data.dataSource.type || null,
  )
  const [file, setFile] = useState<File | null>(null)
  const [sampleDataset, setSampleDataset] = useState<string>(data.dataSource.sampleDataset || "")
  const [externalSource, setExternalSource] = useState<string>(data.dataSource.externalSource || "")

  const [searchQuery, setSearchQuery] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Filter connectors based on search query
  const filteredConnectors = searchQuery
    ? airbyteConnectors.filter(
        (connector) =>
          connector.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          connector.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : airbyteConnectors

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [dropdownRef])

  // Set selected connector if externalSource is already set
  useEffect(() => {
    if (externalSource) {
      const connector = airbyteConnectors.find((c) => c.id === externalSource)
      if (connector) {
        setSelectedConnector(connector)
        setSearchQuery(connector.name)
      }
    }
  }, [externalSource])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleContinue = () => {
    updateData({
      dataSource: {
        type: selectedSource,
        file: file || undefined,
        sampleDataset: sampleDataset || undefined,
        externalSource: externalSource || undefined,
      },
    })
    onNext()
  }

  const canContinue =
    (selectedSource === "csv" && file) ||
    (selectedSource === "sample" && sampleDataset) ||
    (selectedSource === "external" && selectedConnector) ||
    false

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 text-center py-4">
        <h1 className="text-2xl font-bold mb-1">Select Your Data Source</h1>
        <p className="text-gray-600 text-sm">Choose where your data will come from</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card
            className={`cursor-pointer transition-all ${
              selectedSource === "csv" ? "ring-2 ring-blue-500" : "hover:border-blue-200"
            }`}
            onClick={() => setSelectedSource("csv")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <FileSpreadsheet className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload CSV</h3>
              <p className="text-sm text-gray-500 mb-4">Upload your own CSV file with maternal health data</p>
              {selectedSource === "csv" && (
                <div className="w-full mt-2">
                  <Label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-1">
                    Select CSV File
                  </Label>
                  <div className="flex items-center">
                    <Input id="csv-upload" type="file" accept=".csv" onChange={handleFileChange} className="flex-1" />
                    <Button variant="outline" size="icon" className="ml-2">
                      <Upload className="h-4 w-4" />
                    </Button>
                  </div>
                  {file && <p className="text-xs text-gray-500 mt-1">Selected: {file.name}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedSource === "sample" ? "ring-2 ring-blue-500" : "hover:border-blue-200"
            }`}
            onClick={() => setSelectedSource("sample")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Database className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Sample Dataset</h3>
              <p className="text-sm text-gray-500 mb-4">Use our pre-built sample maternal health dataset</p>
              {selectedSource === "sample" && (
                <div className="w-full mt-2">
                  <Label className="block text-sm font-medium text-gray-700 mb-1">Select Sample Dataset</Label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="maternal-health"
                        name="dataset"
                        value="maternal-health"
                        checked={sampleDataset === "maternal-health"}
                        onChange={() => setSampleDataset("maternal-health")}
                        className="mr-2"
                      />
                      <Label htmlFor="maternal-health" className="text-sm">
                        Maternal Health Dataset
                      </Label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="anc-visits"
                        name="dataset"
                        value="anc-visits"
                        checked={sampleDataset === "anc-visits"}
                        onChange={() => setSampleDataset("anc-visits")}
                        className="mr-2"
                      />
                      <Label htmlFor="anc-visits" className="text-sm">
                        ANC Visits Dataset
                      </Label>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${
              selectedSource === "external" ? "ring-2 ring-blue-500" : "hover:border-blue-200"
            }`}
            onClick={() => setSelectedSource("external")}
          >
            <CardContent className="p-6 flex flex-col items-center text-center">
              <Database className="h-12 w-12 text-purple-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">External Source</h3>
              <p className="text-sm text-gray-500 mb-4">Connect to an external data source</p>
              {selectedSource === "external" && (
                <div className="w-full mt-2 space-y-4">
                  <div>
                    <Label htmlFor="connector-search" className="block text-sm font-medium text-gray-700 mb-1">
                      Select Data Connector
                    </Label>
                    <div className="relative">
                      <Input
                        id="connector-search"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value)
                          if (!isDropdownOpen) setIsDropdownOpen(true)
                        }}
                        placeholder="Search for a connector..."
                        className="w-full"
                        onFocus={() => setIsDropdownOpen(true)}
                      />
                      {isDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white shadow-lg max-h-60 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm">
                          <div className="sticky top-0 z-10 bg-white px-2 py-1.5 border-b">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500">
                                {filteredConnectors.length} connector{filteredConnectors.length !== 1 ? "s" : ""}
                              </span>
                            </div>
                          </div>
                          {filteredConnectors.length > 0 ? (
                            filteredConnectors.map((connector) => (
                              <div
                                key={connector.id}
                                className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedConnector(connector)
                                  setExternalSource(connector.id)
                                  setIsDropdownOpen(false)
                                  setSearchQuery(connector.name)
                                }}
                              >
                                <div className="flex items-center">
                                  {connector.icon && (
                                    <img
                                      src={`/placeholder.svg?height=20&width=20&query=${connector.name} logo`}
                                      alt={`${connector.name} logo`}
                                      className="h-5 w-5 mr-3 flex-shrink-0"
                                    />
                                  )}
                                  <span className="font-normal block truncate">{connector.name}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="py-2 px-3 text-gray-500 text-sm">No connectors found</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedConnector && (
                    <div className="border rounded-md p-4 bg-gray-50">
                      <h4 className="font-medium text-sm mb-3">Configure {selectedConnector.name}</h4>

                      {/* Common fields for most connectors */}
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="host" className="block text-sm">
                            Host
                          </Label>
                          <Input id="host" placeholder="e.g., db.example.com" className="mt-1" />
                        </div>

                        <div>
                          <Label htmlFor="port" className="block text-sm">
                            Port
                          </Label>
                          <Input id="port" placeholder="e.g., 5432" className="mt-1" />
                        </div>

                        <div>
                          <Label htmlFor="database" className="block text-sm">
                            Database
                          </Label>
                          <Input id="database" placeholder="e.g., mydb" className="mt-1" />
                        </div>

                        <div>
                          <Label htmlFor="username" className="block text-sm">
                            Username
                          </Label>
                          <Input id="username" placeholder="e.g., dbuser" className="mt-1" />
                        </div>

                        <div>
                          <Label htmlFor="password" className="block text-sm">
                            Password
                          </Label>
                          <Input id="password" type="password" placeholder="••••••••" className="mt-1" />
                        </div>

                        {selectedConnector.requiresSchema && (
                          <div>
                            <Label htmlFor="schema" className="block text-sm">
                              Schema
                            </Label>
                            <Input id="schema" placeholder="e.g., public" className="mt-1" />
                          </div>
                        )}

                        {selectedConnector.supportsSSL && (
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="use-ssl" className="rounded" />
                            <Label htmlFor="use-ssl" className="text-sm">
                              Use SSL
                            </Label>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
