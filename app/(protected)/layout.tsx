'use client'

import { Sidebar } from "@/components/sidebar"
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect } from 'react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const user = session?.user
  const isLoading = !session && typeof window !== 'undefined' // Simple loading check

  useEffect(() => {
    console.log('ProtectedLayout - Auth state:', { 
      hasUser: !!user, 
      isLoading, 
      sessionExists: !!session
    })
  }, [user, isLoading, session])

  if (isLoading) {
    console.log('ProtectedLayout - Showing loading spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8843A]"></div>
      </div>
    )
  }

  if (!session) {
    console.log('ProtectedLayout - No session, middleware should handle redirect')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8843A]"></div>
      </div>
    )
  }

  if (!user) {
    console.log('ProtectedLayout - No user, showing loading (redirect should happen)')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8843A]"></div>
      </div>
    )
  }

  console.log('ProtectedLayout - Rendering main layout with sidebar')
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 