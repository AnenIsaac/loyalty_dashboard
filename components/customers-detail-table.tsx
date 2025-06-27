"use client"

import React, { useState, useMemo, useCallback } from "react"
import { MoreVertical, MessageCircle, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { LoadingComponent } from "@/components/ui/loading-component"
import { EmptyStateComponent } from "@/components/ui/empty-state-component"
import { FilterPopup } from "@/components/filter-popup"
import { SendMessageModal } from "@/components/send-message-modal"
import { SendBulkMessageModal } from "@/components/send-bulk-message-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Types and interfaces
interface FilterOption {
  id: number
  field: string
  operator: "greater" | "less"
  value: string
}

interface ProcessedCustomer {
  id: string
  name: string
  phoneId: string
  totalSpend: string
  totalVisits: number
  lastVisitDate: string
  points: number
  tag: string
  rpi: number
  lei: number
  spendingScore?: number
}

interface CustomersDetailTableProps {
  customers: ProcessedCustomer[]
  sortField?: string | null
  sortDirection?: "asc" | "desc"
  filters?: FilterOption[]
  isLoading?: boolean
  error?: string | null
  businessId?: string
  onSort?: (field: string, direction: "asc" | "desc") => void
  onFilter?: (filters: FilterOption[]) => void
  onSendBulkMessage?: () => void
}

// SECTION 1: Main Component
export function CustomersDetailTable({
  customers,
  sortField = null,
  sortDirection = "asc",
  filters = [],
  isLoading = false,
  error = null,
  businessId,
  onSort,
  onFilter,
  onSendBulkMessage
}: CustomersDetailTableProps) {
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<ProcessedCustomer | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Map filter fields to customer data fields
  const fieldMapping: Record<string, string> = {
    "Total Spend": "totalSpend",
    "Total Visits": "totalVisits",
    "Last Visit Date": "lastVisitDate",
    Points: "points",
    Tag: "tag",
    "Reward Priority Index (RPI)": "rpi",
    "Loyalty Engagement Index (LEI)": "lei",
  }

  // Define sortable columns with their field mappings
  const sortableColumns = [
    { label: "Customer", field: "name" },
    { label: "Phone", field: "phoneId" },
    { label: "Total Spend", field: "totalSpend" },
    { label: "Visits", field: "totalVisits" },
    { label: "Last Visit", field: "lastVisitDate" },
    { label: "Points", field: "points" },
    { label: "Tag", field: "tag" },
    { label: "RPI", field: "rpi" },
    { label: "LEI", field: "lei" },
  ]

  // Handle column header click for sorting
  const handleColumnSort = useCallback((field: string) => {
    if (!onSort) return

    if (sortField === field) {
      // Same field clicked - cycle through: asc -> desc -> none
      if (sortDirection === "asc") {
        onSort(field, "desc")
      } else if (sortDirection === "desc") {
        onSort("", "asc") // Clear sorting
      }
    } else {
      // New field clicked - start with ascending
      onSort(field, "asc")
    }
  }, [onSort, sortField, sortDirection])

  // Get sort icon for a column
  const getSortIcon = useCallback((field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    
    if (sortDirection === "asc") {
      return <ArrowUp className="h-4 w-4 text-orange-500" />
    } else {
      return <ArrowDown className="h-4 w-4 text-orange-500" />
    }
  }, [sortField, sortDirection])

  // Derived state and calculations
  const processedCustomers = useMemo(() => {
    let filteredCustomers = [...customers]

    // Apply search filter first
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filteredCustomers = filteredCustomers.filter((customer) => {
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.phoneId.toLowerCase().includes(query)
        )
      })
    }

    // Apply filters
    if (filters && filters.length > 0) {
      filteredCustomers = filteredCustomers.filter((customer) => {
        return filters.every((filter) => {
          const fieldName = fieldMapping[filter.field] || filter.field
          const customerValue = customer[fieldName as keyof ProcessedCustomer]

          // Skip if customer value is undefined
          if (customerValue === undefined || customerValue === null) {
            return false
          }

          // Handle tag comparisons (exact match)
          if (fieldName === "tag") {
            return customerValue.toString().toLowerCase() === filter.value.toLowerCase()
          }

          // Convert to number for numeric comparisons (remove commas)
          if (["totalSpend", "points", "rpi", "lei", "totalVisits", "spendingScore"].includes(fieldName)) {
            const numValue = typeof customerValue === 'string' ? 
              Number(customerValue.toString().replace(/,/g, '')) : 
              Number(customerValue)
            const filterValue = Number(filter.value)

            if (isNaN(filterValue)) return true // Skip invalid filter values

            if (filter.operator === "greater") {
              return numValue > filterValue
            } else {
              return numValue < filterValue
            }
          }

          // Handle date comparisons
          if (fieldName === "lastVisitDate") {
            if (customerValue.toString() === 'Never') {
              return filter.operator === "less" // "Never" is considered older than any date
            }

            try {
              // Parse DD/MM/YYYY format
              const customerDate = new Date(customerValue.toString().split("/").reverse().join("/"))
              const filterDate = new Date(filter.value)

              if (isNaN(customerDate.getTime()) || isNaN(filterDate.getTime())) {
                return true // Skip invalid dates
              }

              if (filter.operator === "greater") {
                return customerDate > filterDate
              } else {
                return customerDate < filterDate
              }
            } catch (error) {
              return true // Skip on error
            }
          }

          // Handle string comparisons (fallback)
          if (filter.operator === "greater") {
            return customerValue.toString() > filter.value
          } else {
            return customerValue.toString() < filter.value
          }
        })
      })
    }

    // Apply sorting
    if (sortField) {
      filteredCustomers.sort((a, b) => {
        // Handle numeric fields
        if (["totalSpend", "points", "rpi", "lei", "totalVisits", "spendingScore"].includes(sortField)) {
          const aValue = typeof a[sortField as keyof ProcessedCustomer] === 'string' ?
            Number((a[sortField as keyof ProcessedCustomer] || '').toString().replace(/,/g, '')) :
            Number(a[sortField as keyof ProcessedCustomer] || 0)
          const bValue = typeof b[sortField as keyof ProcessedCustomer] === 'string' ?
            Number((b[sortField as keyof ProcessedCustomer] || '').toString().replace(/,/g, '')) :
            Number(b[sortField as keyof ProcessedCustomer] || 0)

          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        // Handle date fields
        if (sortField === "lastVisitDate") {
          // Convert DD/MM/YYYY to Date objects
          const parseDate = (dateStr: string) => {
            if (dateStr === 'Never') return new Date(0)
            const [day, month, year] = dateStr.split("/").map(Number)
            return new Date(year, month - 1, day)
          }
          
          const aDate = parseDate(a.lastVisitDate)
          const bDate = parseDate(b.lastVisitDate)

          return sortDirection === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
        }

        // Handle string fields
        const aValue = (a[sortField as keyof ProcessedCustomer] || '').toString()
        const bValue = (b[sortField as keyof ProcessedCustomer] || '').toString()

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    return filteredCustomers
  }, [customers, sortField, sortDirection, filters, searchQuery])

  // Pagination calculations
  const totalPages = Math.ceil(processedCustomers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageCustomers = processedCustomers.slice(startIndex, endIndex)

  // Reset to page 1 when filters or search changes
  React.useEffect(() => {
    setCurrentPage(1)
  }, [filters, searchQuery])

  // Event handlers
  const handleSendMessage = useCallback((customer: ProcessedCustomer) => {
    setSelectedCustomer(customer)
    setMessageModalOpen(true)
  }, [])

  const handleBulkMessage = useCallback(() => {
    setBulkMessageModalOpen(true)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  const handlePageSizeChange = useCallback((newPageSize: string) => {
    setPageSize(Number(newPageSize))
    setCurrentPage(1) // Reset to first page when changing page size
  }, [])

  const getTagColor = useCallback((tag: string): string => {
    switch (tag.toLowerCase()) {
      case 'send promotion':
        return 'bg-orange-100 text-orange-800'
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'vip':
        return 'bg-purple-100 text-purple-800'
      case 'new':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }, [])

  // SECTION 2: Loading and Error States
  if (isLoading) {
    return <LoadingComponent message="Loading customers..." />
  }

  if (error) {
    return (
      <EmptyStateComponent
        title="Error loading customers"
        description={error}
      />
    )
  }

  if (!processedCustomers.length && !searchQuery.trim() && (!filters || filters.length === 0)) {
    return (
      <EmptyStateComponent
        title="No customers found"
        description="You haven't recorded any customer interactions yet."
      />
    )
  }

  // SECTION 3: Main Render
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h3 className="text-md font-medium">Customer Details</h3>
          <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
            Showing {startIndex + 1}-{Math.min(endIndex, processedCustomers.length)} of {processedCustomers.length}
          </span>
        </div>
        <div className="flex gap-2">
          {onFilter && <FilterPopup onFilter={onFilter} />}
          <Button onClick={handleBulkMessage} variant="outline" className="gap-2">
            <MessageCircle className="h-4 w-4" />
            Bulk Message
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by customer name or phone number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* No results message */}
      {!processedCustomers.length && (searchQuery.trim() || (filters && filters.length > 0)) && (
        <EmptyStateComponent
          title="No customers found"
          description={
            searchQuery.trim() 
              ? `No customers match your search for "${searchQuery}"`
              : "No customers match your current filters"
          }
        />
      )}

      {/* Table - only show if there are customers */}
      {processedCustomers.length > 0 && (
        <>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {sortableColumns.map((column) => (
                    <TableHead key={column.field}>
                      <div 
                        className="flex items-center gap-1 cursor-pointer hover:text-orange-500 transition-colors"
                        onClick={() => handleColumnSort(column.field)}
                      >
                        <span>{column.label}</span>
                        {getSortIcon(column.field)}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentPageCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div className="font-medium">{customer.name}</div>
                    </TableCell>
                    <TableCell>{customer.phoneId}</TableCell>
                    <TableCell>{customer.totalSpend} TZs</TableCell>
                    <TableCell>{customer.totalVisits}</TableCell>
                    <TableCell>{customer.lastVisitDate}</TableCell>
                    <TableCell>
                      <span className="text-blue-600 font-medium">
                        {customer.points}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTagColor(customer.tag)}>
                        {customer.tag}
                      </Badge>
                    </TableCell>
                    <TableCell>{customer.rpi}</TableCell>
                    <TableCell>{customer.lei}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleSendMessage(customer)}>
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Rows per page:</span>
              <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      className={currentPage === pageNumber ? "bg-orange-500 hover:bg-orange-600" : ""}
                      onClick={() => handlePageChange(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Send Message Modal */}
      <SendMessageModal
        open={messageModalOpen}
        onOpenChange={setMessageModalOpen}
        customer={selectedCustomer ? {
          name: selectedCustomer.name,
          phoneId: selectedCustomer.phoneId,
          points: selectedCustomer.points.toString(),
          totalSpend: selectedCustomer.totalSpend,
          id: selectedCustomer.id
        } : null}
        businessId={businessId}
      />

      {/* Bulk Message Modal */}
      <SendBulkMessageModal
        open={bulkMessageModalOpen}
        onOpenChange={setBulkMessageModalOpen}
        customers={customers}
        appliedFilters={filters}
      />
    </div>
  )
}
