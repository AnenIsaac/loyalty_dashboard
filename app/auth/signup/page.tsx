// app/auth/signup/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  Building2, 
  Phone, 
  AlertCircle, 
  Loader2, 
  Check,
  X,
  ArrowLeft
} from 'lucide-react'
import { signUp, verifyOtp, resendOtp } from '@/lib/auth'
import { validateSignUpForm, validatePassword } from '@/utils/validation'
import type { SignUpData, AuthError } from '@/types/auth'

interface SignUpFormData extends Omit<SignUpData, 'businessName'> {
  confirmPassword: string
}

export default function SignUpPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [authError, setAuthError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)

  const passwordValidation = validatePassword(formData.password)

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
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
    
    // Check terms agreement
    if (!agreedToTerms) {
      setErrors({ terms: 'Please agree to the Terms and Conditions' })
      return
    }

    // Validate form
    const validation = validateSignUpForm(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setIsLoading(true)
    setErrors({})
    setAuthError('')

    try {
      const { email, password, phone } = formData
      const { data, error } = await signUp({ email, password, phone })
      
      if (error) {
        setAuthError(error.message)
        return
      }

      if (data?.user) {
        // Show OTP verification instead of success
        setShowOtpVerification(true)
      }
    } catch (error) {
      console.error('Signup error:', error)
      setAuthError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    setIsVerifyingOtp(true)

    if (!otpCode || otpCode.length !== 6) {
      setAuthError('Please enter a valid 6-digit verification code')
      setIsVerifyingOtp(false)
      return
    }

    try {
      const { data, error } = await verifyOtp(formData.email, otpCode)
      
      if (error) {
        setAuthError(error.message)
        setIsVerifyingOtp(false)
        return
      }

      // Verification successful
      setIsVerifyingOtp(false)
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/reports')
      }, 1500)
    } catch (error) {
      console.error('OTP verification error:', error)
      setAuthError('Verification failed. Please try again.')
      setIsVerifyingOtp(false)
    }
  }

  const handleResendOtp = async () => {
    setAuthError('')
    try {
      const { error } = await resendOtp(formData.email)
      
      if (error) {
        setAuthError(error.message)
      } else {
        setAuthError('Verification code resent to your email!')
        setTimeout(() => setAuthError(''), 3000)
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      setAuthError('Failed to resend code. Please try again.')
    }
  }

  const goBackToSignup = () => {
    setShowOtpVerification(false)
    setOtpCode('')
    setAuthError('')
  }

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      default: return 'bg-red-500'
    }
  }

  const getPasswordStrengthText = (strength: string) => {
    switch (strength) {
      case 'strong': return 'Strong password'
      case 'medium': return 'Medium strength'
      default: return 'Weak password'
    }
  }

  // Show final success message after OTP verification
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <div className="mx-auto h-16 w-40 flex items-center justify-center mb-4">
              <img 
                src="https://raw.githubusercontent.com/gist/AnenIsaac/cfc37bbd70d6a69bfeb2ae704d6c9e9a/raw/541ac2a62da7ad93be352518ceb994f87a9a58cb/Zawadii_full_logo.svg" 
                alt="Zawadii Logo" 
                className="h-12 w-auto" 
              />
            </div>
            <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Email Verified Successfully!
            </h2>
            <p className="text-gray-600 mb-4">
              Welcome to Zawadii! Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Show OTP verification form
  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-40 flex items-center justify-center mb-4">
              <img 
                src="https://raw.githubusercontent.com/gist/AnenIsaac/cfc37bbd70d6a69bfeb2ae704d6c9e9a/raw/541ac2a62da7ad93be352518ceb994f87a9a58cb/Zawadii_full_logo.svg" 
                alt="Zawadii Logo" 
                className="h-12 w-auto" 
              />
            </div>
            <div className="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Check your email
            </h2>
            <p className="text-gray-600 mb-1">
              We've sent a verification code to
            </p>
            <p className="font-semibold text-gray-900">{formData.email}</p>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            <form onSubmit={handleOtpVerification} className="space-y-6">
              <div>
                <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input
                  id="otp-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpCode(value)
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-[#F8843A] focus:border-transparent"
                  maxLength={6}
                  required
                />
                <p className="mt-2 text-sm text-gray-500 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {authError && (
                <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${authError.includes('resent') ? 'bg-green-50 border-green-200' : ''}`}>
                  <p className={`text-sm ${authError.includes('resent') ? 'text-green-800' : 'text-red-800'}`}>
                    {authError}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-[#F8843A] hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#F8843A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isVerifyingOtp ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify Email'
                )}
              </button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-[#F8843A] hover:underline"
                >
                  Didn't receive the code? Resend
                </button>
                <br />
                <button
                  type="button"
                  onClick={goBackToSignup}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to signup
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-40 flex items-center justify-center mb-4">
            <img 
              src="https://raw.githubusercontent.com/gist/AnenIsaac/cfc37bbd70d6a69bfeb2ae704d6c9e9a/raw/541ac2a62da7ad93be352518ceb994f87a9a58cb/Zawadii_full_logo.svg" 
              alt="Zawadii Logo" 
              className="h-12 w-auto" 
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create your account
          </h2>
          <p className="text-gray-600">
            Start managing your loyalty program today
          </p>
        </div>

        {/* Form */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Phone Field */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`block w-full pl-10 pr-3 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent transition-colors ${
                    errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+255763860354"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
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
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordValidation.strength)}`}
                        style={{ 
                          width: passwordValidation.strength === 'strong' ? '100%' : 
                                 passwordValidation.strength === 'medium' ? '66%' : '33%' 
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordValidation.strength === 'strong' ? 'text-green-600' :
                      passwordValidation.strength === 'medium' ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getPasswordStrengthText(passwordValidation.strength)}
                    </span>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="space-y-1">
                    {[
                      { test: formData.password.length >= 8, text: 'At least 8 characters' },
                      { test: /[A-Z]/.test(formData.password), text: 'One uppercase letter' },
                      { test: /[a-z]/.test(formData.password), text: 'One lowercase letter' },
                      { test: /\d/.test(formData.password), text: 'One number' },
                      { test: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password), text: 'One special character' }
                    ].map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        {req.test ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <X className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={`text-xs ${req.test ? 'text-green-600' : 'text-gray-500'}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`block w-full pl-10 pr-10 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F8843A] focus:border-transparent transition-colors ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms and Conditions */}
            <div>
              <div className="flex items-start">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => {
                    setAgreedToTerms(e.target.checked)
                    if (errors.terms) {
                      setErrors(prev => ({ ...prev, terms: '' }))
                    }
                  }}
                  className="h-4 w-4 text-[#F8843A] focus:ring-[#F8843A] border-gray-300 rounded mt-1"
                />
                <div className="ml-3">
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#F8843A] hover:text-orange-500 font-medium">
                      Terms and Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-[#F8843A] hover:text-orange-500 font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                  {errors.terms && (
                    <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
                  )}
                </div>
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
                  Creating your account...
                </>
              ) : (
                'Create account'
              )}
            </button>

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link 
                  href="/auth/login" 
                  className="font-medium text-[#F8843A] hover:text-orange-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>


      </div>
    </div>
  )
}