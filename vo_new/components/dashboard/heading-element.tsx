"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Trash2, GripVertical, Heading } from "lucide-react"
import { DashboardElementData, HeadingConfig } from "./dashboard-builder"

interface HeadingElementProps {
  element: DashboardElementData
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DashboardElementData>) => void
  onDelete: () => void
}

const sizeOptions = [
  { label: "Small (1x1)", value: "1x1", cols: 1, rows: 1 },
  { label: "Medium (2x1)", value: "2x1", cols: 2, rows: 1 },
  { label: "Large (2x2)", value: "2x2", cols: 2, rows: 2 },
  { label: "Wide (3x1)", value: "3x1", cols: 3, rows: 1 },
  { label: "Extra Large (3x2)", value: "3x2", cols: 3, rows: 2 },
]

export function HeadingElement({ element, isSelected, onSelect, onUpdate, onDelete }: HeadingElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState("")
  const [editLevel, setEditLevel] = useState<1 | 2 | 3>(2)
  const config = element.config as HeadingConfig

  const handleEdit = () => {
    setEditText(config.text)
    setEditLevel(config.level)
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate({
      config: {
        ...config,
        text: editText,
        level: editLevel,
      },
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditText(config.text)
    setEditLevel(config.level)
    setIsEditing(false)
  }

  const handleSizeChange = (sizeValue: string) => {
    const sizeOption = sizeOptions.find(option => option.value === sizeValue)
    if (sizeOption) {
      onUpdate({
        gridSize: {
          cols: sizeOption.cols,
          rows: sizeOption.rows,
        }
      })
    }
  }

  const getCurrentSizeValue = () => {
    const currentSize = `${element.gridSize.cols}x${element.gridSize.rows}`
    return sizeOptions.find(option => option.value === currentSize)?.value || "1x1"
  }

  const getHeadingSize = (level: 1 | 2 | 3) => {
    switch (level) {
      case 1:
        return "text-3xl font-bold"
      case 2:
        return "text-2xl font-semibold"
      case 3:
        return "text-xl font-medium"
      default:
        return "text-2xl font-semibold"
    }
  }

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <Heading className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Heading</CardTitle>
            </div>
          </div>
          
          {isSelected && (
            <div className="flex items-center gap-1">
              <Select value={getCurrentSizeValue()} onValueChange={handleSizeChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleEdit()
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder="Enter heading text..."
              className="text-lg font-semibold"
            />
            <Select value={editLevel.toString()} onValueChange={(value) => setEditLevel(parseInt(value) as 1 | 2 | 3)}>
              <SelectTrigger>
                <SelectValue placeholder="Select heading level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Heading 1 (Large)</SelectItem>
                <SelectItem value="2">Heading 2 (Medium)</SelectItem>
                <SelectItem value="3">Heading 3 (Small)</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`p-4 border rounded-md bg-muted/30 text-center ${getHeadingSize(config.level)}`}
            style={{ color: config.color }}
          >
            {config.text || "Enter heading text..."}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 