"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Info, Plus, MessageCircle, Users, TrendingUp, Award, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { EmptyStateComponent } from "@/components/ui/empty-state-component"
import { CustomersDetailTable } from "@/components/customers-detail-table"
import { CustomerInteractionsTable } from "./customer-interactions-table"
import { RewardsTable } from "@/components/rewards-table"
import { RecordActivityModal } from "@/components/record-activity-modal"
import { SendBulkMessageModal } from "@/components/send-bulk-message-modal"
import { FilterPopup } from "@/components/filter-popup"
import { SortMenu } from "@/components/sort-menu"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import type { 
  BasePageProps, 
  Customer, 
  CustomerInteraction,
  CustomerPoint, 
  Reward, 
  CustomerReward, 
  ProcessedCustomer,
  FilterOption,
  CustomerMetrics,
  Business
} from "@/types/common"
import { CustomersTable } from "./customers-table"
import { supabase } from '@/lib/supabaseClient'

interface CustomersPageProps extends BasePageProps {}

interface CustomersPageData {
  business: Business | null
  interactions: CustomerInteraction[]
  customers: Customer[]
  customerPoints: CustomerPoint[]
  rewardsCatalog: Reward[]
  customerRewards: CustomerReward[]
}







export function CustomersPage({ user_id, business_id }: CustomersPageProps) {
  // SECTION 1: State and Data Fetching
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<CustomersPageData>({
    business: null,
    interactions: [],
    customers: [],
    customerPoints: [],
    rewardsCatalog: [],
    customerRewards: []
  })

  // Component state
  const [recordActivityModalOpen, setRecordActivityModalOpen] = useState(false)
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [activeFilters, setActiveFilters] = useState<FilterOption[]>([])

  const loadRealData = useCallback(async () => {
    if (!user_id || !business_id) {
      console.log('CustomersPage - Missing required IDs:', { user_id, business_id })
      setError('Missing required user or business information')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('CustomersPage - Fetching data for:', { user_id, business_id })
      const supabase = createClientComponentClient()

      // Fetch all data in parallel
      const [
        businessResult,
        interactionsResult,
        customersResult,
        customerPointsResult,
        rewardsCatalogResult,
        customerRewardsResult
      ] = await Promise.all([
        // Fetch business data
        supabase
          .from('businesses')
          .select('*')
          .eq('id', business_id)
          .eq('user_id', user_id)
          .single(),

        // Fetch customer interactions
        supabase
          .from('customer_business_interactions')
          .select('*')
          .eq('business_id', business_id)
          .order('created_at', { ascending: false }),

        // Fetch customers (app users)
        supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false }),

        // Fetch customer points
        supabase
          .from('customer_points')
          .select('*')
          .eq('business_id', business_id)
          .order('created_at', { ascending: false }),

        // Fetch rewards catalog
        supabase
          .from('rewards')
          .select('*')
          .eq('business_id', business_id)
          .order('created_at', { ascending: false }),

        // Fetch customer rewards history with joins
        supabase
          .from('customer_rewards')
          .select(`
            *,
            rewards:reward_id (
              id,
              title,
              description,
              points_required
            ),
            customers:customer_id (
              id,
              full_name,
              nickname,
              phone_number
            )
          `)
          .eq('business_id', business_id)
          .order('created_at', { ascending: false })
      ])

      // Check for errors
      if (businessResult.error) {
        console.error('Error fetching business:', businessResult.error)
        throw new Error(`Failed to fetch business data: ${businessResult.error.message}`)
      }

      if (interactionsResult.error) {
        console.error('Error fetching interactions:', interactionsResult.error)
        throw new Error(`Failed to fetch interactions: ${interactionsResult.error.message}`)
      }

      if (customersResult.error) {
        console.error('Error fetching customers:', customersResult.error)
        // Don't throw here as customers table might be empty
        console.log('No customers found or error:', customersResult.error.message)

      if (customerPointsResult.error) {
        console.error('Error fetching customer points:', customerPointsResult.error)
        // Don't throw here as customer_points might be empty
        console.log('No customer points found or error:', customerPointsResult.error.message)
      }
      }

      if (rewardsCatalogResult.error) {
        console.error('Error fetching rewards catalog:', rewardsCatalogResult.error)
        // Don't throw here as rewards might not be set up yet
      }

      if (customerRewardsResult.error) {
        console.error('Error fetching customer rewards:', customerRewardsResult.error)
        // Don't throw here as there might be no rewards redeemed yet
      }

      console.log('CustomersPage - Data fetched successfully:', {
        business: !!businessResult.data,
        interactions: interactionsResult.data?.length || 0,
        customers: customersResult.data?.length || 0,
        customerPoints: customerPointsResult.data?.length || 0,
        rewardsCatalog: rewardsCatalogResult.data?.length || 0,
        customerRewards: customerRewardsResult.data?.length || 0
      })

      // Debug customer rewards data
      if (customerRewardsResult.data && customerRewardsResult.data.length > 0) {
        console.log('CustomersPage - Sample customer reward with joins:', customerRewardsResult.data[0])
        console.log('CustomersPage - All customer rewards:', customerRewardsResult.data)
      } else {
        console.log('CustomersPage - No customer rewards found or RLS policy issue')
      }

      setData({
        business: businessResult.data,
        interactions: interactionsResult.data || [],
        customers: customersResult.data || [],
        customerPoints: customerPointsResult.data || [],
        rewardsCatalog: rewardsCatalogResult.data || [],
        customerRewards: customerRewardsResult.data || []
      })

    } catch (err) {
      console.error('CustomersPage - Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load customer data')
    } finally {
      setIsLoading(false)
    }
  }, [user_id, business_id])

  useEffect(() => {
    loadRealData()
  }, [loadRealData])

  // Derived state and calculations
  const processedCustomers = useMemo(() => {
    const { business, interactions, customers, customerPoints, customerRewards } = data
    if (!business) return []

    // Create a map to store processed customer data
    const customerMap = new Map<string, any>()

    // CUSTOMER-POINTS-FIRST APPROACH: Start with customer_points records for this business
    const businessCustomerPoints = customerPoints.filter(cp => cp.business_id === business.id)
    
    businessCustomerPoints.forEach((customerPoint) => {
      const phoneNumber = customerPoint.phone_number
      const customerId = customerPoint.customer_id

      // Get customer name based on logic
      let customerName = 'Unknown'
      let actualPhoneNumber = phoneNumber

      if (customerId) {
        // App customer - get name from customers table
        const customer = customers.find(c => c.id === customerId)
        if (customer) {
          customerName = customer.full_name || customer.nickname || 'Unknown'
          actualPhoneNumber = customer.phone_number
        }
      } else {
        // Walk-in customer - get most recent name from interactions
        const phoneInteractions = interactions.filter(i => 
          i.phone_number === phoneNumber && i.business_id === business.id
        )
        if (phoneInteractions.length > 0) {
          const sortedInteractions = [...phoneInteractions].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          customerName = sortedInteractions[0].name || 'Unknown'
        }
      }

      // Calculate visits count from interactions that match business_id
      let relevantInteractions: CustomerInteraction[] = []
      if (customerId) {
        // App customer - match by customer_id + business_id
        relevantInteractions = interactions.filter(i => i.customer_id === customerId && i.business_id === business.id)
      } else {
        // Walk-in customer - match by phone_number + business_id
        relevantInteractions = interactions.filter(i => i.phone_number === phoneNumber && i.business_id === business.id)
      }
      
      const totalVisits = relevantInteractions.length

      // Calculate last visit date
      let lastVisitDate = 'Never'
      if (relevantInteractions.length > 0) {
        const sortedInteractions = [...relevantInteractions].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        const lastVisit = new Date(sortedInteractions[0].created_at)
        lastVisitDate = lastVisit.toLocaleDateString('en-GB')
      }

      // ✅ FIXED: Use customer_points data for total spend and points
      const totalSpend = customerPoint.total_amount_spent
      const currentPoints = customerPoint.points

      // Create unique ID for the processed customer
      const uniqueId = customerId || `phone_${phoneNumber.replace(/\+/g, '')}`

      customerMap.set(uniqueId, {
        id: uniqueId,
        name: customerName,
        phoneId: actualPhoneNumber,
        totalSpend: totalSpend.toLocaleString(),  // ✅ From customer_points
        totalVisits: totalVisits,                // From interactions count (business_id filtered)
        lastVisitDate: lastVisitDate,            // From interactions (business_id filtered)
        points: currentPoints,                   // ✅ From customer_points
        tag: '', // Leave blank as requested
        rpi: 0,  // Leave blank as requested
        lei: 0,  // Leave blank as requested
        spendingScore: 0,
        // Keep original customer data if available
        ...(customerId && customers.find(c => c.id === customerId) ? customers.find(c => c.id === customerId) : {})
      })
    })

    return Array.from(customerMap.values())
  }, [data])

  // Calculate metrics (using same logic as Reports page for consistency)
  const metrics = useMemo((): CustomerMetrics => {
    const { business, interactions, customers, customerPoints } = data
    if (!business) {
      return {
        totalCustomers: 0,
        newCustomersThisMonth: 0,
        avgSpendPerVisit: 0,
        visitFrequency: 0
      }
    }

    // Get business-specific customer points (same as Reports page)
    const businessCustomerPoints = customerPoints.filter(cp => cp.business_id === business.id)
    const totalCustomers = businessCustomerPoints.length

    // Calculate new customers this month (same as Reports page)
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const newCustomersThisMonth = businessCustomerPoints.filter(cp => {
      const createdDate = new Date(cp.created_at)
      return createdDate >= oneMonthAgo
    }).length

    // Calculate average spend per visit from business interactions (same as Reports page)
    const businessInteractions = interactions.filter(i => i.business_id === business.id)
    const totalSpend = businessInteractions.reduce((sum, interaction) => 
      sum + (Number(interaction.amount_spent) || 0), 0
    )
    const totalVisits = businessInteractions.length
    const avgSpendPerVisit = totalVisits > 0 ? totalSpend / totalVisits : 0

    // Calculate visit frequency (visits per customer per month) (same as Reports page)
    const visitFrequency = totalCustomers > 0 ? totalVisits / totalCustomers : 0

    return {
      totalCustomers,
      newCustomersThisMonth,
      avgSpendPerVisit,
      visitFrequency
    }
  }, [data])

  // Helper function for visit frequency calculation and display (same as Reports page)
  const getVisitFrequencyDisplay = (frequency: number) => {
    if (frequency >= 1) {
      // Show monthly frequency if >= 1 visit per month
      return {
        value: Math.round(frequency * 10) / 10, // Round to 1 decimal
        unit: 'per month',
        unitShort: '/mo'
      }
    } else {
      // Show yearly frequency if < 1 visit per month
      const yearlyFrequency = frequency * 12
      return {
        value: Math.round(yearlyFrequency * 10) / 10, // Round to 1 decimal
        unit: 'per year',
        unitShort: '/yr'
      }
    }
  }

  // Event handlers
  const handleSort = useCallback((field: string, direction: "asc" | "desc") => {
    setSortField(field)
    setSortDirection(direction)
  }, [loadRealData])

  const handleFilter = useCallback((filters: FilterOption[]) => {
    setActiveFilters(filters)
  }, [loadRealData])
  const handleRetry = useCallback(() => {
    loadRealData()
  }, [loadRealData])

  const handleActivitySuccess = useCallback(() => {
    // Refresh data in background without interfering with modal success state
    loadRealData()
  }, [loadRealData])

  const handleRecordActivity = useCallback(() => {
    setRecordActivityModalOpen(true)
  }, [loadRealData])

  const handleSendBulkMessage = useCallback(() => {
    setBulkMessageModalOpen(true)
  }, [loadRealData])

  const handleExport = useCallback(() => {
    // Export functionality
    console.log('Exporting customer data...')
  }, [loadRealData])

  // SECTION 2: Loading and Error States
  if (isLoading) {
    return <LoadingComponent message="Loading customers..." />
  }

  if (error) {
    return (
      <ErrorComponent 
        message={error || 'Unknown error occurred'}
        onRetry={handleRetry}
      />
    )
  }

  if (!processedCustomers.length) {
    return (
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Customers</h1>
          <Button onClick={handleRecordActivity} className="gap-2">
            <Plus className="h-4 w-4" />
            Record Activity
          </Button>
        </div>
        <EmptyStateComponent
          title="No customers yet"
          description="Start by recording customer interactions to build your customer base."
          actionLabel="Record Activity"
          onAction={handleRecordActivity}
          icon={<Users className="h-12 w-12 text-gray-400" />}
        />
      </div>
    )
  }

  // SECTION 3: Main Render
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>

      {/* Metrics Cards */}
      <TooltipProvider>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {/* Record Activity Card */}
        <Card 
          className="p-4 bg-[#F8843A] text-white flex items-center cursor-pointer hover:bg-[#E77A35] transition-colors" 
          onClick={handleRecordActivity}
        >
          <div className="bg-white bg-opacity-20 rounded-full p-3 mr-3">
            <Plus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Record</h3>
            <h3 className="text-lg font-medium">Customer</h3>
            <h3 className="text-lg font-medium">Activity</h3>
          </div>
        </Card>

        {/* Total Customers */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">Total Customers</div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{metrics.totalCustomers}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Total number of unique customers who have interacted with your business</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* New Customers */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">
            New Customers <span className="text-xs">/month</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{metrics.newCustomersThisMonth}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Number of new customers who joined your business in the last 30 days</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Average Spend */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">Avg Spend per Visit</div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">
              {Math.round(metrics.avgSpendPerVisit).toLocaleString()} <span className="text-sm">TZs</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Average amount customers spend each time they visit your business</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>

        {/* Visit Frequency */}
        <Card className="p-4">
          <div className="text-sm text-gray-500 mb-2">
            Visit Frequency <span className="text-xs">{getVisitFrequencyDisplay(metrics.visitFrequency).unitShort}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{getVisitFrequencyDisplay(metrics.visitFrequency).value}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Average number of visits per customer {getVisitFrequencyDisplay(metrics.visitFrequency).unit}. Shows monthly frequency if ≥1 visit/month, otherwise shows yearly frequency.</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </Card>
        </div>
      </TooltipProvider>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Customer List - Moved to top, full width */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Customer List</h2>
            <span className="text-sm text-gray-500">{processedCustomers.length} customers</span>
          </div>
          <Card className="p-6">
            <CustomersDetailTable
              customers={processedCustomers}
              sortField={sortField}
              sortDirection={sortDirection}
              filters={activeFilters}
              businessId={business_id}
              onSort={handleSort}
              onFilter={handleFilter}
              onSendBulkMessage={handleSendBulkMessage}
            />
          </Card>
        </div>
        
        {/* Recent Activity & Rewards - Side by side below Customer List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Recent Interactions</h2>
            </div>
            <Card className="p-6">
              <CustomerInteractionsTable
                interactions={data.interactions}
                customers={data.customers}
              />
            </Card>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium">Rewards Activity</h2>
            </div>
            <Card className="p-6">
              <RewardsTable
                rewardsCatalog={data.rewardsCatalog}
                customerRewards={data.customerRewards}
                customers={data.customers}
              />
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecordActivityModal
        open={recordActivityModalOpen}
        onOpenChange={setRecordActivityModalOpen}
        businessId={business_id || "1"}
        onSuccess={handleActivitySuccess}
      />

      <SendBulkMessageModal
        open={bulkMessageModalOpen}
        onOpenChange={setBulkMessageModalOpen}
        customers={processedCustomers}
        businessId={business_id || "1"}
      />
    </div>
  )
}
