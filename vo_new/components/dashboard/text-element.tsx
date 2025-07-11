"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Trash2, GripVertical, Type } from "lucide-react"
import { DashboardElementData, TextConfig } from "./dashboard-builder"

interface TextElementProps {
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

export function TextElement({ element, isSelected, onSelect, onUpdate, onDelete }: TextElementProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState("")
  const config = element.config as TextConfig

  const handleEdit = () => {
    setEditContent(config.content)
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate({
      config: {
        ...config,
        content: editContent,
      },
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditContent(config.content)
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
              <Type className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Text Block</CardTitle>
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
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Enter your text here..."
              className="min-h-[120px] resize-none"
              style={{
                fontSize: `${config.fontSize}px`,
                fontWeight: config.fontWeight,
                color: config.color,
              }}
            />
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
            className="min-h-[120px] p-3 border rounded-md bg-muted/30"
            style={{
              fontSize: `${config.fontSize}px`,
              fontWeight: config.fontWeight,
              color: config.color,
            }}
          >
            {config.content || "Enter your text here..."}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 