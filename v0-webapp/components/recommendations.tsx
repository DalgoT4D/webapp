import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export function Recommendations() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2 p-3">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <div>
          <CardTitle className="text-base">Recommendations</CardTitle>
          <CardDescription className="text-xs">Data-driven action items</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2 overflow-auto max-h-[250px]">
        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Eastern District Focus</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Increase resources by 25%. Prioritize 8 missed follow-ups.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Nutritional Training</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Target Team C for nutritional protocol training. Pair with Team D members.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Bi-weekly Visits</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Switch high/medium-risk mothers to bi-weekly visits. Could reduce high-risk cases by 28%.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Emergency Supplies</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Initiate emergency procurement for prenatal vitamins to avoid stockout.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Cross-training Expansion</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Expand cross-training to all teams. Could improve effectiveness by 37%.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
