'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Card } from "@/components/ui/card"
import { BusinessInformation } from "@/components/business-profile/business-information"
import { Loader2 } from 'lucide-react'

export default function BusinessSetupPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [checkingSession, setCheckingSession] = useState(true)
  const [userId, setUserId] = useState<string>('')

  useEffect(() => {
    const checkBusinessSetup = async () => {
      try {
        setCheckingSession(true)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          router.push('/auth/login')
          return
        }

        if (!session?.user) {
          router.push('/auth/login?redirectTo=/auth/business-setup')
          return
        }
        
        // Set the user ID from the session
        setUserId(session.user.id)
        
        // Note: We don't check for existing business here anymore
        // The middleware handles routing users with businesses away from this page
        // This page is specifically for users who need to create a business profile
        
      } catch (err) {
        console.error('Error in checkBusinessSetup:', err)
      } finally {
        setCheckingSession(false)
      }
    }

    checkBusinessSetup()
  }, [router, supabase])

  // Show loading state while checking session
  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#F8843A]" />
          <p className="text-gray-600">Checking your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-40 flex items-center justify-center mb-4">
            <Image 
              src="https://raw.githubusercontent.com/gist/AnenIsaac/cfc37bbd70d6a69bfeb2ae704d6c9e9a/raw/541ac2a62da7ad93be352518ceb994f87a9a58cb/Zawadii_full_logo.svg"
              alt="Zawadii Logo"
              width={160}
              height={48}
              priority
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Business Profile
          </h2>
          <p className="text-gray-600">
            Please provide your business details to continue
          </p>
        </div>

        <Card className="p-6">
          <BusinessInformation
            userId={userId}
            onUpdate={() => {
              // After successful update, redirect to reports
              router.push('/reports')
            }}
          />
        </Card>
      </div>
    </div>
  )
}