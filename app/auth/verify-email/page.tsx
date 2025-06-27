'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Mail, Check, RefreshCw } from 'lucide-react'

export default function VerifyEmailPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [isVerified, setIsVerified] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkVerificationStatus = async () => {
      try {
        // Refresh the session to get the latest user data
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          throw sessionError
        }
        
        if (!session?.user) {
          router.replace('/auth/login')
          return
        }

        const userEmail = session.user.email
        if (!userEmail) {
          throw new Error('User email not found')
        }

        setEmail(userEmail)
        
        if (session.user.email_confirmed_at) {
          setIsVerified(true)
          
          // Check if user has a business
          const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('id')
            .eq('user_id', session.user.id)
            .limit(1)

          if (businessError) {
            console.error('Error checking business:', businessError)
            // Don't throw here, just log and continue
          }

          const hasBusiness = businesses && businesses.length > 0

          // Wait a moment to show the success state before redirecting
          setTimeout(() => {
            router.replace(hasBusiness ? '/reports' : '/auth/business-setup')
          }, 2000)
        } else {
          setIsVerified(false)
        }
      } catch (err) {
        console.error('Error checking verification status:', err)
        setError(err instanceof Error ? err.message : 'Failed to check verification status')
      } finally {
        setIsLoading(false)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkVerificationStatus()
      }
    })

    const interval = setInterval(checkVerificationStatus, 5000) // Check every 5 seconds
    checkVerificationStatus() // Initial check

    return () => {
      clearInterval(interval)
      subscription.unsubscribe()
    }
  }, [router])

  const handleResendEmail = async () => {
    if (!email) {
      setError('No email address found')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) throw error

      // Better user feedback
      setError(null)
      // You might want to show a success message instead of alert
      alert('Verification email sent! Please check your inbox.')
    } catch (err) {
      console.error('Error resending verification email:', err)
      setError(
        err instanceof Error ? 
        err.message : 
        'Failed to resend verification email'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          {/* Logo */}
          <div className="mx-auto h-16 w-40 flex items-center justify-center mb-4">
            <Image
              src="/Zawadii_full_logo.svg"
              alt="Zawadii Logo"
              width={180}
              height={48}
              priority
              className="h-12 w-auto"
            />
          </div>

          {/* Status Icon */}
          <div className="mx-auto h-16 w-16 flex items-center justify-center mb-4">
            {isLoading ? (
              <div className="rounded-full bg-blue-50 p-4">
                <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              </div>
            ) : isVerified ? (
              <div className="rounded-full bg-green-50 p-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            ) : (
              <div className="rounded-full bg-orange-50 p-4">
                <Mail className="h-8 w-8 text-[#F8843A]" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isLoading ? 'Checking verification status...' :
             isVerified ? 'Email verified!' :
             'Verify your email'}
          </h2>

          {/* Message */}
          <p className="text-gray-600 mb-8">
            {isLoading ? 'Please wait while we check your verification status.' :
             isVerified ? 'Redirecting you to complete your profile...' :
             `We've sent a verification email to ${email}. Please check your inbox and click the verification link.`}
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-600">
              {error}
            </div>
          )}

          {/* Actions */}
          {!isLoading && !isVerified && (
            <div className="space-y-4">
              <button
                onClick={handleResendEmail}
                disabled={isLoading}
                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-[#F8843A] bg-orange-50 rounded-lg hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F8843A] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Resend verification email
              </button>

              <p className="text-sm text-gray-500">
                Wrong email?{' '}
                <Link href="/auth/signup" className="text-[#F8843A] hover:text-orange-500">
                  Sign up with a different email
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}