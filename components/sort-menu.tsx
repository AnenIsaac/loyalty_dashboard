"use client"

import { useState } from "react"
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface SortOption {
  label: string
  value: string
}

interface SortMenuProps {
  onSort: (field: string, direction: "asc" | "desc") => void
}

export function SortMenu({ onSort }: SortMenuProps) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [open, setOpen] = useState(false)

  const sortOptions: SortOption[] = [
    { label: "Total Spend", value: "totalSpend" },
    { label: "Total Visits", value: "totalVisits" },
    { label: "Last Visit Date", value: "lastVisitDate" },
    { label: "Points", value: "points" },
    { label: "Tag", value: "tag" },
    { label: "Reward Priority Index (RPI)", value: "rpi" },
    { label: "Loyalty Engagement Index (LEI)", value: "lei" },
  ]

  const handleSort = (option: SortOption) => {
    // If clicking the same field, toggle direction
    if (sortField === option.value) {
      const newDirection = sortDirection === "asc" ? "desc" : "asc"
      setSortDirection(newDirection)
      onSort(option.value, newDirection)
    } else {
      // New field, default to ascending
      setSortField(option.value)
      setSortDirection("asc")
      onSort(option.value, "asc")
    }
    setOpen(false)
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="border-orange-300 text-gray-700 hover:bg-orange-50 gap-1">
          Sort <ChevronDown className="h-4 w-4 text-orange-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 z-50">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSort(option)}
            className="flex justify-between items-center cursor-pointer hover:bg-orange-50"
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
