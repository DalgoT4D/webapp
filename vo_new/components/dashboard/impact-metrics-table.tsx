import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpIcon, ArrowDownIcon } from "lucide-react"

const metrics = [
  {
    metric: "Maternal Mortality Rate",
    baseline: "12 per 1000",
    current: "8 per 1000",
    change: -33,
    target: "6 per 1000",
    status: "on-track",
  },
  {
    metric: "Infant Mortality Rate",
    baseline: "18 per 1000",
    current: "13 per 1000",
    change: -28,
    target: "10 per 1000",
    status: "on-track",
  },
  {
    metric: "Malnutrition Prevalence",
    baseline: "24%",
    current: "15%",
    change: -37,
    target: "12%",
    status: "on-track",
  },
  {
    metric: "Antenatal Care Coverage",
    baseline: "65%",
    current: "87%",
    change: 34,
    target: "90%",
    status: "on-track",
  },
  {
    metric: "Skilled Birth Attendance",
    baseline: "70%",
    current: "82%",
    change: 17,
    target: "95%",
    status: "at-risk",
  },
]

export function ImpactMetricsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Metrics</CardTitle>
        <CardDescription>Key performance indicators and their progress</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>Baseline</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(metrics || []).map((item) => (
              <TableRow key={item.metric}>
                <TableCell className="font-medium">{item.metric}</TableCell>
                <TableCell>{item.baseline}</TableCell>
                <TableCell>{item.current}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {item.change < 0 ? (
                      <ArrowDownIcon className="mr-1 h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowUpIcon className="mr-1 h-4 w-4 text-green-500" />
                    )}
                    <span className={item.change < 0 ? "text-green-500" : "text-green-500"}>
                      {Math.abs(item.change)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell>{item.target}</TableCell>
                <TableCell>
                  <Badge
                    variant={item.status === "on-track" ? "default" : "outline"}
                    className={
                      item.status === "on-track"
                        ? ""
                        : item.status === "at-risk"
                          ? "border-orange-500 text-orange-500"
                          : "border-red-500 text-red-500"
                    }
                  >
                    {item.status === "on-track" ? "On Track" : item.status === "at-risk" ? "At Risk" : "Off Track"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
