'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function Home() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [debugInfo, setDebugInfo] = useState('')
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      console.log('Home page - Starting auth check...')
      setDebugInfo('Starting authentication check...')
      
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication check timeout')), 3000)
        )
        
        const authCheckPromise = async () => {
          console.log('Home page - Getting session...')
          setDebugInfo('Getting user session...')
          
          // Check if user is authenticated
          const { data: { session }, error } = await supabase.auth.getSession()
          
          if (error) {
            console.error('Home page - Session error:', error)
            throw error
          }
          
          if (!session?.user) {
            console.log('Home page - No session, redirecting to login')
            setDebugInfo('No session found, redirecting to login...')
            router.replace('/auth/login')
            return
          }
          
          console.log('Home page - User authenticated:', session.user.id)
          setDebugInfo('User authenticated, checking business...')
          
          // User is authenticated, check if they have a business
          const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', session.user.id)
            .single()
          
          if (businessError && businessError.code !== 'PGRST116') {
            console.error('Home page - Business query error:', businessError)
            throw businessError
          }
          
          if (businessData) {
            console.log('Home page - Business found, redirecting to reports')
            setDebugInfo('Business found, redirecting to dashboard...')
            router.replace('/reports')
          } else {
            console.log('Home page - No business, redirecting to setup')
            setDebugInfo('No business found, redirecting to setup...')
            router.replace('/auth/business-setup')
          }
        }
        
        await Promise.race([authCheckPromise(), timeoutPromise])
        
      } catch (error) {
        console.error('Home page - Error checking auth status:', error)
        setDebugInfo('Authentication check failed, redirecting to login...')
        
        // On error or timeout, redirect to login after a brief delay
        setTimeout(() => {
          router.replace('/auth/login')
        }, 1000)
      } finally {
        setIsChecking(false)
      }
    }
    
    checkAuthAndRedirect()
  }, [router, supabase])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <p className="text-gray-600 text-sm">
          {isChecking ? 'Checking authentication...' : 'Redirecting...'}
        </p>
        {debugInfo && (
          <p className="text-gray-500 text-xs max-w-md text-center">
            {debugInfo}
          </p>
        )}
      </div>
    </div>
  )
}
