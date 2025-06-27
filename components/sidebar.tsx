"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { BarChart, Users, Gift, Briefcase, HelpCircle, Settings, LifeBuoy, LogOut, Building2 } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from 'react'
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { signOut } from '@/lib/auth'

interface BusinessData {
  name: string
  logo_url: string | null
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const { user } = useAuth()
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch business data only when we have a user
  useEffect(() => {
    if (!user) {
      setIsLoading(false)
      return
    }

    const fetchBusinessData = async () => {
      try {
        // Fetch business information using the user from useAuth
        const { data: business, error } = await supabase
          .from('businesses')
          .select('name, logo_url')
          .eq('user_id', user.id)
          .single()

        if (error) {
          console.error('Error fetching business data:', error)
          return
        }

        if (business) {
          setBusinessData({
            name: business.name || 'Your Business',
            logo_url: business.logo_url
          })
        }
      } catch (error) {
        console.error('Error in fetchBusinessData:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBusinessData()
  }, [user, supabase]) // Only run when user changes

  const handleSignOut = async () => {
    try {
      console.log('Sidebar - Starting logout process...')
      const { error } = await signOut()
      console.log('Sidebar - SignOut completed:', { error })
      
      if (error) throw new Error(error.message)
      
      console.log('Sidebar - No error, redirecting to login...')
      // Force a hard redirect to ensure complete logout
      window.location.href = '/auth/login'
    } catch (error) {
      console.error('Sidebar - Error signing out:', error)
      console.log('Sidebar - Error occurred, still redirecting to login...')
      // Even if there's an error, try to redirect to login
      window.location.href = '/auth/login'
    }
  }

  return (
    <div className="w-60 h-full border-r bg-white flex flex-col">
      <div className="flex h-16 items-center justify-center mb-4">
        <Image
          src="/Zawadii_full_logo.svg"
          alt="Zawadii"
          width={120}
          height={32}
          className="dark:invert"
        />
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <Link
          href="/reports"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/reports" ? "bg-orange-100 text-orange-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <BarChart className="h-4 w-4" />
          Reports
        </Link>

        <Link
          href="/customers"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/customers" ? "bg-orange-100 text-orange-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Users className="h-4 w-4" />
          Customers
        </Link>

        <Link 
          href="/rewards"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/rewards"
              ? "bg-orange-100 text-orange-600"
              : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Gift className="h-4 w-4" />
          <span className="whitespace-nowrap">Rewards & Promotions</span>
        </Link>

        <Link 
          href="/business"
          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
            pathname === "/business" ? "bg-orange-100 text-orange-600" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Business Profile
        </Link>
        
        <div className="pt-3 mt-3 border-t border-gray-100">
          <h2 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Support</h2>
          
          <div className="mt-2 space-y-1">
            <Link 
              href="#" 
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <HelpCircle className="h-4 w-4" />
              Getting Started
            </Link>

            <Link 
              href="#" 
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>

            <Link 
              href="#" 
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            >
              <LifeBuoy className="h-4 w-4" />
              Support
            </Link>
          </div>
        </div>
      </nav>

      <div className="px-4 py-4 border-t mt-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative">
            {isLoading ? (
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
            ) : businessData?.logo_url ? (
            <Image
                src={businessData.logo_url}
                alt="Business Logo"
              width={40}
              height={40}
              className="rounded-full object-cover"
                onError={(e) => {
                  // Fallback to default icon if logo fails to load
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  target.nextElementSibling?.classList.remove('hidden')
                }}
              />
            ) : null}
            {(!businessData?.logo_url || isLoading) && (
              <div className={`w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center ${businessData?.logo_url ? 'hidden' : ''}`}>
                <Building2 className="h-5 w-5 text-orange-600" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {isLoading ? (
                <span className="inline-block w-20 h-4 bg-gray-200 rounded animate-pulse" />
              ) : (
                businessData?.name || 'Your Business'
              )}
            </p>
            <p className="text-xs text-gray-500">Business Owner</p>
          </div>
        </div>
        <button 
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </div>
  )
}
