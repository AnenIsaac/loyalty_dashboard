"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { SendMessageModal } from "@/components/send-message-modal"
import { SendBulkMessageModal } from "@/components/send-bulk-message-modal"

// Initial customer data
const initialCustomers = [
  {
    name: "Nicholas Patrick",
    phoneId: "+255763870355",
    totalSpend: "255,000",
    totalVisits: "10",
    lastVisitDate: "3/02/2025",
    points: "150",
    tag: "Send Promotion",
    rpi: "160",
    lei: "150",
    spendingScore: 85,
  },
  {
    name: "Cordell Edwards",
    phoneId: "+255763870355",
    totalSpend: "350,000",
    totalVisits: "12",
    lastVisitDate: "4/02/2025",
    points: "95",
    tag: "Send Promotion",
    rpi: "140",
    lei: "45",
    spendingScore: 92,
  },
  {
    name: "Derrick Spencer",
    phoneId: "+255763870355",
    totalSpend: "250,500",
    totalVisits: "9",
    lastVisitDate: "27/12/2024",
    points: "120",
    tag: "Send Promotion",
    rpi: "130",
    lei: "120",
    spendingScore: 78,
  },
  {
    name: "Larissa Burton",
    phoneId: "+255763870355",
    totalSpend: "150,000",
    totalVisits: "13",
    lastVisitDate: "22/01/2024",
    points: "120",
    tag: "Active",
    rpi: "100",
    lei: "120",
    spendingScore: 45,
  },
  {
    name: "Caroline Joune",
    phoneId: "+255763870355",
    totalSpend: "140,000",
    totalVisits: "7",
    lastVisitDate: "13/01/2025",
    points: "120",
    tag: "Active",
    rpi: "100",
    lei: "120",
    spendingScore: 65,
  },
]

interface FilterOption {
  id: number
  field: string
  operator: "greater" | "less"
  value: string
}

interface CustomersTableProps {
  sortField?: string | null
  sortDirection?: "asc" | "desc"
  filters?: FilterOption[]
}

export function CustomersTable({
  sortField = null,
  sortDirection = "asc",
  filters = [],
}: CustomersTableProps) {
  const [messageModalOpen, setMessageModalOpen] = useState(false)
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<(typeof initialCustomers)[0] | null>(null)

  // Map filter fields to customer data fields
  const fieldMapping: Record<string, string> = {
    "Total Spend": "totalSpend",
    "Last Visit Date": "lastVisitDate",
    Points: "points",
    Tag: "tag",
    "Reward Priority Index (RPI)": "rpi",
    "Loyalty Engagement Index (LPI)": "lei",
    "Total Visits": "totalVisits",
    "Spending Score": "spendingScore",
  }

  // Apply sorting and filtering using useMemo
  const customers = useMemo(() => {
    let filteredCustomers = [...initialCustomers]

    // Apply filters
    if (filters && filters.length > 0) {
      filteredCustomers = filteredCustomers.filter((customer) => {
        return filters.every((filter) => {
          const fieldName = fieldMapping[filter.field] || filter.field
          const customerValue = customer[fieldName as keyof typeof customer]

          // Convert to number for numeric comparisons (remove commas)
          if (["totalSpend", "points", "rpi", "lei", "totalVisits", "spendingScore"].includes(fieldName)) {
            const numValue = Number(customerValue)
            const filterValue = Number(filter.value)

            if (filter.operator === "greater") {
              return numValue > filterValue
            } else {
              return numValue < filterValue
            }
          }

          // Handle date comparisons
          if (fieldName === "lastVisitDate") {
            const customerDate = new Date(customerValue.split("/").reverse().join("/"))
            const filterDate = new Date(filter.value)

            if (filter.operator === "greater") {
              return customerDate > filterDate
            } else {
              return customerDate < filterDate
            }
          }

          // Handle string comparisons (like tag)
          if (filter.operator === "greater") {
            return customerValue > filter.value
          } else {
            return customerValue < filter.value
          }
        })
      })
    }

    // Apply sorting
    if (sortField) {
      filteredCustomers.sort((a, b) => {
        // Handle numeric fields
        if (["totalSpend", "points", "rpi", "lei", "totalVisits", "spendingScore"].includes(sortField)) {
          const aValue = Number(a[sortField as keyof typeof a])
          const bValue = Number(b[sortField as keyof typeof b])

          return sortDirection === "asc" ? aValue - bValue : bValue - aValue
        }

        // Handle date fields
        if (sortField === "lastVisitDate") {
          // Convert DD/MM/YYYY to Date objects
          const [aDay, aMonth, aYear] = a.lastVisitDate.split("/").map(Number)
          const [bDay, bMonth, bYear] = b.lastVisitDate.split("/").map(Number)

          const aDate = new Date(aYear, aMonth - 1, aDay)
          const bDate = new Date(bYear, bMonth - 1, bDay)

          return sortDirection === "asc" ? aDate.getTime() - bDate.getTime() : bDate.getTime() - aDate.getTime()
        }

        // Handle string fields
        const aValue = a[sortField as keyof typeof a]
        const bValue = b[sortField as keyof typeof b]

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue)
        } else {
          return bValue.localeCompare(aValue)
        }
      })
    }

    return filteredCustomers
  }, [sortField, sortDirection, filters])

  const handleSendMessage = (customer: (typeof initialCustomers)[0]) => {
    setSelectedCustomer(customer)
    setMessageModalOpen(true)
  }

  const handleSendBulkMessage = () => {
    setBulkMessageModalOpen(true)
  }

  return (
    <>
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>PhoneID</TableHead>
              <TableHead>Total Spend</TableHead>
              <TableHead>Total Visits</TableHead>
              <TableHead>Last Visit Date</TableHead>
              <TableHead>Spending Score</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>TAG</TableHead>
              <TableHead className="text-green-500">RPI</TableHead>
              <TableHead>LEI</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.length > 0 ? (
              customers.map((customer, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phoneId}</TableCell>
                  <TableCell>{customer.totalSpend}</TableCell>
                  <TableCell>{customer.totalVisits}</TableCell>
                  <TableCell>{customer.lastVisitDate}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{customer.spendingScore}</span>
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            customer.spendingScore >= 75 
                              ? 'bg-green-500' 
                              : customer.spendingScore >= 50
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${customer.spendingScore}%` 
                          }}
                        />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.points}</TableCell>
                  <TableCell>{customer.tag}</TableCell>
                  <TableCell
                    className={
                      Number.parseInt(customer.rpi) >= 140
                        ? "text-green-500"
                        : Number.parseInt(customer.rpi) >= 100
                          ? "text-orange-500"
                          : ""
                    }
                  >
                    {customer.rpi}
                  </TableCell>
                  <TableCell>{customer.lei}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSendMessage(customer)}>
                          Send Message
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-4">
                  No customers found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedCustomer && (
        <SendMessageModal
          open={messageModalOpen}
          onOpenChange={setMessageModalOpen}
          customer={selectedCustomer}
        />
      )}

      <SendBulkMessageModal open={bulkMessageModalOpen} onOpenChange={setBulkMessageModalOpen} />
    </>
  )
}
