"use client"

import { useState, useCallback } from "react"
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core"
import { SortableContext, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable"
import { DashboardCanvas } from "./dashboard-canvas"
import { ComponentPalette } from "./component-palette"
import { DashboardToolbar } from "./dashboard-toolbar"
import { DashboardElement } from "./dashboard-element"
import { ChartElement } from "./chart-element"
import { TextElement } from "./text-element"
import { HeadingElement } from "./heading-element"

export interface DashboardElementData {
  id: string
  type: "chart" | "text" | "heading"
  position: { x: number; y: number }
  size: { width: number; height: number }
  gridSize: { cols: number; rows: number }
  config: any
  title?: string
}

export interface ChartConfig {
  chartType: "bar" | "line" | "pie" | "radar"
  data: any[]
  xKey: string
  yKey: string
  title: string
}

export interface TextConfig {
  content: string
  fontSize: number
  fontWeight: "normal" | "bold"
  color: string
}

export interface HeadingConfig {
  text: string
  level: 1 | 2 | 3
  color: string
}

export function DashboardBuilder() {
  const [elements, setElements] = useState<DashboardElementData[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [activeElement, setActiveElement] = useState<DashboardElementData | null>(null)
  const [dashboardTitle, setDashboardTitle] = useState("Untitled Dashboard")
  const [isSaving, setIsSaving] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    const element = elements.find(el => el.id === active.id)
    if (element) {
      setActiveElement(element)
    }
  }, [elements])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setElements((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }

    setActiveElement(null)
  }, [])

  const addElement = useCallback((type: "chart" | "text" | "heading", size?: { cols: number; rows: number }) => {
    const newElement: DashboardElementData = {
      id: `element-${Date.now()}`,
      type,
      position: { x: 0, y: 0 },
      size: { width: 400, height: 300 },
      gridSize: size || getDefaultGridSize(type),
      config: getDefaultConfig(type),
      title: getDefaultTitle(type),
    }
    setElements(prev => [...prev, newElement])
  }, [])

  const updateElement = useCallback((id: string, updates: Partial<DashboardElementData>) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...updates } : el))
  }, [])

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id))
    if (selectedElement === id) {
      setSelectedElement(null)
    }
  }, [selectedElement])

  const saveDashboard = useCallback(async () => {
    setIsSaving(true)
    try {
      // TODO: Implement API call to save dashboard
      console.log("Saving dashboard:", { title: dashboardTitle, elements })
      // await apiPost("/api/dashboards", { title: dashboardTitle, elements })
    } catch (error) {
      console.error("Failed to save dashboard:", error)
    } finally {
      setIsSaving(false)
    }
  }, [dashboardTitle, elements])

  const getDefaultGridSize = (type: "chart" | "text" | "heading"): { cols: number; rows: number } => {
    switch (type) {
      case "chart":
        return { cols: 1, rows: 1 }
      case "text":
        return { cols: 1, rows: 1 }
      case "heading":
        return { cols: 2, rows: 1 }
      default:
        return { cols: 1, rows: 1 }
    }
  }

  const getDefaultConfig = (type: "chart" | "text" | "heading"): any => {
    switch (type) {
      case "chart":
        return {
          chartType: "bar",
          data: [
            { name: "Jan", value: 100 },
            { name: "Feb", value: 120 },
            { name: "Mar", value: 90 },
            { name: "Apr", value: 150 },
          ],
          xKey: "name",
          yKey: "value",
          title: "Sample Chart",
        } as ChartConfig
      case "text":
        return {
          content: "Enter your text here...",
          fontSize: 14,
          fontWeight: "normal" as const,
          color: "#000000",
        } as TextConfig
      case "heading":
        return {
          text: "Heading",
          level: 2 as const,
          color: "#000000",
        } as HeadingConfig
      default:
        return {}
    }
  }

  const getDefaultTitle = (type: "chart" | "text" | "heading"): string => {
    switch (type) {
      case "chart":
        return "Chart"
      case "text":
        return "Text Block"
      case "heading":
        return "Heading"
      default:
        return "Element"
    }
  }

  const renderElement = (element: DashboardElementData) => {
    switch (element.type) {
      case "chart":
        return (
          <ChartElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onSelect={() => setSelectedElement(element.id)}
            onUpdate={(updates) => updateElement(element.id, updates)}
            onDelete={() => deleteElement(element.id)}
          />
        )
      case "text":
        return (
          <TextElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onSelect={() => setSelectedElement(element.id)}
            onUpdate={(updates) => updateElement(element.id, updates)}
            onDelete={() => deleteElement(element.id)}
          />
        )
      case "heading":
        return (
          <HeadingElement
            key={element.id}
            element={element}
            isSelected={selectedElement === element.id}
            onSelect={() => setSelectedElement(element.id)}
            onUpdate={(updates) => updateElement(element.id, updates)}
            onDelete={() => deleteElement(element.id)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-full">
      {/* Component Palette */}
      <div className="w-64 border-r bg-muted/30">
        <ComponentPalette onAddElement={addElement} />
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <DashboardToolbar
          title={dashboardTitle}
          onTitleChange={setDashboardTitle}
          onSave={saveDashboard}
          isSaving={isSaving}
          selectedElement={selectedElement}
          elements={elements}
        />

        {/* Canvas */}
        <div className="flex-1 overflow-auto bg-gray-50 p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={elements.map(el => el.id)} strategy={rectSortingStrategy}>
              <DashboardCanvas
                elements={elements}
                selectedElement={selectedElement}
                onElementSelect={setSelectedElement}
                onElementUpdate={updateElement}
                onElementDelete={deleteElement}
              />
            </SortableContext>

            <DragOverlay>
              {activeElement ? renderElement(activeElement) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
    </div>
  )
} 