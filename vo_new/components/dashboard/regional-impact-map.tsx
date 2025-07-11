import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function RegionalImpactMap() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Regional Impact</CardTitle>
        <CardDescription>Geographic distribution of program impact</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="w-full h-[200px] bg-muted rounded-md flex items-center justify-center text-muted-foreground">
          Map Visualization
        </div>
      </CardContent>
    </Card>
  )
}
