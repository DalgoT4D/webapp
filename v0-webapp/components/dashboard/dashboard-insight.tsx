import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardInsightProps {
  title: string
  description: string
  type: "success" | "warning" | "danger" | "info"
}

export function DashboardInsight({ title, description, type = "info" }: DashboardInsightProps) {
  return (
    <div
      className={cn(
        "rounded-lg p-3 border flex items-start gap-2",
        type === "success" && "bg-green-50 border-green-200",
        type === "warning" && "bg-amber-50 border-amber-200",
        type === "danger" && "bg-rose-50 border-rose-200",
        type === "info" && "bg-blue-50 border-blue-200",
      )}
    >
      {type === "success" && <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-500" />}
      {type === "warning" && <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500" />}
      {type === "danger" && <AlertCircle className="h-4 w-4 mt-0.5 text-rose-500" />}
      {type === "info" && <AlertCircle className="h-4 w-4 mt-0.5 text-blue-500" />}

      <div>
        <h4
          className={cn(
            "text-sm font-medium",
            type === "success" && "text-green-700",
            type === "warning" && "text-amber-700",
            type === "danger" && "text-rose-700",
            type === "info" && "text-blue-700",
          )}
        >
          {title}
        </h4>
        <p className="text-xs mt-1 text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
