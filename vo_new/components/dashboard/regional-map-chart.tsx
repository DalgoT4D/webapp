"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { FilterValues } from "./dashboard-filters"
import { format } from "date-fns"

interface RegionalMapChartProps {
  filters: FilterValues
}

export function RegionalMapChart({ filters }: RegionalMapChartProps) {
  // Format date range for display
  const dateRangeText =
    filters.dateRange.from && filters.dateRange.to
      ? `${format(filters.dateRange.from, "MMM d, yyyy")} - ${format(filters.dateRange.to, "MMM d, yyyy")}`
      : "All time"

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Regional Performance Map</CardTitle>
            <CardDescription>
              Geographic distribution of program metrics for {dateRangeText}
              {filters.region !== "all" && `, ${filters.region} region`}
              {filters.team !== "all" && `, ${filters.team}`}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-md border">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <div className="relative w-full h-full">
              {/* SVG Map of the regions */}
              <svg viewBox="0 0 800 450" className="w-full h-full">
                {/* Eastern District - High Risk */}
                <g>
                  <path d="M500,50 L750,50 L750,200 L500,200 Z" fill="#fecaca" stroke="#ef4444" strokeWidth="2" />
                  <text x="625" y="125" textAnchor="middle" fill="#ef4444" fontWeight="bold">
                    Eastern District
                  </text>
                  <text x="625" y="150" textAnchor="middle" fill="#ef4444">
                    High Risk (23%)
                  </text>
                  <text x="625" y="175" textAnchor="middle" fill="#ef4444">
                    8 Missed Follow-ups
                  </text>
                </g>

                {/* Western District - Good */}
                <g>
                  <path d="M50,50 L300,50 L300,200 L50,200 Z" fill="#dcfce7" stroke="#22c55e" strokeWidth="2" />
                  <text x="175" y="125" textAnchor="middle" fill="#22c55e" fontWeight="bold">
                    Western District
                  </text>
                  <text x="175" y="150" textAnchor="middle" fill="#22c55e">
                    Low Risk (8%)
                  </text>
                  <text x="175" y="175" textAnchor="middle" fill="#22c55e">
                    95% Visit Completion
                  </text>
                </g>

                {/* Northern District - Medium */}
                <g>
                  <path d="M300,50 L500,50 L500,200 L300,200 Z" fill="#fef9c3" stroke="#eab308" strokeWidth="2" />
                  <text x="400" y="125" textAnchor="middle" fill="#854d0e" fontWeight="bold">
                    Northern District
                  </text>
                  <text x="400" y="150" textAnchor="middle" fill="#854d0e">
                    Medium Risk (15%)
                  </text>
                  <text x="400" y="175" textAnchor="middle" fill="#854d0e">
                    88% Visit Completion
                  </text>
                </g>

                {/* Southern District - Medium */}
                <g>
                  <path d="M300,200 L500,350 L300,350 Z" fill="#fed7aa" stroke="#f97316" strokeWidth="2" />
                  <text x="370" y="300" textAnchor="middle" fill="#9a3412" fontWeight="bold">
                    Southern District
                  </text>
                  <text x="370" y="325" textAnchor="middle" fill="#9a3412">
                    Medium Risk (12%)
                  </text>
                </g>

                {/* Legend */}
                <g transform="translate(50, 350)">
                  <rect x="0" y="0" width="20" height="20" fill="#fecaca" stroke="#ef4444" />
                  <text x="30" y="15" fill="#000000">
                    High Risk
                  </text>

                  <rect x="150" y="0" width="20" height="20" fill="#fed7aa" stroke="#f97316" />
                  <text x="180" y="15" fill="#000000">
                    Medium Risk
                  </text>

                  <rect x="300" y="0" width="20" height="20" fill="#fef9c3" stroke="#eab308" />
                  <text x="330" y="15" fill="#000000">
                    Low Risk
                  </text>

                  <rect x="450" y="0" width="20" height="20" fill="#dcfce7" stroke="#22c55e" />
                  <text x="480" y="15" fill="#000000">
                    Good Performance
                  </text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
