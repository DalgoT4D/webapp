import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export function Alerts() {
  return (
    <Card className="border-rose-200 dark:border-rose-900 h-full">
      <CardHeader className="flex flex-row items-center gap-2 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-200 dark:border-rose-900 p-4">
        <AlertTriangle className="h-5 w-5 text-rose-500" />
        <div>
          <CardTitle className="text-base">Critical Alerts</CardTitle>
          <CardDescription className="text-rose-700 dark:text-rose-300 text-xs">
            Urgent notifications requiring attention
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3 overflow-auto max-h-[400px]">
        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-2 border border-rose-200 dark:border-rose-900">
          <h3 className="font-medium text-rose-700 dark:text-rose-400 text-sm">12 Missed Follow-ups</h3>
          <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">
            High-risk mothers missed appointments, 8 in eastern district.
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 border border-amber-200 dark:border-amber-900">
          <h3 className="font-medium text-amber-700 dark:text-amber-400 text-sm">Low Supplies</h3>
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
            Prenatal vitamins below 15%. Stockout in 8 days.
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2 border border-amber-200 dark:border-amber-900">
          <h3 className="font-medium text-amber-700 dark:text-amber-400 text-sm">Team C Performance</h3>
          <p className="text-xs text-amber-600 dark:text-amber-300 mt-1">
            Visit completion rate (76%) below target for 3rd month.
          </p>
        </div>

        <div className="rounded-lg bg-rose-50 dark:bg-rose-950/20 p-2 border border-rose-200 dark:border-rose-900">
          <h3 className="font-medium text-rose-700 dark:text-rose-400 text-sm">Protocol Compliance</h3>
          <p className="text-xs text-rose-600 dark:text-rose-300 mt-1">
            3% monthly decline, nutritional assessments down 7.5%.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
