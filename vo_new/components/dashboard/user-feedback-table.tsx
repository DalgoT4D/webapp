import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarIcon } from "lucide-react"

const feedbackData = [
  {
    id: "FB-1234",
    user: "John Smith",
    role: "Field Worker",
    feature: "Visit Logging",
    rating: 4,
    feedback: "Very intuitive and easy to use in the field.",
    date: "2023-05-15",
  },
  {
    id: "FB-1235",
    user: "Maria Garcia",
    role: "Manager",
    feature: "Dashboards",
    rating: 5,
    feedback: "The visualizations make it easy to track progress.",
    date: "2023-05-16",
  },
  {
    id: "FB-1236",
    user: "David Johnson",
    role: "Field Worker",
    feature: "Risk Assessment",
    rating: 3,
    feedback: "Works well but could use more offline capabilities.",
    date: "2023-05-17",
  },
  {
    id: "FB-1237",
    user: "Sarah Williams",
    role: "Admin",
    feature: "Reporting",
    rating: 4,
    feedback: "Great for generating reports for funders.",
    date: "2023-05-18",
  },
  {
    id: "FB-1238",
    user: "Michael Brown",
    role: "Field Worker",
    feature: "Chat Assistant",
    rating: 2,
    feedback: "Needs improvement in understanding local terminology.",
    date: "2023-05-19",
  },
]

export function UserFeedbackTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>User Feedback</CardTitle>
        <CardDescription>Recent feedback from platform users</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(feedbackData || []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.user}</TableCell>
                <TableCell>
                  <Badge variant="outline">{item.role}</Badge>
                </TableCell>
                <TableCell>{item.feature}</TableCell>
                <TableCell>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-4 w-4 ${i < item.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-[300px] truncate">{item.feedback}</TableCell>
                <TableCell>{item.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
