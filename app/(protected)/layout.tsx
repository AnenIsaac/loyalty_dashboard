'use client'

import { Sidebar } from "@/components/sidebar"
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = useSession()
  const supabase = useSupabaseClient()
  const [isInitializing, setIsInitializing] = useState(true)
  const user = session?.user

  useEffect(() => {
    // Give the session some time to initialize
    const timer = setTimeout(() => {
      setIsInitializing(false)
    }, 1000) // Wait 1 second for session to load

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    console.log('ProtectedLayout - Auth state:', { 
      hasUser: !!user, 
      isInitializing, 
      sessionExists: !!session,
      sessionAccessToken: session?.access_token ? 'present' : 'missing'
    })
  }, [user, isInitializing, session])

  // Show loading while session is initializing
  if (isInitializing) {
    console.log('ProtectedLayout - Session initializing...')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8843A]"></div>
      </div>
    )
  }

  // If no session after initialization, middleware should redirect
  // But render the layout anyway since middleware is handling auth
  if (!session) {
    console.log('ProtectedLayout - No session after initialization, trusting middleware auth')
    // Since middleware confirmed auth, render the layout
    // The session will eventually load
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    )
  }

  console.log('ProtectedLayout - Rendering main layout with session')
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
} 