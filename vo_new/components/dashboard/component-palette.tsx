"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Type, Heading, Plus } from "lucide-react"

interface ComponentPaletteProps {
  onAddElement: (type: "chart" | "text" | "heading", size?: { cols: number; rows: number }) => void
}

const componentTypes = [
  {
    type: "chart" as const,
    title: "Chart",
    description: "Add a bar, line, or pie chart",
    icon: BarChart3,
    color: "bg-blue-500",
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    type: "text" as const,
    title: "Text Block",
    description: "Add free-form text content",
    icon: Type,
    color: "bg-green-500",
    defaultSize: { cols: 1, rows: 1 },
  },
  {
    type: "heading" as const,
    title: "Heading",
    description: "Add a title or section header",
    icon: Heading,
    color: "bg-purple-500",
    defaultSize: { cols: 2, rows: 1 },
  },
]

const sizeOptions = [
  { label: "Small (1x1)", value: "1x1", cols: 1, rows: 1 },
  { label: "Medium (2x1)", value: "2x1", cols: 2, rows: 1 },
  { label: "Large (2x2)", value: "2x2", cols: 2, rows: 2 },
  { label: "Wide (3x1)", value: "3x1", cols: 3, rows: 1 },
  { label: "Extra Large (3x2)", value: "3x2", cols: 3, rows: 2 },
]

export function ComponentPalette({ onAddElement }: ComponentPaletteProps) {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  const [selectedSize, setSelectedSize] = useState<string>("default")

  const handleAddComponent = (type: "chart" | "text" | "heading") => {
    if (selectedSize === "default") {
      const component = componentTypes.find(c => c.type === type)
      onAddElement(type, component?.defaultSize)
    } else {
      const sizeOption = sizeOptions.find(option => option.value === selectedSize)
      onAddElement(type, sizeOption ? { cols: sizeOption.cols, rows: sizeOption.rows } : undefined)
    }
    setSelectedComponent(null)
    setSelectedSize("default")
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Components</h3>
        <p className="text-sm text-muted-foreground">Click components to add them to your dashboard</p>
      </div>

      <div className="space-y-3">
        {componentTypes.map((component) => {
          const Icon = component.icon
          const isSelected = selectedComponent === component.type
          
          return (
            <div key={component.type}>
              <Card
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedComponent(isSelected ? null : component.type)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${component.color} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm">{component.title}</CardTitle>
                      <CardDescription className="text-xs">{component.description}</CardDescription>
                      <div className="text-xs text-muted-foreground mt-1">
                        Default: {component.defaultSize.cols}x{component.defaultSize.rows}
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground ml-auto" />
                  </div>
                </CardHeader>
              </Card>
              
              {isSelected && (
                <div className="mt-2 p-3 border rounded-md bg-muted/30">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Size:</label>
                      <Select value={selectedSize} onValueChange={setSelectedSize}>
                        <SelectTrigger className="w-full mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">
                            Default ({component.defaultSize.cols}x{component.defaultSize.rows})
                          </SelectItem>
                          {sizeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddComponent(component.type)}
                      >
                        Add {component.title}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedComponent(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-2">Quick Add</h4>
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onAddElement("chart")}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Add Chart
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onAddElement("text")}
          >
            <Type className="h-4 w-4 mr-2" />
            Add Text
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={() => onAddElement("heading")}
          >
            <Heading className="h-4 w-4 mr-2" />
            Add Heading
          </Button>
        </div>
      </div>
    </div>
  )
} 