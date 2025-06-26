"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Save, Eye, Settings, Trash2, Undo, Redo } from "lucide-react"
import { DashboardElementData } from "./dashboard-builder"

interface DashboardToolbarProps {
  title: string
  onTitleChange: (title: string) => void
  onSave: () => void
  isSaving: boolean
  selectedElement: string | null
  elements: DashboardElementData[]
}

export function DashboardToolbar({
  title,
  onTitleChange,
  onSave,
  isSaving,
  selectedElement,
  elements,
}: DashboardToolbarProps) {
  const selectedElementData = elements.find(el => el.id === selectedElement)

  return (
    <div className="border-b bg-background p-4">
      <div className="flex items-center justify-between">
        {/* Left side - Title and basic controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-64 font-semibold"
              placeholder="Dashboard title..."
            />
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          <Button onClick={onSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Dashboard"}
          </Button>
        </div>
      </div>

      {/* Element info bar */}
      {selectedElementData && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Selected:</span>
              <span className="text-sm text-muted-foreground">
                {selectedElementData.title || selectedElementData.type}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mt-2 text-xs text-muted-foreground">
        {elements.length} element{elements.length !== 1 ? 's' : ''} • 
        {selectedElement ? ' 1 selected' : ' None selected'}
      </div>
    </div>
  )
} 