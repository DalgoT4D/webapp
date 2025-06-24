import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FilterValues } from "@/components/dashboard/dashboard-filters"

interface FieldVisitTableProps {
  filters?: FilterValues
}

const fieldVisits = [
  {
    id: "FV-1234",
    date: "2023-05-20",
    location: "Eastern District",
    team: "Team A",
    beneficiary: "Maria Johnson",
    status: "completed",
    riskLevel: "high",
  },
  {
    id: "FV-1235",
    date: "2023-05-20",
    location: "Western District",
    team: "Team B",
    beneficiary: "Sarah Williams",
    status: "completed",
    riskLevel: "medium",
  },
  {
    id: "FV-1236",
    date: "2023-05-21",
    location: "Northern District",
    team: "Team D",
    beneficiary: "Emily Davis",
    status: "completed",
    riskLevel: "low",
  },
  {
    id: "FV-1237",
    date: "2023-05-21",
    location: "Eastern District",
    team: "Team C",
    beneficiary: "Jessica Brown",
    status: "missed",
    riskLevel: "high",
  },
  {
    id: "FV-1238",
    date: "2023-05-22",
    location: "Southern District",
    team: "Team A",
    beneficiary: "Amanda Wilson",
    status: "completed",
    riskLevel: "medium",
  },
]

export function FieldVisitTable({ filters }: FieldVisitTableProps) {
  // In a real app, you would filter the data based on the filters
  // For now, we'll just use the static data
  const tableData = fieldVisits || []

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Field Visits</CardTitle>
        <CardDescription className="text-xs">Latest field visits and their status</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Team</TableHead>
                <TableHead>Beneficiary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">{visit.id}</TableCell>
                  <TableCell>{visit.date}</TableCell>
                  <TableCell>{visit.location}</TableCell>
                  <TableCell>{visit.team}</TableCell>
                  <TableCell>{visit.beneficiary}</TableCell>
                  <TableCell>
                    <Badge variant={visit.status === "completed" ? "default" : "destructive"}>{visit.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        visit.riskLevel === "high"
                          ? "border-red-500 text-red-500"
                          : visit.riskLevel === "medium"
                            ? "border-orange-500 text-orange-500"
                            : "border-green-500 text-green-500"
                      }
                    >
                      {visit.riskLevel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
