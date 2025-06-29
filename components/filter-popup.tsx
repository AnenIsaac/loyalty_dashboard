"use client"

import { useState, useEffect } from "react"
import { Plus, Minus, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface FilterOption {
  id: number
  field: string
  operator: "greater" | "less"
  value: string
}

interface FilterPopupProps {
  onFilter: (filters: FilterOption[]) => void
}

export function FilterPopup({ onFilter }: FilterPopupProps) {
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOption[]>([])

  // Filter fields in the same order as sort options
  const filterFields = [
    "Total Spend",
    "Total Visits", 
    "Last Visit Date",
    "Points",
    "Secondary Status"
  ]

  const statusOptions = ["Active", "At Risk", "Lapsed"]

  const handleAddFilter = () => {
    const newFilter = {
      id: Date.now(),
      field: filterFields[0],
      operator: "greater" as const,
      value: "",
    }
    setFilters([...filters, newFilter])
  }

  const handleRemoveFilter = (id: number) => {
    setFilters(filters.filter((filter) => filter.id !== id))
  }

  const handleFilterChange = (id: number, field: keyof FilterOption, value: any) => {
    setFilters(filters.map((filter) => (filter.id === id ? { ...filter, [field]: value } : filter)))
  }

  const handleApplyFilter = () => {
    // Only apply filters that have values
    const validFilters = filters.filter(filter => filter.value.trim() !== "")
    onFilter(validFilters)
    setOpen(false)
  }

  const handleClearFilters = () => {
    setFilters([])
    onFilter([])
    setOpen(false)
  }

  // Add a filter by default if there are none when opening the popup
  useEffect(() => {
    if (open && filters.length === 0) {
      handleAddFilter()
    }
  }, [open])

  const getFilterInput = (filter: FilterOption) => {
    // Special handling for Secondary Status field
    if (filter.field === "Secondary Status") {
      return (
        <Select value={filter.value} onValueChange={(value) => handleFilterChange(filter.id, "value", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((status) => (
              <SelectItem key={status} value={status}>
                {status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    // Special handling for Last Visit Date field
    if (filter.field === "Last Visit Date") {
      return (
        <Input
          type="date"
          value={filter.value}
          onChange={(e) => handleFilterChange(filter.id, "value", e.target.value)}
          placeholder="Select date"
        />
      )
    }

    // Default numeric input for other fields
    const getPlaceholder = () => {
      switch (filter.field) {
        case "Total Spend":
          return "Enter amount (e.g. 100000)"
        case "Total Visits":
          return "Enter visits (e.g. 5)"
        case "Points":
          return "Enter points (e.g. 100)"
        default:
          return "Enter value"
      }
    }

    return (
      <Input
        type="number"
        value={filter.value}
        onChange={(e) => handleFilterChange(filter.id, "value", e.target.value)}
        placeholder={getPlaceholder()}
      />
    )
  }

  const getOperatorOptions = (filter: FilterOption) => {
    // Secondary Status field doesn't need operators - it's exact match
    if (filter.field === "Secondary Status") {
      return null
    }

    return (
      <Select
        value={filter.operator}
        onValueChange={(value: "greater" | "less") => handleFilterChange(filter.id, "operator", value)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select operator" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="greater">Greater than</SelectItem>
          <SelectItem value="less">Less than</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="border-orange-300 text-gray-700 hover:bg-orange-50 gap-1"
        onClick={() => setOpen(true)}
      >
        Filter <Filter className="h-4 w-4 text-orange-500" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px] p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium">Filter Customers</h3>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4 mb-6">
            {filters.map((filter) => (
              <div key={filter.id} className="flex items-center gap-2">
                <div className="flex-1">
                  <Select value={filter.field} onValueChange={(value) => handleFilterChange(filter.id, "field", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select field" />
                    </SelectTrigger>
                    <SelectContent>
                      {filterFields.map((field) => (
                        <SelectItem key={field} value={field}>
                          {field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {filter.field !== "Secondary Status" && (
                  <div className="flex-1">
                    {getOperatorOptions(filter)}
                  </div>
                )}
                <div className="flex-1">
                  {getFilterInput(filter)}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full bg-orange-100 hover:bg-orange-200"
                  onClick={() => handleRemoveFilter(filter.id)}
                >
                  <Minus className="h-4 w-4 text-orange-500" />
                </Button>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full border border-dashed border-gray-300 text-gray-500 hover:text-orange-500 hover:border-orange-300 mb-6"
            onClick={handleAddFilter}
          >
            <Plus className="h-4 w-4 mr-2" /> Add filter
          </Button>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={handleClearFilters}
            >
              Clear All
            </Button>
            <Button 
              className="flex-1 bg-[#F8843A] hover:bg-[#E77A35] text-white" 
              onClick={handleApplyFilter}
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
