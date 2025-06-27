"use client"

import { RewardsPage } from "@/components/rewards-page"
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react"
import { useEffect, useState } from "react"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import type { Business } from "@/types/common"

export default function Page() {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [business, setBusiness] = useState<Business | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!session?.user?.id) {
        setError("No authenticated user")
        setIsLoading(false)
        return
      }

      try {
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', session.user.id)
          .single()

        if (businessError && businessError.code !== 'PGRST116') {
          throw businessError
        }

        setBusiness(businessData)
      } catch (err) {
        console.error('Error fetching business:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch business data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusiness()
  }, [session?.user?.id, supabase])

  if (isLoading) {
    return <LoadingComponent />
  }

  if (error) {
    return <ErrorComponent message={error} />
  }

  if (!session?.user) {
    return <ErrorComponent message="Please log in to view rewards" />
  }

  return <RewardsPage user_id={session.user.id} business_id={business?.id} />
} 