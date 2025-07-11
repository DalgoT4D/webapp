"use client"

import type React from "react"

import { cn } from "@/lib/utils"
import { MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface DashboardChartWrapperProps {
  elementId: string
  title: string
  children: React.ReactNode
  className?: string
  onElementSelect: (elementId: string) => void
}

export function DashboardChartWrapper({
  elementId,
  title,
  children,
  className,
  onElementSelect,
}: DashboardChartWrapperProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Ensure we have a valid onElementSelect function
  const handleClick = () => {
    if (onElementSelect && typeof onElementSelect === "function" && elementId) {
      onElementSelect(elementId)
    }
  }

  return (
    <div
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "absolute top-2 right-2 transition-opacity duration-200 flex items-center gap-1.5",
          isHovered ? "opacity-100" : "opacity-0",
        )}
        onClick={handleClick}
        title={`Ask about ${title}`}
      >
        <MessageSquare className="h-3.5 w-3.5" />
        <span className="text-xs">Ask about this</span>
      </Button>
    </div>
  )
}
