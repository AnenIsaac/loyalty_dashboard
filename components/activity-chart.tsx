"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { useMemo, useEffect, useState } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { CustomerInteraction } from '@/types/common'

interface ActivityChartProps {
  timeFrame: "Month" | "Week" | "Day"
  businessId?: string
}

interface ChartData {
  name: string
  key: string
  value: number
}

export function ActivityChart({ timeFrame, businessId }: ActivityChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  // Generate time periods based on timeFrame
  const generateTimePeriods = useMemo(() => {
    const now = new Date()
    
    switch (timeFrame) {
      case "Month":
        // Last 12 months
        return Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
          return {
            name: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
            key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            value: 0
          }
        })
      
      case "Week":
        // Last 7 days
        return Array.from({ length: 7 }, (_, i) => {
          const date = new Date(now)
          date.setDate(date.getDate() - (6 - i))
          return {
            name: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            key: date.toISOString().split('T')[0],
            value: 0
          }
        })
      
      case "Day":
        // 24 hours (3-hour intervals)
        return Array.from({ length: 8 }, (_, i) => {
          const hour = i * 3
          return {
            name: `${String(hour).padStart(2, '0')}:00`,
            key: String(hour),
            value: 0
          }
        })
      
      default:
        return []
    }
  }, [timeFrame])

  // Fetch and process interaction data
  useEffect(() => {
    const fetchData = async () => {
      if (!businessId) {
        setData(generateTimePeriods)
        setLoading(false)
        return
      }

      setLoading(true)
      
      try {
        // Calculate date range based on timeFrame
        const now = new Date()
        let startDate: Date
        
        switch (timeFrame) {
          case "Month":
            startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
            break
          case "Week":
            startDate = new Date(now)
            startDate.setDate(startDate.getDate() - 6)
            break
          case "Day":
            startDate = new Date(now)
            startDate.setHours(0, 0, 0, 0)
            break
          default:
            startDate = new Date(now)
            startDate.setDate(startDate.getDate() - 30)
        }

        // Fetch interactions with amount_spent from the date range
        const { data: interactions, error } = await supabase
          .from('customer_business_interactions')
          .select('created_at, amount_spent')
          .eq('business_id', businessId)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })

        if (error) {
          console.error('Error fetching interactions:', error)
          setData(generateTimePeriods)
          return
        }

        // Initialize periods with zero revenue
        const periodRevenue = new Map(generateTimePeriods.map(p => [p.key, 0]))

        // Sum revenue by time period
        interactions?.forEach((interaction: CustomerInteraction) => {
          const date = new Date(interaction.created_at)
          const amountSpent = Number(interaction.amount_spent) || 0
          let key: string

          switch (timeFrame) {
            case "Month":
              key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              break
            case "Week":
              key = date.toISOString().split('T')[0]
              break
            case "Day":
              const hour = Math.floor(date.getHours() / 3) * 3
              key = String(hour)
              break
            default:
              key = date.toISOString().split('T')[0]
          }

          if (periodRevenue.has(key)) {
            periodRevenue.set(key, (periodRevenue.get(key) || 0) + amountSpent)
          }
        })

        // Update data with actual revenue
        const updatedData = generateTimePeriods.map(period => ({
          ...period,
          value: periodRevenue.get(period.key) || 0
        }))

        setData(updatedData)
      } catch (error) {
        console.error('Error processing chart data:', error)
        setData(generateTimePeriods)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeFrame, businessId, generateTimePeriods, supabase])

  const barSize = useMemo(() => {
    switch (timeFrame) {
      case "Month":
        return 40
      case "Week":
        return 50
      case "Day":
        return 30
      default:
        return 40
    }
  }, [timeFrame])

  // Format revenue values for display
  const formatRevenue = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`
    }
    return value.toString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="text-sm text-muted-foreground">Loading chart data...</div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} barSize={barSize}>
        <XAxis 
          dataKey="name" 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tick={{ textAnchor: 'middle' }}
          interval={0}
        />
        <YAxis 
          stroke="#888888" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          tickFormatter={formatRevenue}
          label={{ 
            value: 'Revenue (TZS)', 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fontSize: '12px', fill: '#888888' }
          }}
        />
        <Bar 
          dataKey="value" 
          fill="#F8843A" 
          radius={[4, 4, 0, 0]}
          className="hover:opacity-80 transition-opacity"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
