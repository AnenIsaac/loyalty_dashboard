// app/auth/forgot-password/page.tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { resetPassword } from '@/lib/auth'
import { validateEmail } from '@/utils/validation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(error.message)
        return
      }

      setIsSuccess(true)
    } catch (error) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-[#F8843A] rounded-xl flex items-center justify-center mb-4">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Check your email
            </h2>
            <p className="text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  If an account with this email exists, you'll receive a password reset link shortly.
                </p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Didn't receive the email? Check your spam folder or</p>
                <button
                  onClick={() => {
                    setIsSuccess(false)
                    setEmail('')
                  }}
                  className="text-[#F8843A] hover:text-orange-500 font-medium"
                >
                  try again
                </button>
              </div>

              <div className="pt-4">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to sign in
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-[#F8843A] rounded-xl flex items-center justify-center mb-4">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Forgot your password?
          </h2>
          <p className="text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
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
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent transition-colors ${
                    error ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter your email address"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#F8843A] hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F8843A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </button>

            {/* Back to Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}