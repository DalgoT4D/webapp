import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, LayoutDashboard, Database, Clock } from "lucide-react"

const recentItems = [
  {
    title: "Maternal Health Overview",
    type: "Dashboard",
    icon: LayoutDashboard,
    time: "2 hours ago",
    href: "/dashboards/maternal-health",
  },
  {
    title: "Q2 Program Impact",
    type: "Report",
    icon: FileText,
    time: "Yesterday",
    href: "/reports/q2-impact",
  },
  {
    title: "Field Visit Records",
    type: "Data",
    icon: Database,
    time: "2 days ago",
    href: "/data/field-visits",
  },
  {
    title: "Nutritional Protocol Compliance",
    type: "Dashboard",
    icon: LayoutDashboard,
    time: "3 days ago",
    href: "/dashboards/nutrition",
  },
]

export function RecentlyViewed() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <div>
          <CardTitle>Recently Viewed</CardTitle>
          <CardDescription>Quick access to your recently viewed items</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {(recentItems || []).map((item) => (
            <Link
              key={item.title}
              href={item.href || "#"}
              className="rounded-lg border p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-primary/10 p-2">
                  {item.icon && <item.icon className="h-5 w-5 text-primary" />}
                </div>
                <div>
                  <h3 className="font-medium">{item.title}</h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
