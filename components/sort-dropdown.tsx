"use client"

import { useState } from "react"
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SortDropdownProps {
  onSort: (field: string, direction: "asc" | "desc") => void
}

export function SortDropdown({ onSort }: SortDropdownProps) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

  const sortOptions = [
    { label: "Total Spend", value: "totalSpend" },
    { label: "Total Visits", value: "totalVisits" },
    { label: "Last Visit Date", value: "lastVisitDate" },
    { label: "Points", value: "points" },
    { label: "Tag", value: "tag" },
    { label: "Reward Priority Index (RPI)", value: "rpi" },
    { label: "Loyalty Engagement Index (LEI)", value: "lei" },
  ]

  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (sortField === field) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc"
      setSortDirection(newDirection)
      onSort(field, newDirection)
    } else {
      // New field, default to ascending
      setSortField(field)
      setSortDirection("asc")
      onSort(field, "asc")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-300 text-gray-700 hover:bg-orange-50 gap-1">
          Sort <ChevronDown className="h-4 w-4 text-orange-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSort(option.value)}
            className="flex justify-between items-center"
          >
            <span>{option.label}</span>
            {sortField === option.value &&
              (sortDirection === "asc" ? (
                <ArrowUp className="h-4 w-4 text-orange-500" />
              ) : (
                <ArrowDown className="h-4 w-4 text-orange-500" />
              ))}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
