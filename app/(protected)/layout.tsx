'use client'

import { Sidebar } from "@/components/sidebar"
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, error } = useAuth()

  useEffect(() => {
    console.log('ProtectedLayout - Auth state:', { 
      hasUser: !!user, 
      isLoading, 
      error: error?.substring(0, 50) 
    })
  }, [user, isLoading, error])

  if (isLoading) {
    console.log('ProtectedLayout - Showing loading spinner')
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F8843A]"></div>
      </div>
    )
  }

  if (error) {
    console.log('ProtectedLayout - Auth error:', error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Authentication Error</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
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