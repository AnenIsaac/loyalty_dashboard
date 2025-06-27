"use client"

import { useSession } from '@supabase/auth-helpers-react'
import { CustomersPage } from "@/components/customers-page"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"

export default function Page() {
  const session = useSession()
  const user = session?.user
  const isLoading = !session && typeof window !== 'undefined'

  if (isLoading) {
    return <LoadingComponent message="Loading customers..." />
  }

  if (!user) {
    return (
      <ErrorComponent 
        message="Authentication required. Please log in to access customers."
        showRetry={false}
      />
    )
  }

  return <CustomersPage />
}
