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
            ),
            reward_codes!reward_code_id (
              customer_id,
              customers!customer_id (
                id,
                full_name,
                nickname,
                phone_number
              )
            )
          `)
          .eq('business_id', business_id)
          .eq('status', 'redeemed')
          .order('claimed_at', { ascending: false })
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

      if (customerPointsResult.error) {
        console.error('Error fetching customer points:', customerPointsResult.error)
        // Don't throw here as customer_points might be empty
        console.log('No customer points found or error:', customerPointsResult.error.message)
      }

      if (rewardsCatalogResult.error) {
        console.error('Error fetching rewards catalog:', rewardsCatalogResult.error)
        // Don't throw here as rewards might not be set up yet
      }

      if (customerRewardsResult.error) {
        console.error('Error fetching customer rewards:', customerRewardsResult.error)
        // Don't throw here as there might be no rewards redeemed yet
      }

      // Now fetch only customers who have interacted with this business
      let customersResult = { data: [], error: null }
      if (interactionsResult.data && interactionsResult.data.length > 0) {
        // Get unique customer IDs from interactions
        const customerIds = [...new Set(
          interactionsResult.data
            .filter(i => i.customer_id) // Only app users have customer_id
            .map(i => i.customer_id)
        )]

        if (customerIds.length > 0) {
          console.log('Fetching customers with interactions:', customerIds)
          customersResult = await supabase
            .from('customers')
            .select('*')
            .in('id', customerIds)
            .order('created_at', { ascending: false })
        } else {
          console.log('No app customers found in interactions')
          customersResult = { data: [], error: null }
        }
      } else {
        console.log('No interactions found, no customers to fetch')
        customersResult = { data: [], error: null }
      }

      if (customersResult.error) {
        console.error('Error fetching customers:', customersResult.error)
        // Don't throw here as customers table might be empty
        console.log('No customers found or error:', customersResult.error.message)
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

  // Helper function to calculate secondary status based on last visit date
  const calculateSecondaryStatus = useCallback((lastVisitDate: string): 'Active' | 'At Risk' | 'Lapsed' | null => {
    if (lastVisitDate === 'Never') {
      return null // No special status for customers who never visited
    }

    const lastVisit = new Date(lastVisitDate.split("/").reverse().join("/"))
    const now = new Date()
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceLastVisit <= 30) {
      return 'Active'
    } else if (daysSinceLastVisit > 30 && daysSinceLastVisit <= 90) {
      return 'At Risk'
    } else if (daysSinceLastVisit > 90) {
      return 'Lapsed'
    }

    return null
  }, [])

  // Derived state and calculations - UNIFIED CUSTOMER APPROACH
  const processedCustomers = useMemo(() => {
    const { business, interactions, customers, customerPoints, customerRewards } = data
    if (!business) return []

    // Create a map to store unified customer data using phone number as key
    const unifiedCustomersMap = new Map<string, any>()

    // STEP 1: Process all interactions to build customer data
    // Group interactions by customer_id (for app users) and phone_number (for SMS users)
    const interactionsByCustomer = new Map<string, CustomerInteraction[]>()
    const interactionsByPhone = new Map<string, CustomerInteraction[]>()
    
    interactions
      .filter(i => i.business_id === business.id)
      .forEach(interaction => {
        // Group by customer_id for app users
        if (interaction.customer_id) {
          const existing = interactionsByCustomer.get(interaction.customer_id) || []
          existing.push(interaction)
          interactionsByCustomer.set(interaction.customer_id, existing)
        }
        
        // Group by phone_number for all interactions (including SMS-only)
        if (interaction.phone_number) {
          const existing = interactionsByPhone.get(interaction.phone_number) || []
          existing.push(interaction)
          interactionsByPhone.set(interaction.phone_number, existing)
        }
      })

    // STEP 2: Process app customers (from customers table)
    customers.forEach(customer => {
      const phoneNumber = customer.phone_number
      if (!phoneNumber) return

      // Get interactions for this customer
      const customerInteractions = interactionsByCustomer.get(customer.id) || []
      
      // Calculate metrics from interactions (primary source)
      const totalVisits = customerInteractions.length
      let lastVisitDate = 'Never'
      let totalSpend = 0
      let totalPoints = 0
      
      if (totalVisits > 0) {
        const sortedInteractions = [...customerInteractions].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
        lastVisitDate = new Date(sortedInteractions[0].created_at).toLocaleDateString('en-GB')
        totalSpend = customerInteractions.reduce((sum, i) => sum + (Number(i.amount_spent) || 0), 0)
        totalPoints = customerInteractions.reduce((sum, i) => sum + (i.points_awarded || 0), 0)
      }

      // Fallback to customer_points if no interactions exist
      if (totalVisits === 0) {
        const customerPoint = customerPoints.find(cp => 
          cp.customer_id === customer.id && cp.business_id === business.id
        )
        if (customerPoint) {
          totalSpend = customerPoint.total_amount_spent
          totalPoints = customerPoint.points
        }
      }

      // Calculate secondary status
      const secondaryStatus = calculateSecondaryStatus(lastVisitDate)

      // Calculate spending score (0-100) based on total spend and visit frequency
      const spendingScore = totalVisits > 0 ? Math.min(100, Math.round((totalSpend / totalVisits) / 1000)) : 0

      unifiedCustomersMap.set(phoneNumber, {
        id: customer.id,
        name: customer.full_name || customer.nickname || 'Unknown',
        phoneId: phoneNumber,
        totalSpend: totalSpend.toLocaleString(),
        totalVisits: totalVisits,
        lastVisitDate: lastVisitDate,
        points: totalPoints,
        tag: '',
        secondaryStatus: secondaryStatus,
        spendingScore: spendingScore,
        source: 'app',
        hasApp: true,
        ...customer
      })
    })

    // STEP 3: Process SMS-only customers (from interactions with phone_number but no customer_id)
    interactionsByPhone.forEach((phoneInteractions, phoneNumber) => {
      // Skip if this phone number already belongs to an app customer
      if (unifiedCustomersMap.has(phoneNumber)) return

      // Filter to only SMS-only interactions (no customer_id)
      const smsOnlyInteractions = phoneInteractions.filter(i => !i.customer_id)
      if (smsOnlyInteractions.length === 0) return

      // Get most recent name from interactions
      const sortedInteractions = [...smsOnlyInteractions].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      const customerName = sortedInteractions[0].name || 'Unknown'

      // Calculate metrics from interactions
      const totalVisits = smsOnlyInteractions.length
      const lastVisitDate = new Date(sortedInteractions[0].created_at).toLocaleDateString('en-GB')
      const totalSpend = smsOnlyInteractions.reduce((sum, i) => sum + (Number(i.amount_spent) || 0), 0)
      const totalPoints = smsOnlyInteractions.reduce((sum, i) => sum + (i.points_awarded || 0), 0)

      // Calculate secondary status
      const secondaryStatus = calculateSecondaryStatus(lastVisitDate)

      // Calculate spending score (0-100) based on total spend and visit frequency
      const spendingScore = totalVisits > 0 ? Math.min(100, Math.round((totalSpend / totalVisits) / 1000)) : 0

      // Create unique ID for SMS-only customer
      const uniqueId = `sms_${phoneNumber.replace(/\+/g, '')}`

      unifiedCustomersMap.set(phoneNumber, {
        id: uniqueId,
        name: customerName,
        phoneId: phoneNumber,
        totalSpend: totalSpend.toLocaleString(),
        totalVisits: totalVisits,
        lastVisitDate: lastVisitDate,
        points: totalPoints,
        tag: '',
        secondaryStatus: secondaryStatus,
        spendingScore: spendingScore,
        source: 'sms',
        hasApp: false,
        // Add interaction metadata
        firstInteraction: new Date(smsOnlyInteractions[smsOnlyInteractions.length - 1].created_at),
        lastInteraction: new Date(sortedInteractions[0].created_at)
      })
    })

    // STEP 4: Handle edge cases - customer_points records without interactions
    // This catches any customer_points records that weren't covered above
    customerPoints
      .filter(cp => cp.business_id === business.id)
      .forEach(customerPoint => {
        const phoneNumber = customerPoint.phone_number
        if (!phoneNumber || unifiedCustomersMap.has(phoneNumber)) return

        // Check if this customer_point has a customer_id (app user)
        const isAppUser = !!customerPoint.customer_id
        
        // If it's an app user, we should have already processed them above
        // If we're here, it means they have no interactions, so use customer_points data
        if (isAppUser) {
          const customer = customers.find(c => c.id === customerPoint.customer_id)
          if (customer) {
            // Calculate spending score (0 for customers with no visits)
            const spendingScore = 0

            unifiedCustomersMap.set(phoneNumber, {
              id: customer.id,
              name: customer.full_name || customer.nickname || 'Unknown',
              phoneId: phoneNumber,
              totalSpend: customerPoint.total_amount_spent.toLocaleString(),
              totalVisits: 0, // No interactions
              lastVisitDate: 'Never',
              points: customerPoint.points,
              tag: '',
              secondaryStatus: null, // Never visited
              spendingScore: spendingScore,
              source: 'app',
              hasApp: true,
              ...customer
            })
          }
        } else {
          // This is a customer_points record for a non-app user
          // Try to find any interactions for this phone number
          const phoneInteractions = interactionsByPhone.get(phoneNumber) || []
          const smsOnlyInteractions = phoneInteractions.filter(i => !i.customer_id)

          let customerName = 'Unknown'
          let lastVisitDate = 'Never'
          let totalVisits = 0
          let totalSpend = customerPoint.total_amount_spent
          let totalPoints = customerPoint.points

          if (smsOnlyInteractions.length > 0) {
            const sortedInteractions = [...smsOnlyInteractions].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )
            customerName = sortedInteractions[0].name || 'Unknown'
            lastVisitDate = new Date(sortedInteractions[0].created_at).toLocaleDateString('en-GB')
            totalVisits = smsOnlyInteractions.length
            // Use interactions data if available, otherwise use customer_points
            totalSpend = smsOnlyInteractions.reduce((sum, i) => sum + (Number(i.amount_spent) || 0), 0)
            totalPoints = smsOnlyInteractions.reduce((sum, i) => sum + (i.points_awarded || 0), 0)
          }

          const secondaryStatus = calculateSecondaryStatus(lastVisitDate)
          const uniqueId = `points_${phoneNumber.replace(/\+/g, '')}`

          // Calculate spending score (0-100) based on total spend and visit frequency
          const spendingScore = totalVisits > 0 ? Math.min(100, Math.round((totalSpend / totalVisits) / 1000)) : 0

          unifiedCustomersMap.set(phoneNumber, {
            id: uniqueId,
            name: customerName,
            phoneId: phoneNumber,
            totalSpend: totalSpend.toLocaleString(),
            totalVisits: totalVisits,
            lastVisitDate: lastVisitDate,
            points: totalPoints,
            tag: '',
            secondaryStatus: secondaryStatus,
            spendingScore: spendingScore,
            source: 'points',
            hasApp: false
          })
        }
      })

    return Array.from(unifiedCustomersMap.values())
  }, [data, calculateSecondaryStatus])

  // Calculate metrics (using unified customer approach)
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

    // Use unified customer count (includes both app users and SMS-only customers)
    console.log("🔄 Processing unified customers for business:", business.id)
    const totalCustomers = processedCustomers.length

    // Calculate new customers this month using unified approach
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    // For app customers, use customer creation date
    // For SMS-only customers, use first interaction date
    const newCustomersThisMonth = processedCustomers.filter(customer => {
      if (customer.source === 'app') {
        // For app customers, use their registration date
        const appCustomer = customers.find(c => c.id === customer.id)
        if (appCustomer) {
          const createdDate = new Date(appCustomer.created_at)
          return createdDate >= oneMonthAgo
        }
      } else if (customer.source === 'sms') {
        // For SMS-only customers, use first interaction date
        if (customer.firstInteraction) {
          return customer.firstInteraction >= oneMonthAgo
        }
      } else if (customer.source === 'points') {
        // For points-only customers, use customer_points creation date
        const customerPoint = customerPoints.find(cp => 
          cp.phone_number === customer.phoneId && cp.business_id === business.id
        )
        if (customerPoint) {
          const createdDate = new Date(customerPoint.created_at)
          return createdDate >= oneMonthAgo
        }
      }
      return false
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
        <p className="text-gray-600 mt-2">
          Unified view of all customers including app users and SMS-only customers
        </p>
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
          <div className="text-sm text-gray-500 mb-2">
              Total Customers <span className="text-xs">(App + SMS)</span>
            </div>
          <div className="flex items-center justify-between">
            <div className="text-3xl font-bold">{metrics.totalCustomers}</div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-48">
                <p>Total number of unique customers including both app users and SMS-only customers who have interacted with your business</p>
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
                <p>Number of new customers (app registrations + first SMS interactions) in the last 30 days</p>
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
