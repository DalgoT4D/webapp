"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, StickyNote, Highlighter, Search, Edit, Trash2 } from "lucide-react"

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

interface AnnotationsListProps {
  reportInstanceId: string
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
    {
      id: "ann-4",
      type: "pin",
      x: 80,
      y: 30,
      content: "Team performance metrics show excellent progress in training effectiveness",
      author: "Alex Rodriguez",
      createdAt: "2023-05-15T15:45:00Z",
    },
    {
      id: "ann-5",
      type: "note",
      x: 35,
      y: 85,
      content: "Protocol adherence needs improvement in urban centers",
      author: "Sarah Johnson",
      createdAt: "2023-05-15T16:20:00Z",
      color: "blue",
    },
  ],
}

export function AnnotationsList({ reportInstanceId }: AnnotationsListProps) {
  const [annotations] = useState<Annotation[]>(mockAnnotations[reportInstanceId] || [])
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [authorFilter, setAuthorFilter] = useState("all")

  // Get unique authors
  const authors = Array.from(new Set(annotations.map((ann) => ann.author)))

  // Filter annotations
  const filteredAnnotations = annotations.filter((annotation) => {
    const matchesSearch =
      searchQuery === "" ||
      annotation.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      annotation.author.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesType = typeFilter === "all" || annotation.type === typeFilter
    const matchesAuthor = authorFilter === "all" || annotation.author === authorFilter

    return matchesSearch && matchesType && matchesAuthor
  })

  const getAnnotationIcon = (type: string) => {
    switch (type) {
      case "pin":
        return <MapPin className="h-4 w-4 text-blue-500" />
      case "note":
        return <StickyNote className="h-4 w-4 text-yellow-500" />
      case "highlight":
        return <Highlighter className="h-4 w-4 text-red-500" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "pin":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "note":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "highlight":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Annotations ({annotations.length})</h3>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search annotations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="pin">Pins</SelectItem>
              <SelectItem value="note">Notes</SelectItem>
              <SelectItem value="highlight">Highlights</SelectItem>
            </SelectContent>
          </Select>

          <Select value={authorFilter} onValueChange={setAuthorFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Authors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Authors</SelectItem>
              {authors.map((author) => (
                <SelectItem key={author} value={author}>
                  {author}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Annotations List */}
      {filteredAnnotations.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-2">
            {searchQuery || typeFilter !== "all" || authorFilter !== "all"
              ? "No annotations match your filters"
              : "No annotations added yet"}
          </div>
          <p className="text-sm text-muted-foreground">
            {searchQuery || typeFilter !== "all" || authorFilter !== "all"
              ? "Try adjusting your search or filter criteria"
              : "Go to the Dashboard tab to add annotations"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnnotations.map((annotation) => (
            <Card key={annotation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {getAnnotationIcon(annotation.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={getTypeColor(annotation.type)}>
                          {annotation.type}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Position: {Math.round(annotation.x)}%, {Math.round(annotation.y)}%
                        </span>
                      </div>

                      <p className="text-sm mb-3 leading-relaxed">{annotation.content}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-medium">{annotation.author}</span>
                        <span>
                          {new Date(annotation.createdAt).toLocaleDateString()} at{" "}
                          {new Date(annotation.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-4">
                    <Button size="sm" variant="ghost">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
