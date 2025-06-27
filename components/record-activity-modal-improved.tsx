"use client"

import React, { useState, useEffect } from "react"
import { X, Check, Loader2, AlertCircle, Phone, User, DollarSign, Gift } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface RecordActivityModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  businessId?: string
  onSuccess?: () => void
}

interface FormData {
  phoneNumber: string
  name: string
  amountSpent: string
  awardPoints: boolean
  note: string
}

// Phone number validation and formatting
function formatTanzanianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  
  if (digits.startsWith('255')) {
    return `+${digits}`
  } else if (digits.startsWith('0')) {
    return `+255${digits.substring(1)}`
  } else if (digits.length === 9) {
    return `+255${digits}`
  }
  
  return phone
}

function validateTanzanianPhone(phone: string): boolean {
  const formatted = formatTanzanianPhone(phone)
  return /^\+255\d{9}$/.test(formatted)
}

export function RecordActivityModal({ open, onOpenChange, businessId, onSuccess }: RecordActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState(0)
  const [estimatedPoints, setEstimatedPoints] = useState(0)
  const [pointsConversionRate, setPointsConversionRate] = useState(1000)
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: "",
    name: "",
    amountSpent: "",
    awardPoints: false,
    note: "",
  })

  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({})
  const supabase = createClientComponentClient()

  // Load business points conversion rate when modal opens
  useEffect(() => {
    if (open && businessId) {
      const loadBusinessData = async () => {
        try {
          const { data: businessData, error } = await supabase
            .from('businesses')
            .select('points_conversion')
            .eq('id', businessId)
            .single()
          
          if (!error && businessData) {
            setPointsConversionRate(businessData.points_conversion || 1000)
          }
        } catch (err) {
          console.error('Error loading business data:', err)
        }
      }
      loadBusinessData()
    }
  }, [open, businessId, supabase])

  // Calculate estimated points when amount changes
  useEffect(() => {
    if (formData.amountSpent && formData.awardPoints) {
      const amount = parseFloat(formData.amountSpent)
      if (!isNaN(amount) && amount > 0) {
        const points = Math.round(amount / pointsConversionRate)
        setEstimatedPoints(points)
      } else {
        setEstimatedPoints(0)
      }
    } else {
      setEstimatedPoints(0)
    }
  }, [formData.amountSpent, formData.awardPoints, pointsConversionRate])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    if (name === 'phoneNumber') {
      const formatted = formatTanzanianPhone(value)
      setFormData((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    
    if (error) {
      setError(null)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, awardPoints: checked }))
  }

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {}
    
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required"
    } else if (!validateTanzanianPhone(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid Tanzanian phone number (+255...)"
    }
    
    if (!formData.name.trim()) {
      errors.name = "Customer name is required"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters"
    }
    
    if (!formData.amountSpent.trim()) {
      errors.amountSpent = "Amount spent is required"
    } else {
      const amount = parseFloat(formData.amountSpent)
      if (isNaN(amount) || amount <= 0) {
        errors.amountSpent = "Amount must be greater than 0"
      } else if (amount > 10000000) {
        errors.amountSpent = "Amount seems too large. Please verify."
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    if (!businessId) {
      setError("Business ID is required")
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const formattedPhone = formatTanzanianPhone(formData.phoneNumber)
      const amountSpentNum = parseFloat(formData.amountSpent)
      
      // Check for duplicates
      const { data: duplicateCheck, error: duplicateError } = await supabase
        .from('customer_business_interactions')
        .select('id')
        .eq('phone_number', formattedPhone)
        .eq('amount_spent', amountSpentNum)
        .eq('business_id', businessId)
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .limit(1)
      
      if (duplicateError) {
        throw new Error('Database error occurred. Please try again.')
      }
      
      if (duplicateCheck && duplicateCheck.length > 0) {
        setError('Duplicate transaction detected within the last 5 minutes.')
        return
      }
      
      // Look up existing customer
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, full_name')
        .eq('phone_number', formattedPhone)
        .limit(1)
      
      if (customerError) {
        throw new Error('Database error occurred. Please try again.')
      }
      
      const customer = customerData && customerData.length > 0 ? customerData[0] : null
      const customer_id = customer ? customer.id : null
      
      // Calculate points
      let points_awarded = 0
      if (formData.awardPoints) {
        points_awarded = Math.round(amountSpentNum / pointsConversionRate)
      }
      
      // Insert interaction record
      const interactionData = {
        interaction_type: 'dashboard_entry',
        amount_spent: amountSpentNum,
        points_awarded,
        customer_id,
        phone_number: formattedPhone,
        name: formData.name.trim(),
        optional_note: formData.note.trim() || null,
        business_id: businessId
      }
      
      const { error: interactionError } = await supabase
        .from('customer_business_interactions')
        .insert(interactionData)
      
      if (interactionError) {
        throw new Error('Failed to record activity. Please try again.')
      }
      
      // Update customer points if applicable
      if (customer_id && points_awarded > 0) {
        const { data: existingPoints } = await supabase
          .from('customer_points')
          .select('points, total_amount_spent')
          .eq('customer_id', customer_id)
          .eq('business_id', businessId)
          .limit(1)
        
        if (existingPoints && existingPoints.length > 0) {
          // Update existing
          await supabase
            .from('customer_points')
            .update({
              points: (existingPoints[0].points || 0) + points_awarded,
              total_amount_spent: (existingPoints[0].total_amount_spent || 0) + amountSpentNum,
              last_updated: new Date().toISOString()
            })
            .eq('customer_id', customer_id)
            .eq('business_id', businessId)
        } else {
          // Create new
          await supabase
            .from('customer_points')
            .insert({
              customer_id,
              business_id: businessId,
              points: points_awarded,
              total_amount_spent: amountSpentNum,
              phone_number: formattedPhone,
              last_updated: new Date().toISOString()
            })
        }
      }
      
      // Success!
      setPointsAwarded(points_awarded)
      setIsSuccess(true)
      
      if (onSuccess) {
        onSuccess()
      }
      
      // Reset and close
      setTimeout(() => {
        setIsSuccess(false)
        setPointsAwarded(0)
        onOpenChange(false)
        setFormData({
          phoneNumber: "",
          name: "",
          amountSpent: "",
          awardPoints: false,
          note: "",
        })
        setValidationErrors({})
        setEstimatedPoints(0)
      }, 2500)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      setError(null)
      setValidationErrors({})
      setEstimatedPoints(0)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex items-center gap-4 mb-4">
          <div className="bg-[#F8843A] rounded-md p-4 flex items-center justify-center">
            <div className="text-white text-3xl font-bold">+</div>
          </div>
          <div>
            <h2 className="text-xl font-bold">Add Customer Activity</h2>
            <p className="text-sm text-gray-500">Record a customer purchase</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md mb-4">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-orange-100 p-3 mb-4">
              <Check className="h-8 w-8 text-[#F8843A]" />
            </div>
            <p className="text-lg font-medium text-center">Activity recorded successfully!</p>
            {pointsAwarded > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                🎯 {pointsAwarded} points awarded
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Phone Number (+255...)"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  required
                  className={`pl-10 ${validationErrors.phoneNumber ? "border-red-500" : ""}`}
                />
              </div>
              {validationErrors.phoneNumber && (
                <p className="text-sm text-red-600">{validationErrors.phoneNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Customer Name" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className={`pl-10 ${validationErrors.name ? "border-red-500" : ""}`}
                />
              </div>
              {validationErrors.name && (
                <p className="text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Amount Spent (TZS)"
                  name="amountSpent"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amountSpent}
                  onChange={handleChange}
                  required
                  className={`pl-10 ${validationErrors.amountSpent ? "border-red-500" : ""}`}
                />
              </div>
              {validationErrors.amountSpent && (
                <p className="text-sm text-red-600">{validationErrors.amountSpent}</p>
              )}
            </div>

            <div className="flex items-center justify-between space-x-2 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="award-points" 
                  checked={formData.awardPoints} 
                  onCheckedChange={handleCheckboxChange} 
                />
                <Label htmlFor="award-points" className="text-sm font-medium">Award Points Now?</Label>
              </div>
              {formData.awardPoints && estimatedPoints > 0 && (
                <div className="flex items-center text-sm text-[#F8843A] font-medium">
                  <Gift className="h-4 w-4 mr-1" />
                  {estimatedPoints} pts
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Textarea 
                placeholder="Optional Note (e.g., items purchased, special occasion)" 
                name="note" 
                value={formData.note} 
                onChange={handleChange}
                rows={3}
                className="resize-none"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#F8843A] hover:bg-[#E77A35]" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording Activity...
                </>
              ) : (
                "Record Customer Activity"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
} 