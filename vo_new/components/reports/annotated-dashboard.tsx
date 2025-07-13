"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, StickyNote, Highlighter, X, Save, Edit, Trash2 } from "lucide-react"

interface Annotation {
  id: string
  type: "pin" | "note" | "highlight"
  x: number
  y: number
  content: string
  author: string
  createdAt: string
  color?: string
}

interface AnnotatedDashboardProps {
  reportInstanceId: string
  children: React.ReactNode
}

// Mock annotations data
const mockAnnotations: Record<string, Annotation[]> = {
  "inst-001-1": [
    {
      id: "ann-1",
      type: "pin",
      x: 25,
      y: 15,
      content:
        "Field visit completion has improved significantly in this region. The 15% increase is attributed to better training and resource allocation.",
      author: "Sarah Johnson",
      createdAt: "2023-05-15T10:30:00Z",
    },
    {
      id: "ann-2",
      type: "note",
      x: 60,
      y: 40,
      content: "Supply chain efficiency target exceeded",
      author: "Mike Chen",
      createdAt: "2023-05-15T11:15:00Z",
      color: "yellow",
    },
    {
      id: "ann-3",
      type: "highlight",
      x: 40,
      y: 70,
      content: "Risk distribution shows concerning trend in urban areas - requires immediate attention",
      author: "Dr. Priya Sharma",
      createdAt: "2023-05-15T14:20:00Z",
      color: "red",
    },
  ],
}

export function AnnotatedDashboard({ reportInstanceId, children }: AnnotatedDashboardProps) {
  const [annotations, setAnnotations] = useState<Annotation[]>(mockAnnotations[reportInstanceId] || [])
  const [isCreating, setIsCreating] = useState(false)
  const [newAnnotation, setNewAnnotation] = useState<Partial<Annotation>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current || isCreating || editingId) return

      const rect = containerRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100

      setNewAnnotation({
        x,
        y,
        type: "pin",
        content: "",
        author: "Current User",
        createdAt: new Date().toISOString(),
      })
      setIsCreating(true)
    },
    [isCreating, editingId],
  )

  const handleSaveAnnotation = () => {
    if (!newAnnotation.content?.trim()) return

    const annotation: Annotation = {
      id: `ann-${Date.now()}`,
      type: newAnnotation.type as "pin" | "note" | "highlight",
      x: newAnnotation.x!,
      y: newAnnotation.y!,
      content: newAnnotation.content,
      author: newAnnotation.author!,
      createdAt: newAnnotation.createdAt!,
      color: newAnnotation.color,
    }

    setAnnotations((prev) => [...prev, annotation])
    setIsCreating(false)
    setNewAnnotation({})
  }

  const handleUpdateAnnotation = (id: string, content: string) => {
    setAnnotations((prev) => prev.map((ann) => (ann.id === id ? { ...ann, content } : ann)))
    setEditingId(null)
  }

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id))
    setSelectedAnnotation(null)
  }

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case "pin":
        return <MapPin className="h-4 w-4" />
      case "note":
        return <StickyNote className="h-4 w-4" />
      case "highlight":
        return <Highlighter className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getAnnotationColor = (type: string, color?: string) => {
    if (color) {
      switch (color) {
        case "red":
          return "bg-red-500 hover:bg-red-600"
        case "yellow":
          return "bg-yellow-500 hover:bg-yellow-600"
        case "green":
          return "bg-green-500 hover:bg-green-600"
        case "blue":
          return "bg-blue-500 hover:bg-blue-600"
        default:
          return "bg-primary hover:bg-primary/90"
      }
    }

    switch (type) {
      case "pin":
        return "bg-blue-500 hover:bg-blue-600"
      case "note":
        return "bg-yellow-500 hover:bg-yellow-600"
      case "highlight":
        return "bg-red-500 hover:bg-red-600"
      default:
        return "bg-primary hover:bg-primary/90"
    }
  }

  return (
    <div className="relative">
      <div ref={containerRef} className="relative cursor-crosshair" onClick={handleContainerClick}>
        {children}

        {/* Existing Annotations */}
        {annotations.map((annotation) => (
          <div
            key={annotation.id}
            className="absolute z-10"
            style={{
              left: `${annotation.x}%`,
              top: `${annotation.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Button
              size="sm"
              className={`h-8 w-8 rounded-full p-0 text-white shadow-lg ${getAnnotationColor(
                annotation.type,
                annotation.color,
              )}`}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedAnnotation(selectedAnnotation === annotation.id ? null : annotation.id)
              }}
            >
              {getAnnotationIcon(annotation.type)}
            </Button>

            {/* Annotation Popup */}
            {selectedAnnotation === annotation.id && (
              <Card className="absolute top-10 left-0 w-80 z-20 shadow-xl">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {annotation.type}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(annotation.id)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDeleteAnnotation(annotation.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setSelectedAnnotation(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {editingId === annotation.id ? (
                    <div className="space-y-2">
                      <Textarea
                        defaultValue={annotation.content}
                        className="min-h-[80px] resize-none"
                        id={`edit-${annotation.id}`}
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const textarea = document.getElementById(`edit-${annotation.id}`) as HTMLTextAreaElement
                            handleUpdateAnnotation(annotation.id, textarea.value)
                          }}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm mb-2">{annotation.content}</p>
                      <div className="text-xs text-muted-foreground">
                        <p className="font-medium">{annotation.author}</p>
                        <p>{new Date(annotation.createdAt).toLocaleDateString()}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ))}

        {/* New Annotation Creation */}
        {isCreating && (
          <div
            className="absolute z-20"
            style={{
              left: `${newAnnotation.x}%`,
              top: `${newAnnotation.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Card className="w-80 shadow-xl">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Add Annotation</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsCreating(false)
                        setNewAnnotation({})
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <Select
                    value={newAnnotation.type}
                    onValueChange={(value) => setNewAnnotation((prev) => ({ ...prev, type: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pin">Pin</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="highlight">Highlight</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Add your annotation..."
                    value={newAnnotation.content || ""}
                    onChange={(e) => setNewAnnotation((prev) => ({ ...prev, content: e.target.value }))}
                    className="min-h-[80px] resize-none"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsCreating(false)
                        setNewAnnotation({})
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveAnnotation}>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          Click anywhere on the dashboard to add annotations. Use pins for specific points, notes for general comments,
          and highlights for important metrics.
        </p>
      </div>
    </div>
  )
}
