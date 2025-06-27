'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get all parameters from URL
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('Callback URL params:', {
          code: code ? 'present' : 'missing',
          error,
          errorDescription,
          fullUrl: window.location.href
        })

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || 'Authentication failed')
          return
        }

        if (!code) {
          console.error('No code parameter found in URL')
          setStatus('error')
          setMessage('Invalid verification link. Please check your email and try clicking the link again.')
          return
        }

        console.log('Processing auth callback with code')

        // Exchange the code for a session using the newer method
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('Code exchange error:', exchangeError)
          
          // More specific error messages
          if (exchangeError.message.includes('code verifier')) {
            setStatus('error')
            setMessage('Email verification link has expired or is invalid. Please request a new verification email.')
          } else {
            setStatus('error')
            setMessage(`Verification failed: ${exchangeError.message}`)
          }
          return
        }

        if (data?.user && data?.session) {
          console.log('Email verified successfully for user:', data.user.id)
          console.log('User email confirmed:', data.user.email_confirmed_at)
          
          setStatus('success')
          setMessage('Email verified successfully! Redirecting to login...')
          
          // Clear any existing auth state and redirect
          setTimeout(() => {
            router.push('/auth/login?verified=true')
          }, 2000)
        } else {
          console.error('No user or session returned from code exchange')
          setStatus('error')
          setMessage('Verification completed but no user session created. Please try logging in.')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setMessage(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    handleAuthCallback()
  }, [searchParams, supabase.auth, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100 text-center">
          <div className="mx-auto h-16 w-40 flex items-center justify-center mb-6">
            <img 
              src="https://raw.githubusercontent.com/gist/AnenIsaac/cfc37bbd70d6a69bfeb2ae704d6c9e9a/raw/541ac2a62da7ad93be352518ceb994f87a9a58cb/Zawadii_full_logo.svg" 
              alt="Zawadii Logo" 
              className="h-12 w-auto" 
            />
          </div>

          {status === 'loading' && (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#F8843A]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verifying your email...
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your email address.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Email Verified!
              </h2>
              <p className="text-gray-600">
                {message}
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => router.push('/auth/signup')}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#F8843A] hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F8843A] transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-[#F8843A]" />
            <span className="text-gray-600">Loading...</span>
          </div>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  )
} 