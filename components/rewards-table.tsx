"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyStateComponent } from "@/components/ui/empty-state-component"
import { Gift, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react"
import type { RewardsCatalog, CustomerReward, Customer } from "@/types/common"

interface RewardsTableProps {
  rewardsCatalog?: RewardsCatalog[]
  customerRewards?: CustomerReward[]
  customers?: Customer[]
}

interface ProcessedReward extends CustomerReward {
  customerName: string
  rewardTitle: string
  numericDate: number
}

type SortField = 'customerName' | 'rewardTitle' | 'points_spent' | 'status' | 'numericDate'
type SortDirection = 'asc' | 'desc' | null

export function RewardsTable({ 
  rewardsCatalog = [], 
  customerRewards = [], 
  customers = [] 
}: RewardsTableProps) {
  // State for sorting and pagination
  const [sortField, setSortField] = useState<SortField | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const getCustomerName = (customerId: string): string => {
    if (!customers || customers.length === 0) {
      return 'Unknown'
    }
    const customer = customers.find(c => c.id === customerId)
    return customer?.full_name || customer?.nickname || 'Unknown'
  }

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'redeemed':
        return 'bg-green-100 text-green-800'
      case 'claimed':
        return 'bg-blue-100 text-blue-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Process and sort rewards
  // Debug: Log customer rewards data
  console.log('RewardsTable - Received customerRewards:', customerRewards)
  console.log('RewardsTable - customerRewards length:', customerRewards?.length)
  if (customerRewards && customerRewards.length > 0) {
    console.log('RewardsTable - Sample reward:', customerRewards[0])
  }
  const processedRewards = useMemo((): ProcessedReward[] => {
    if (!customerRewards || customerRewards.length === 0) {
      return []
    }
    
    const processed = customerRewards.map(reward => ({
      ...reward,
      customerName: getCustomerName(reward.customer_id),
      rewardTitle: reward.rewards?.title || 'Unknown Reward',
      numericDate: new Date(reward.created_at).getTime()
    }))

    // Apply sorting
    if (sortField && sortDirection) {
      processed.sort((a, b) => {
        let aValue: any = a[sortField]
        let bValue: any = b[sortField]

        // Handle string comparisons
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1

        return sortDirection === 'desc' ? -comparison : comparison
      })
    }

    return processed
  }, [customerRewards, customers, sortField, sortDirection])

  // Pagination calculations
  const totalPages = Math.ceil(processedRewards.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const currentPageRewards = processedRewards.slice(startIndex, endIndex)

  // Reset to page 1 when page size changes
  const handlePageSizeChange = (newPageSize: string) => {
    setPageSize(Number(newPageSize))
    setCurrentPage(1)
  }

  // Column sorting
  const handleColumnSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortField(null)
      }
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Get sort icon for column
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-gray-400" />
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="h-3 w-3 text-orange-500" />
    }
    if (sortDirection === 'desc') {
      return <ArrowDown className="h-3 w-3 text-orange-500" />
    }
    return <ArrowUpDown className="h-3 w-3 text-gray-400" />
  }

  // Pagination controls
  const renderPaginationNumbers = () => {
    const pages = []
    const maxVisiblePages = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className={currentPage === i ? "bg-orange-500 hover:bg-orange-600" : ""}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Button>
      )
    }
    return pages
  }

  const sortableColumns = [
    { field: 'customerName' as SortField, label: 'Customer' },
    { field: 'rewardTitle' as SortField, label: 'Reward' },
    { field: 'points_spent' as SortField, label: 'Points' },
    { field: 'status' as SortField, label: 'Status' },
    { field: 'numericDate' as SortField, label: 'Date' }
  ]

  if (!customerRewards.length) {
    return (
      <EmptyStateComponent
        title="No rewards redeemed yet"
        description="Recent reward redemptions will appear here once customers start redeeming rewards."
        icon={<Gift className="h-12 w-12 text-gray-400" />}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-md font-medium">Recent Redemptions</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">
            Showing {startIndex + 1}-{Math.min(endIndex, processedRewards.length)} of {processedRewards.length}
          </span>
          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedRewards.length > 0 ? (
              currentPageRewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell className="font-medium">
                    {reward.customerName}
                  </TableCell>
                  <TableCell>{reward.rewardTitle}</TableCell>
                  <TableCell>
                    <span className="text-red-600 font-medium">
                      -{reward.points_spent}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(reward.status)}>
                      {reward.status || 'pending'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(reward.created_at).toLocaleDateString('en-GB')}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                  No rewards redeemed yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex gap-1">
            {renderPaginationNumbers()}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
