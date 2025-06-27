import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { Business } from "@/types/common"

interface UseBusinessReturn {
  business: Business | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBusiness(userId: string): UseBusinessReturn {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) {
      setIsLoading(false)
      return
    }

    const fetchBusiness = async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            // No business found
            setBusiness(null)
            setError('No business profile found. Please create one first.')
          } else {
            console.error('Error fetching business:', error)
            throw error
          }
        } else {
          setBusiness(data)
        }
      } catch (err) {
        console.error('Error fetching business:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch business')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [userId])

  return { 
    business, 
    isLoading, 
    error, 
    refetch: () => {
      // Implementation of refetch function
    }
  }
} 