// utils/validation.ts
import type { SignInData, SignUpData } from '@/types/auth'

export interface ValidationResult {
  isValid: boolean
  errors: { [key: string]: string }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  // Remove all spaces and ensure it starts with +255 followed by 9 digits
  const cleanedPhone = phone.replace(/\s/g, '')
  const phoneRegex = /^\+255[0-9]{9}$/
  return phoneRegex.test(cleanedPhone)
}

export function validateWhatsApp(whatsapp: string): boolean {
  if (!whatsapp.trim()) return true // Optional field
  
  const trimmed = whatsapp.trim()
  
  // If it starts with @, treat as username (alphanumeric, underscores, dots allowed)
  if (trimmed.startsWith('@')) {
    const usernameRegex = /^@[a-zA-Z0-9._]{3,30}$/
    return usernameRegex.test(trimmed)
  }
  
  // Otherwise, validate as phone number (international format)
  const cleanedPhone = trimmed.replace(/\s/g, '')
  // Support various international formats, but prefer +255 for Tanzania
  const phoneRegex = /^\+[1-9]\d{1,14}$/
  return phoneRegex.test(cleanedPhone)
}

export function validatePassword(password: string): {
  isValid: boolean
  strength: 'weak' | 'medium' | 'strong'
  errors: string[]
} {
  const errors: string[] = []
  let strength: 'weak' | 'medium' | 'strong' = 'weak'

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  const score = 5 - errors.length
  if (score >= 4) strength = 'strong'
  else if (score >= 2) strength = 'medium'

  return {
    isValid: errors.length === 0,
    strength,
    errors
  }
}

export function validateSignUpForm(data: SignUpData & { confirmPassword: string }): ValidationResult {
  const errors: { [key: string]: string } = {}

  // Email validation
  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  // Phone validation
  if (!data.phone.trim()) {
    errors.phone = 'Phone number is required'
  } else if (!validatePhone(data.phone)) {
    errors.phone = 'Please enter a valid Tanzanian phone number starting with +255'
  }

  // WhatsApp validation
  if (!data.whatsapp.trim()) {
    errors.whatsapp = 'WhatsApp is required'
  } else if (!validateWhatsApp(data.whatsapp)) {
    errors.whatsapp = 'Please enter a valid WhatsApp number or username'
  }

  // Password validation
  const passwordValidation = validatePassword(data.password)
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors[0]
  }

  // Confirm password validation
  if (!data.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password'
  } else if (data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export function validateSignInForm(data: SignInData): ValidationResult {
  const errors: { [key: string]: string } = {}

  if (!data.email.trim()) {
    errors.email = 'Email is required'
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }

  if (!data.password) {
    errors.password = 'Password is required'
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
} 