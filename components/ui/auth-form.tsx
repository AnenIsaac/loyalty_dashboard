"use client"

import type React from "react"
import { supabase } from "@/lib/supabaseClient"
import { useSession } from '@supabase/auth-helpers-react'

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImageCarousel } from "@/components/image-carousel"
import { ZawadiiLogo } from "@/components/zawadii-logo"
import { Eye, EyeOff, CheckCircle2, XCircle, Mail, ArrowLeft } from "lucide-react"

export default function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)
  const [showOtpVerification, setShowOtpVerification] = useState(false)
  const [otpCode, setOtpCode] = useState("")
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const session = useSession()

  // Only redirect if there's a verified session AND not in OTP flow
  // Remove automatic redirect to prevent rate limiting
  const shouldRedirect = session && !showOtpVerification && signUpSuccess
  
  useEffect(() => {
    if (shouldRedirect) {
      console.log('Redirecting to reports due to existing session')
      router.replace('/reports')
    }
  }, [shouldRedirect, router])

  const hasMinLength = password.length >= 8
  const hasLettersAndNumbers = /^(?=.*[A-Za-z])(?=.*\d).+$/.test(password)
  const passwordsMatch = password === confirmPassword
  const isPasswordValid = hasMinLength && hasLettersAndNumbers

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    if (isSignUp) {
      if (!isPasswordValid || !passwordsMatch) {
        setIsLoading(false)
        return
      }
  
      console.log('Starting signup process for:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
  
      console.log('Signup response:', { data, error })
  
      if (error) {
        console.error('Signup error:', error)
        setError(error.message)
        setIsLoading(false)
        return
      }
  
      console.log('Signup successful, showing OTP verification')
      // Show OTP verification step instead of success message
      setShowOtpVerification(true)
      setIsLoading(false)
      return
    }
  
    // LOGIN
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
  
    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }
  
    setIsLoading(false)
    router.replace("/reports")
  }

  const handleOtpVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsVerifyingOtp(true)

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a valid 6-digit verification code")
      setIsVerifyingOtp(false)
      return
    }

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'signup'
    })

    if (error) {
      setError(error.message)
      setIsVerifyingOtp(false)
      return
    }

    // Verification successful
    setIsVerifyingOtp(false)
    setSignUpSuccess(true)
    setTimeout(() => {
      setSignUpSuccess(false)
      setShowOtpVerification(false)
      setIsSignUp(false)
      setOtpCode("")
      router.replace("/reports")
    }, 1500)
  }

  const handleResendOtp = async () => {
    setError(null)
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    })

    if (error) {
      setError(error.message)
    } else {
      // Show success message briefly
      setError("Verification code resent to your email!")
      setTimeout(() => setError(null), 3000)
    }
  }

  const goBackToSignup = () => {
    setShowOtpVerification(false)
    setOtpCode("")
    setError(null)
  }

  // Show OTP verification step
  if (showOtpVerification && !signUpSuccess) {
    console.log('Rendering OTP verification page', { showOtpVerification, signUpSuccess })
    return (
      <>
        <div className="hidden md:block md:w-1/2 bg-white">
          <ImageCarousel />
        </div>
        <div className="w-full md:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <ZawadiiLogo />
              </div>
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail className="w-8 h-8 text-blue-600" />
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
              <p className="mt-2 text-gray-600">
                We've sent a verification code to
              </p>
              <p className="font-semibold text-gray-900">{email}</p>
            </div>

            <form onSubmit={handleOtpVerification} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="otp-code">Verification Code</Label>
                <Input
                  id="otp-code"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtpCode(value)
                  }}
                  className="text-center text-lg font-mono tracking-widest"
                  maxLength={6}
                  required
                />
                <p className="text-sm text-gray-500 text-center">
                  Enter the 6-digit code from your email
                </p>
              </div>

              {error && (
                <div className={`text-sm text-center ${error.includes('resent') ? 'text-green-600' : 'text-red-600'}`}>
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#FD8424] hover:bg-[#e67920] text-white"
                disabled={isVerifyingOtp || otpCode.length !== 6}
              >
                {isVerifyingOtp ? "Verifying..." : "Verify Email"}
              </Button>

              <div className="text-center space-y-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-sm text-[#FD8424] hover:underline"
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
      </>
    )
  }

  console.log('Rendering main auth form', { showOtpVerification, signUpSuccess, isSignUp, session })

  return (
    <>
      <div className="hidden md:block md:w-1/2 bg-white">
        <ImageCarousel />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <ZawadiiLogo />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{isSignUp ? "Create your account" : "Welcome back"}</h2>
            <p className="mt-2 text-gray-600">
              {isSignUp ? "Sign up to get started with Zawadii" : "Sign in to continue with Zawadii"}
            </p>
          </div>

          {signUpSuccess ? (
            <div className="text-green-600 text-center font-semibold py-8">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </div>
              Email verified successfully! Redirecting...
            </div>
          ) : (
            <Tabs defaultValue="signin" onValueChange={(value) => setIsSignUp(value === "signup")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="data-[state=active]:bg-[#FD8424] data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-[#FD8424] data-[state=active]:text-white">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <TabsContent value="signin" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link href="/forgot-password" className="text-sm text-[#FD8424] hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="mt-2 space-y-1 text-sm">
                      {password && (
                        <>
                          <div className="flex items-center gap-2">
                            {hasMinLength ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={hasMinLength ? "text-green-700" : "text-red-700"}>
                              At least 8 characters
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasLettersAndNumbers ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            <span className={hasLettersAndNumbers ? "text-green-700" : "text-red-700"}>
                              Contains letters and numbers
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm Password</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {isSignUp && confirmPassword && (
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        {passwordsMatch ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={passwordsMatch ? "text-green-700" : "text-red-700"}>Passwords match</span>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {error && (
                  <div className="text-red-600 text-sm text-center">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#FD8424] hover:bg-[#e67920] text-white"
                  disabled={isLoading || (isSignUp && (!isPasswordValid || !passwordsMatch))}
                >
                  {isLoading ? (isSignUp ? "Creating Account..." : "Signing In...") : (isSignUp ? "Sign Up" : "Sign In")}
                </Button>
              </form>
            </Tabs>
          )}
        </div>
      </div>
    </>
  )
}
