// app/auth/login/page.tsx
'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react'
import { signIn } from '@/lib/auth'
import { validateSignInForm } from '@/utils/validation'
import type { SignInData, AuthError } from '@/types/auth'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const [formData, setFormData] = useState<SignInData>({
    email: '',
    password: ''
  })
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [authError, setAuthError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false)

  // Check for verification success on component mount
  useEffect(() => {
    const verified = searchParams.get('verified')
    if (verified === 'true') {
      setShowVerificationSuccess(true)
      // Hide the message after 5 seconds
      setTimeout(() => setShowVerificationSuccess(false), 5000)
    }
  }, [searchParams])

  const handleInputChange = (field: keyof SignInData, value: string) => {
    if (isLoading) return // Prevent input changes while loading
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Clear auth error when user makes changes
    if (authError) {
      setAuthError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLoading) return // Prevent multiple submissions
    
    // Validate form
    const validation = validateSignInForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsLoading(true)
    setErrors({})
    setAuthError('')

    try {
      console.log('Login - Attempting sign in...')
      const { data, error, hasBusiness } = await signIn(formData)
      
      console.log('Login - Sign in result:', { 
        userId: data?.user?.id,
        hasBusiness,
        error: error?.message
      })
      
      if (error) {
        console.error('Login - Error during sign in:', error)
        setAuthError(error.message)
        return
      }

      if (!data?.user) {
        console.error('Login - No user data received')
        setAuthError('Failed to create session. Please try again.')
        return
      }

      // Check if user needs to verify email
      if (data.user.identities && data.user.identities.length === 0) {
        setAuthError('Please check your email to verify your account before signing in.')
        return
      }

      // Check if user has a business
      const { data: businessData } = await supabase
        .from('businesses')
        .select('id')
        .eq('user_id', data.user.id)
        .single()

      console.log('Login - Business check:', { 
        userId: data.user.id,
        hasBusiness: !!businessData
      })

      // Force a hard redirect to prevent any client-side routing issues
      if (businessData) {
        console.log('Login - Has business, redirecting to reports')
        window.location.href = '/reports'
      } else {
        console.log('Login - No business, redirecting to setup')
        window.location.href = '/auth/business-setup'
      }
    } catch (error) {
      console.error('Login - Unexpected error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-40 flex items-center justify-center mb-4">
            <img src="https://raw.githubusercontent.com/gist/AnenIsaac/cfc37bbd70d6a69bfeb2ae704d6c9e9a/raw/541ac2a62da7ad93be352518ceb994f87a9a58cb/Zawadii_full_logo.svg" alt="Zawadii Logo" className="h-12 w-auto" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h2>
          <p className="text-gray-600">
            Sign in to your loyalty dashboard
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Verification Success Message */}
            {showVerificationSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-green-800">
                    Email verified successfully! You can now sign in to your account.
                  </p>
                </div>
              </div>
            )}

            {/* Global Error */}
            {authError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-red-800">{authError}</p>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 pl-10 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent sm:text-sm ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className={`appearance-none relative block w-full px-3 py-3 pl-10 pr-10 border rounded-lg placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent sm:text-sm ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#F8843A] focus:ring-[#F8843A] border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link 
                  href="/auth/forgot-password" 
                  className="font-medium text-[#F8843A] hover:text-orange-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#F8843A] hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F8843A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{' '}
                <Link 
                  href="/auth/signup" 
                  className="font-medium text-[#F8843A] hover:text-orange-500"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
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
      <LoginPageContent />
    </Suspense>
  )
}