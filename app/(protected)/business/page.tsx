"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from "@/hooks/useAuth"
import { useBusiness } from "@/hooks/useBusiness"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { BusinessProfilePage } from "@/components/business-profile-page"

export default function Page() {
  const router = useRouter()
  const { user, isLoading: authLoading, error: authError } = useAuth()
  const { business, isLoading: businessLoading, error: businessError } = useBusiness(user?.id || '')

  const isLoading = authLoading || businessLoading
  const error = authError || businessError

  if (isLoading) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <LoadingComponent message="Loading business profile..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <ErrorComponent 
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <ErrorComponent 
          message="Authentication required. Please log in to access your business profile."
          showRetry={false}
        />
      </div>
    )
  }

  // Don't render the component if business data is not available
  if (!business?.id) {
    return (
      <div className="p-6 max-w-[1200px] mx-auto">
        <ErrorComponent 
          message="Business profile not found. Please set up your business information first."
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  return (
    <BusinessProfilePage 
      user_id={user.id}
      business_id={business.id}
    />
  )
} 