"use client"

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { CustomersPage } from "@/components/customers-page"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { useState, useEffect } from 'react'

export default function Page() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const user = session?.user
  const [businessId, setBusinessId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchBusiness = async () => {
      try {
        const { data: business, error: businessError } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (businessError) {
          console.error('Error fetching business:', businessError)
          setError('Failed to load business data')
          return
        }

        setBusinessId(business.id)
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load business data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [user, supabase])

  if (isLoading) {
    return <LoadingComponent message="Loading customers..." />
  }

  if (!user) {
    return <ErrorComponent message="Authentication required" showRetry={false} />
  }

  if (error) {
    return <ErrorComponent message={error} showRetry={true} />
  }

  if (!businessId) {
    return <ErrorComponent message="No business found" showRetry={false} />
  }

  return <CustomersPage user_id={user.id} business_id={businessId} />
}
