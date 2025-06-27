"use client"

import { useSession } from '@supabase/auth-helpers-react'
import { ReportsPage } from "@/components/reports-page"
import { LoadingComponent } from "@/components/ui/loading-component"

export default function Page() {
  const session = useSession()
  const user = session?.user
  const isLoading = !session && typeof window !== 'undefined'

  if (isLoading) {
    return <LoadingComponent message="Loading reports..." />
  }

  if (!user) {
    return <LoadingComponent message="Authenticating..." />
  }

  return <ReportsPage />
} 