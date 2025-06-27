"use client"

import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ReportsPage } from "@/components/reports-page"

export default function Reports() {
  const { user, isLoading: authLoading } = useAuth()
  const { business, isLoading: businessLoading } = useBusiness(user?.id || '')

  const isLoading = authLoading || businessLoading

  if (isLoading) {
    return <LoadingComponent message="Loading your dashboard..." />
  }

  // Since middleware handles auth and business checks, we can trust that if we reach here:
  // 1. User is authenticated (middleware redirects to login if not)
  // 2. Business exists (middleware redirects to business-setup if not)
  // So we just need to wait for the data to load

  return (
    <div className="p-8">
      <ReportsPage 
        user_id={user?.id || ''}
        business_id={business?.id || ''}
      />
    </div>
  )
} 