"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Info, Plus, ChevronRight, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { ActivityChart } from "@/components/activity-chart"
import { CustomersTable } from "@/components/customers-table"
import { RewardsTable } from "@/components/rewards-table"
import { CustomerInteractionsTable } from "./customer-interactions-table"
import { RecordActivityModal } from "@/components/record-activity-modal"
import type { 
  BasePageProps, 
  Customer, 
  CustomerInteraction, 
  CustomerPoint,
  CustomerReward, 
  CustomerMetrics,
  Business,
  Reward
} from "@/types/common"

interface ReportsPageProps extends BasePageProps {}

interface ReportsPageData {
  business: Business | null
  interactions: CustomerInteraction[]
  customers: Customer[]
  customerPoints: CustomerPoint[]
  rewardsCatalog: Reward[]
  customerRewards: CustomerReward[]
}

export function ReportsPage({ user_id, business_id }: ReportsPageProps) {
  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ReportsPageData>({
    business: null,
    interactions: [],
    customers: [],
    customerPoints: [],
    rewardsCatalog: [],
    customerRewards: []
  })
  const [chartView, setChartView] = useState<"Month" | "Week" | "Day">("Month")
  const [recordActivityModalOpen, setRecordActivityModalOpen] = useState(false)

  // Data fetching function
  const loadRealData = useCallback(async () => {
    if (!user_id || !business_id) {
      console.log('ReportsPage - Missing required IDs:', { user_id, business_id })
      setError('Missing required user or business information')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log('ReportsPage - Fetching data for:', { user_id, business_id })
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

        // Fetch customer rewards history
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
          .order('created_at', { ascending: false })      ])

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

      console.log('ReportsPage - Data fetched successfully:', {
        business: !!businessResult.data,
        interactions: interactionsResult.data?.length || 0,
        customers: customersResult.data?.length || 0,
        customerPoints: customerPointsResult.data?.length || 0,
        rewardsCatalog: rewardsCatalogResult.data?.length || 0,
        customerRewards: customerRewardsResult.data?.length || 0
      })

      // Debug customer rewards data
      if (customerRewardsResult.data && customerRewardsResult.data.length > 0) {
        console.log('ReportsPage - Sample customer reward with joins:', customerRewardsResult.data[0])
        console.log('ReportsPage - All customer rewards:', customerRewardsResult.data)
      } else {
        console.log('ReportsPage - No customer rewards found or RLS policy issue')
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
      console.error('ReportsPage - Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reports data')
    } finally {
      setIsLoading(false)
    }
  }, [user_id, business_id])

  useEffect(() => {
    loadRealData()
  }, [loadRealData])

  // Calculate metrics from real data
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

    // UNIFIED CUSTOMER COUNT: Include both app users and SMS-only customers
    const unifiedCustomersMap = new Map()

    // Add app customers
    customers.forEach(customer => {
      if (customer.phone_number) {
        const hasBusinessInteraction = interactions.some(i => 
          i.customer_id === customer.id && i.business_id === business.id
        )
        if (hasBusinessInteraction) {
          unifiedCustomersMap.set(customer.phone_number, customer)
        }
      }
    })

    // Add SMS-only customers
    interactions
      .filter(i => i.business_id === business.id && i.phone_number && !i.customer_id)
      .forEach(interaction => {
        if (!unifiedCustomersMap.has(interaction.phone_number)) {
          unifiedCustomersMap.set(interaction.phone_number, { 
            phone_number: interaction.phone_number,
            created_at: interaction.created_at,
            source: 'sms'
          })
        }
      })

    const totalCustomers = unifiedCustomersMap.size

    // Calculate new customers this month using unified approach
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    
    const newCustomersThisMonth = Array.from(unifiedCustomersMap.values()).filter(customer => {
      if (customer.source === 'sms') {
        // For SMS-only customers, use their first interaction date
        const createdDate = new Date(customer.created_at)
        return createdDate >= oneMonthAgo
      } else {
        // For app customers, use their registration date
        const createdDate = new Date(customer.created_at)
        return createdDate >= oneMonthAgo
      }
    }).length

    // Calculate average spend per visit from business interactions
    const businessInteractions = interactions.filter(i => i.business_id === business.id)
    const totalSpend = businessInteractions.reduce((sum, interaction) => 
      sum + (Number(interaction.amount_spent) || 0), 0
    )
    const totalVisits = businessInteractions.length
    const avgSpendPerVisit = totalVisits > 0 ? totalSpend / totalVisits : 0

    // Calculate visit frequency (visits per customer per month)
    const visitFrequency = totalCustomers > 0 ? totalVisits / totalCustomers : 0

    return {
      totalCustomers,
      newCustomersThisMonth,
      avgSpendPerVisit,
      visitFrequency
    }
  }, [data])

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

  const handleRetry = () => {
    loadRealData()
  }

  const handleRecordActivity = () => {
    setRecordActivityModalOpen(true)
  }

  // Loading and error states
  if (isLoading) {
    return <LoadingComponent message="Loading reports..." />
  }

  if (error) {
    return (
      <ErrorComponent 
        message={error || 'Unknown error occurred'}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Reports</h1>
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
            <div className="text-sm text-gray-500 mb-2">Total Customers <span className="text-xs">(App + SMS)</span></div>
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

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Activity</h2>
          <Select value={chartView} onValueChange={(value: "Month" | "Week" | "Day") => setChartView(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="View" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Month">Month</SelectItem>
              <SelectItem value="Week">Week</SelectItem>
              <SelectItem value="Day">Day</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Card className="p-4">
          <ActivityChart timeFrame={chartView} businessId={business_id} />
        </Card>
      </div>

      {/* Recent Activity & Rewards - Side by side below Activity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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

      <RecordActivityModal 
        open={recordActivityModalOpen} 
        onOpenChange={setRecordActivityModalOpen}
        businessId={business_id}
        onSuccess={handleRetry}
      />
    </div>
  )
}
