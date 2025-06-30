import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

const fundingData = [
  {
    category: "Personnel",
    allocated: 450000,
    spent: 382500,
    remaining: 67500,
    percentSpent: 85,
  },
  {
    category: "Medical Supplies",
    allocated: 250000,
    spent: 187500,
    remaining: 62500,
    percentSpent: 75,
  },
  {
    category: "Training",
    allocated: 150000,
    spent: 120000,
    remaining: 30000,
    percentSpent: 80,
  },
  {
    category: "Travel & Transportation",
    allocated: 100000,
    spent: 92000,
    remaining: 8000,
    percentSpent: 92,
  },
  {
    category: "Infrastructure",
    allocated: 50000,
    spent: 35000,
    remaining: 15000,
    percentSpent: 70,
  },
]

export function FundingAllocationTable() {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Allocation</CardTitle>
        <CardDescription>Budget allocation and utilization by category</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Allocated</TableHead>
              <TableHead>Spent</TableHead>
              <TableHead>Remaining</TableHead>
              <TableHead>% Spent</TableHead>
              <TableHead className="w-[100px]">Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(fundingData || []).map((item) => (
              <TableRow key={item.category}>
                <TableCell className="font-medium">{item.category}</TableCell>
                <TableCell>{formatCurrency(item.allocated)}</TableCell>
                <TableCell>{formatCurrency(item.spent)}</TableCell>
                <TableCell>{formatCurrency(item.remaining)}</TableCell>
                <TableCell>{item.percentSpent}%</TableCell>
                <TableCell>
                  <Progress value={item.percentSpent} className="h-2" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
