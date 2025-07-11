"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon, Filter, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

export interface FilterValues {
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  region: string
  team: string
  riskLevel: string
}

interface DashboardFiltersProps {
  onFilterChange: (filters: FilterValues) => void
}

export function DashboardFilters({ onFilterChange }: DashboardFiltersProps) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterValues>({
    dateRange: {
      from: new Date(2023, 4, 1), // May 1, 2023
      to: new Date(2023, 4, 31), // May 31, 2023
    },
    region: "all",
    team: "all",
    riskLevel: "all",
  })

  const [activeFilterCount, setActiveFilterCount] = useState(1) // Date range is active by default

  const handleFilterChange = (newFilters: Partial<FilterValues>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFilterChange(updatedFilters)

    // Count active filters
    let count = 0
    if (updatedFilters.dateRange.from && updatedFilters.dateRange.to) count++
    if (updatedFilters.region !== "all") count++
    if (updatedFilters.team !== "all") count++
    if (updatedFilters.riskLevel !== "all") count++
    setActiveFilterCount(count)
  }

  const resetFilters = () => {
    const defaultFilters = {
      dateRange: {
        from: new Date(2023, 4, 1),
        to: new Date(2023, 4, 31),
      },
      region: "all",
      team: "all",
      riskLevel: "all",
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
    setActiveFilterCount(1)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1">
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 rounded-full">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-3" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filters</h4>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2 text-xs">
                Reset
              </Button>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Date Range</h5>
              <div className={cn("grid gap-2")}>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filters.dateRange.from && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filters.dateRange.from ? (
                        filters.dateRange.to ? (
                          <>
                            {format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(filters.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={filters.dateRange.from}
                      selected={filters.dateRange}
                      onSelect={(range) =>
                        handleFilterChange({ dateRange: range || { from: undefined, to: undefined } })
                      }
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Region</h5>
              <Select value={filters.region} onValueChange={(value) => handleFilterChange({ region: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Regions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Regions</SelectItem>
                  <SelectItem value="eastern">Eastern District</SelectItem>
                  <SelectItem value="western">Western District</SelectItem>
                  <SelectItem value="northern">Northern District</SelectItem>
                  <SelectItem value="southern">Southern District</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Team</h5>
              <Select value={filters.team} onValueChange={(value) => handleFilterChange({ team: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="teamA">Team A</SelectItem>
                  <SelectItem value="teamB">Team B</SelectItem>
                  <SelectItem value="teamC">Team C</SelectItem>
                  <SelectItem value="teamD">Team D</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium">Risk Level</h5>
              <Select value={filters.riskLevel} onValueChange={(value) => handleFilterChange({ riskLevel: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button size="sm" onClick={() => setOpen(false)}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {activeFilterCount > 0 && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="h-8 px-2">
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}
    </div>
  )
}
