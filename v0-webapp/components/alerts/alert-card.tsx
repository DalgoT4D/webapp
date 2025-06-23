"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertTriangle, Clock, Mail, MoreVertical, Pause, Play, Edit, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Alert {
  id: string
  name: string
  description: string
  severity: "low" | "medium" | "high" | "critical"
  status: "active" | "paused" | "triggered"
  metrics: string[]
  conditions: Array<{
    metric: string
    operator: string
    threshold: number
    timePeriod: string
  }>
  recipients: string[]
  lastTriggered?: string
  createdAt: string
}

interface AlertCardProps {
  alert: Alert
  onEdit: (alert: Alert) => void
  onDelete: (alertId: string) => void
  onToggleStatus: (alertId: string) => void
}

const severityColors = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  critical: "bg-red-100 text-red-800 border-red-200",
}

const statusColors = {
  active: "bg-green-100 text-green-800 border-green-200",
  paused: "bg-gray-100 text-gray-800 border-gray-200",
  triggered: "bg-red-100 text-red-800 border-red-200",
}

export function AlertCard({ alert, onEdit, onDelete, onToggleStatus }: AlertCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex items-center gap-1 flex-wrap">
              <h3 className="font-semibold text-sm truncate">{alert.name}</h3>
              <Badge className={`${severityColors[alert.severity]} text-xs px-1 py-0`}>{alert.severity}</Badge>
            </div>
            <Badge className={`${statusColors[alert.status]} text-xs px-1 py-0 w-fit`}>{alert.status}</Badge>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(alert)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(alert.id)}>
                {alert.status === "active" ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Resume
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(alert.id)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <p className="text-muted-foreground text-xs line-clamp-2">{alert.description}</p>

        {/* Metrics */}
        <div>
          <h4 className="text-xs font-medium mb-1">Metrics</h4>
          <div className="flex flex-wrap gap-1">
            {alert.metrics.slice(0, 2).map((metric, index) => (
              <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                {metric}
              </Badge>
            ))}
            {alert.metrics.length > 2 && (
              <Badge variant="outline" className="text-xs px-1 py-0">
                +{alert.metrics.length - 2} more
              </Badge>
            )}
          </div>
        </div>

        {/* Conditions - Simplified */}
        <div>
          <h4 className="text-xs font-medium mb-1">Condition</h4>
          {alert.conditions.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {alert.conditions[0].metric} {alert.conditions[0].operator} {alert.conditions[0].threshold}
              {alert.conditions.length > 1 && <span className="ml-1">+{alert.conditions.length - 1} more</span>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            {alert.recipients.length}
          </div>
          {alert.lastTriggered ? (
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {formatDistanceToNow(new Date(alert.lastTriggered), { addSuffix: true })}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
