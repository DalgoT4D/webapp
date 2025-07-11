"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { BarChart3 } from "lucide-react"
import { DashboardElementData } from "./dashboard-builder"
import { ChartElement } from "./chart-element"
import { TextElement } from "./text-element"
import { HeadingElement } from "./heading-element"

interface DashboardCanvasProps {
  elements: DashboardElementData[]
  selectedElement: string | null
  onElementSelect: (id: string) => void
  onElementUpdate: (id: string, updates: Partial<DashboardElementData>) => void
  onElementDelete: (id: string) => void
}

interface SortableElementProps {
  element: DashboardElementData
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DashboardElementData>) => void
  onDelete: () => void
}

function SortableElement({ element, isSelected, onSelect, onUpdate, onDelete }: SortableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${element.gridSize.cols}`,
    gridRow: `span ${element.gridSize.rows}`,
  }

  const renderElement = () => {
    switch (element.type) {
      case "chart":
        return (
          <ChartElement
            element={element}
            isSelected={isSelected}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      case "text":
        return (
          <TextElement
            element={element}
            isSelected={isSelected}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      case "heading":
        return (
          <HeadingElement
            element={element}
            isSelected={isSelected}
            onSelect={onSelect}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? 'opacity-50 z-50' : ''}`}
      {...attributes}
      {...listeners}
    >
      {renderElement()}
    </div>
  )
}

export function DashboardCanvas({
  elements,
  selectedElement,
  onElementSelect,
  onElementUpdate,
  onElementDelete,
}: DashboardCanvasProps) {
  if (elements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">Start building your dashboard</h3>
            <p className="text-sm">
              Add charts, text, and headings from the component palette to get started.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate grid template columns based on the maximum columns needed
  const maxCols = Math.max(...elements.map(el => el.gridSize.cols), 1)
  const gridTemplateColumns = `repeat(${Math.max(maxCols, 3)}, 1fr)`

  return (
    <div className="min-h-full">
      <div 
        className="grid gap-6 auto-rows-min"
        style={{ 
          gridTemplateColumns,
          gridAutoRows: 'minmax(200px, auto)'
        }}
      >
        {elements.map((element) => (
          <SortableElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onSelect={() => onElementSelect(element.id)}
            onUpdate={(updates) => onElementUpdate(element.id, updates)}
            onDelete={() => onElementDelete(element.id)}
          />
        ))}
      </div>
    </div>
  )
} 