import { useState, useEffect, useCallback } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Business } from "@/types/common"

interface UseBusinessReturn {
  business: Business | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useBusiness(user_id: string): UseBusinessReturn {
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const fetchBusiness = useCallback(async () => {
    console.log('useBusiness - fetchBusiness called with user_id:', user_id)
    
    if (!user_id) {
      console.log('useBusiness - No user_id provided, stopping loading')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('useBusiness - Fetching business data for user:', user_id)

      const { data, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user_id)
        .single()

      if (businessError) {
        if (businessError.code === 'PGRST116') {
          // No business found
          console.log('useBusiness - No business found for user:', user_id)
          setBusiness(null)
          setError('No business profile found. Please create one first.')
        } else {
          console.error('useBusiness - Business fetch error:', businessError)
          throw businessError
        }
      } else {
        console.log('useBusiness - Business found:', data)
        setBusiness(data as Business)
      }
    } catch (err) {
      console.error('useBusiness - Error fetching business:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch business data')
    } finally {
      console.log('useBusiness - Finished fetching, setting isLoading to false')
      setIsLoading(false)
    }
  }, [user_id, supabase])

  useEffect(() => {
    fetchBusiness()
  }, [fetchBusiness])

  return { 
    business, 
    isLoading, 
    error, 
    refetch: fetchBusiness 
  }
} 