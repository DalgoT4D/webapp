import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Lightbulb } from "lucide-react"

export function TextualInsights() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2 p-3">
        <Lightbulb className="h-5 w-5 text-amber-500" />
        <div>
          <CardTitle className="text-base">Key Insights</CardTitle>
          <CardDescription className="text-xs">Advanced data correlations</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-3 space-y-2 overflow-auto max-h-[250px]">
        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Protocol & Risk Correlation</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Strong correlation (r=0.78) between protocol adherence and risk reduction. 90%+ adherence shows 65% faster
            improvement.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Geographic Disparity</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Eastern district: 23% higher risk cases despite similar visit rates. Socioeconomic factors likely
            contributing.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Nutritional Protocol Impact</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Nutritional protocols show 3.2x higher correlation to positive outcomes than other categories.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Visit Frequency Benefits</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Bi-weekly visits show 42% better outcomes than monthly schedules.
          </p>
        </div>

        <div className="rounded-lg border p-2">
          <h3 className="font-medium text-sm">Team Performance Factors</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Cross-trained teams show 37% higher effectiveness. Team D: 90% cross-training rate.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
