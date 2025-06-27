"use client"

import React, { useState, useEffect } from "react"
import { X, Check, Loader2, AlertCircle, Phone, User, Gift } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Handle different input formats
  if (cleaned.startsWith('255')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+255${cleaned.slice(1)}`
  } else if (cleaned.length >= 9 && !cleaned.startsWith('255')) {
    return `+255${cleaned}`
  }
  
  return `+${cleaned}`
}

function validateTanzanianPhone(phone: string): boolean {
  const phoneRegex = /^\+255[67]\d{8}$/
  return phoneRegex.test(phone)
}

export function RecordActivityModal({ open, onOpenChange, businessId, onSuccess }: RecordActivityModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState(0)
  const [estimatedPoints, setEstimatedPoints] = useState(0)
  const [pointsConversionRate, setPointsConversionRate] = useState(1)
  const [moneyPointsRatio, setMoneyPointsRatio] = useState(100)
  const [businessName, setBusinessName] = useState('')
  const [smsSent, setSmsSent] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    phoneNumber: "",
    name: "",
    amountSpent: "",
    awardPoints: true,
    note: "",
  })

  const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({})
  const supabase = createClientComponentClient()

  // Load business points conversion rate and money points ratio when modal opens
  useEffect(() => {
    if (open && businessId) {
      const loadBusinessData = async () => {
        try {
          // Fetch business points conversion rate and name
          const { data: businessData, error: businessError } = await supabase
            .from('businesses')
            .select('points_conversion, name')
            .eq('id', businessId)
            .single()
          
          if (businessError) {
            console.error('Error loading business data:', businessError)
          } else if (businessData) {
            setPointsConversionRate(businessData.points_conversion || 1)
            setBusinessName(businessData.name || 'Your Business')
          }

          // Fetch money points ratio from zawadii_settings
          const { data: settingsData, error: settingsError } = await supabase
            .from('zawadii_settings')
            .select('money_points_ratio')
            .single()
          
          if (settingsError) {
            console.error('Error loading zawadii settings:', settingsError)
          } else if (settingsData) {
            setMoneyPointsRatio(settingsData.money_points_ratio || 100)
          }
        } catch (err) {
          console.error('Error loading data:', err)
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
        // Correct calculation: amount * conversion% / 100 = cashback TZS, then / money_points_ratio = points
        const cashbackValue = (amount * pointsConversionRate) / 100 // TZS cashback
        const points = Math.round(cashbackValue / moneyPointsRatio) // Convert TZS to points
        setEstimatedPoints(Math.max(points, 0)) // Can be 0 if very small amount
      } else {
        setEstimatedPoints(0)
      }
    } else {
      setEstimatedPoints(0)
    }
  }, [formData.amountSpent, formData.awardPoints, pointsConversionRate, moneyPointsRatio])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    // Format phone number as user types
    if (name === 'phoneNumber') {
      const formatted = formatTanzanianPhone(value)
      setFormData((prev) => ({ ...prev, [name]: formatted }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    
    // Clear validation error when user starts typing
    if (validationErrors[name as keyof FormData]) {
      setValidationErrors((prev) => ({ ...prev, [name]: undefined }))
    }
    
    // Clear general error
    if (error) {
      setError(null)
    }
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, awardPoints: checked }))
  }

  // Send SMS to customer
  const sendCustomerSMS = async (customerName: string, phone: string, points: number) => {
    try {
      console.log('📱 [RecordActivity] Sending SMS to customer:', { customerName, phone, points })
      
      // Create appropriate message based on whether points were awarded
      let message: string
      if (points > 0) {
        message = `Hi ${customerName}! Thanks for visiting! You have just earned ${points} Zawadii points! Redeem them now for exclusive rewards through the Zawadii app - zawadii.app.`
      } else {
        message = `Hi ${customerName}! Thanks for visiting! We appreciate your business and look forward to serving you again.`
      }
      
      // Add business name to the message (same approach as SendMessageModal)
      if (businessName && !message.includes(businessName)) {
        message = `${message} - ${businessName}`
      }
      
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [{
            phone: phone.replace(/^\+/, ''), // Remove + for Beem API
            id: customerName.replace(/\s+/g, '_').toLowerCase()
          }],
          message: message
        })
      })
      
      const result = await response.json()
      
      if (response.ok) {
        console.log('✅ [RecordActivity] SMS sent successfully:', result)
        setSmsSent(true)
      } else {
        console.error('❌ [RecordActivity] SMS failed:', result)
        // Don't throw error - SMS failure shouldn't prevent activity recording
      }
    } catch (error) {
      console.error('💥 [RecordActivity] SMS error:', error)
      // Don't throw error - SMS failure shouldn't prevent activity recording
    }
  }

  const validateForm = (): boolean => {
    const errors: Partial<FormData> = {}
    
    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = "Phone number is required"
    } else if (!validateTanzanianPhone(formData.phoneNumber)) {
      errors.phoneNumber = "Please enter a valid Tanzanian phone number (+255...)"
    }
    
    // Name validation
    if (!formData.name.trim()) {
      errors.name = "Customer name is required"
    } else if (formData.name.trim().length < 2) {
      errors.name = "Name must be at least 2 characters"
    }
    
    // Amount validation
    if (!formData.amountSpent.trim()) {
      errors.amountSpent = "Amount spent is required"
    } else {
      const amount = parseFloat(formData.amountSpent)
      if (isNaN(amount) || amount <= 0) {
        errors.amountSpent = "Amount must be greater than 0"
      } else if (amount > 10000000) { // 10 million TZS limit
        errors.amountSpent = "Amount seems too large. Please verify."
      }
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 [RecordActivity] Form submission started')
    
    if (!validateForm()) {
      console.log('❌ [RecordActivity] Form validation failed')
      return
    }
    
    if (!businessId) {
      console.log('❌ [RecordActivity] No business ID provided')
      setError("Business ID is required")
      return
    }
    
    setIsSubmitting(true)
    setError(null)

    try {
      const formattedPhone = formatTanzanianPhone(formData.phoneNumber)
      const amountSpentNum = parseFloat(formData.amountSpent)
      
      console.log('📞 [RecordActivity] Processing:', { phone: formattedPhone, amount: amountSpentNum, businessId })
      
      // Look up existing customer (optional - will be null if not found)
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, full_name')
        .eq('phone_number', formattedPhone)
        .limit(1)
      
      if (customerError) {
        console.error('❌ [RecordActivity] Customer lookup error:', customerError)
        throw new Error('Database error occurred. Please try again.')
      }
      
      const customer = customerData && customerData.length > 0 ? customerData[0] : null
      const customer_id = customer ? customer.id : null
      
      console.log('👤 [RecordActivity] Customer found:', customer ? 'Yes' : 'No', customer_id ? `(ID: ${customer_id})` : '(Walk-in customer)')
      
      // Calculate points if award_points is true
      let points_awarded = 0
      if (formData.awardPoints) {
        // Correct calculation: amount * conversion% / 100 = cashback TZS, then / money_points_ratio = points
        const cashbackValue = (amountSpentNum * pointsConversionRate) / 100 // TZS cashback
        points_awarded = Math.round(cashbackValue / moneyPointsRatio) // Convert TZS to points
        console.log('🎯 [RecordActivity] Points calculation:', { amountSpent: amountSpentNum, conversionRate: pointsConversionRate, moneyPointsRatio, pointsValue: cashbackValue, pointsAwarded: points_awarded })
      }
      
      // Insert interaction record (ALWAYS recorded for both existing and walk-in customers)
      const interactionData = {
        interaction_type: 'dashboard_entry',
        amount_spent: amountSpentNum,
        points_awarded,
        customer_id, // Will be customer ID if found, null if walk-in customer
        phone_number: formattedPhone,
        name: formData.name.trim(),
        optional_note: formData.note.trim() || null,
        business_id: businessId
      }
      
      const { data: insertedInteraction, error: interactionError } = await supabase
        .from('customer_business_interactions')
        .insert(interactionData)
        .select('id')
      
      if (interactionError) {
        console.error('❌ [RecordActivity] Interaction insert error:', interactionError)
        throw new Error('Failed to record activity. Please check your connection and try again.')
      }
      
      console.log('✅ [RecordActivity] Interaction recorded successfully')
      
      // Update points for this specific customer-business relationship
      if (points_awarded > 0) {
        console.log('🎯 [RecordActivity] Updating points for customer-business relationship:', { phone: formattedPhone, businessId })
        
        // Look for existing customer-business relationship in points table
        const { data: existingPoints, error: pointsLookupError } = await supabase
          .from('customer_points')
          .select('points, total_amount_spent')
          .eq('phone_number', formattedPhone)
          .eq('business_id', businessId)
          .limit(1)
        
        if (pointsLookupError) {
          console.error('❌ [RecordActivity] Points lookup error:', pointsLookupError)
          console.log('⚠️ [RecordActivity] Continuing without updating points - interaction is recorded')
        } else {
          if (existingPoints && existingPoints.length > 0) {
            // Update existing customer-business relationship
            const currentPoints = existingPoints[0].points || 0
            const currentSpent = existingPoints[0].total_amount_spent || 0
            
            console.log('📊 [RecordActivity] Updating existing relationship:', { currentPoints, currentSpent, adding: points_awarded })
            
            const { error: pointsUpdateError } = await supabase
              .from('customer_points')
              .update({
                points: currentPoints + points_awarded,
                total_amount_spent: currentSpent + amountSpentNum,
                last_updated: new Date().toISOString()
              })
              .eq('phone_number', formattedPhone)
              .eq('business_id', businessId)
            
            if (pointsUpdateError) {
              console.error('❌ [RecordActivity] Points update error:', pointsUpdateError)
              console.log('⚠️ [RecordActivity] Continuing - interaction is recorded, points update failed')
            } else {
              console.log('✅ [RecordActivity] Points updated successfully for customer-business relationship')
            }
          } else {
            // Create new customer-business relationship
            console.log('🆕 [RecordActivity] Creating new customer-business relationship')
            
            const { error: pointsInsertError } = await supabase
              .from('customer_points')
              .insert({
                customer_id, // Will be customer ID if app user, null if walk-in customer
                business_id: businessId,
                points: points_awarded,
                total_amount_spent: amountSpentNum,
                phone_number: formattedPhone,
                last_updated: new Date().toISOString()
              })
            
            if (pointsInsertError) {
              console.error('❌ [RecordActivity] Points insert error:', pointsInsertError)
              console.log('⚠️ [RecordActivity] Continuing - interaction is recorded, points creation failed')
            } else {
              console.log('✅ [RecordActivity] New customer-business relationship created successfully')
            }
          }
        }
      } else {
        console.log('ℹ️ [RecordActivity] No points to award - skipping points update')
      }
      
      // Success!
      console.log('🎉 [RecordActivity] All operations completed successfully')
      
      // Send SMS to customer for all recorded activities
      await sendCustomerSMS(formData.name.trim(), formattedPhone, points_awarded)
      
      setPointsAwarded(points_awarded)
      setIsSuccess(true)
      
      // Show success for 1.5 seconds, then close and refresh data
      setTimeout(() => {
        setIsSuccess(false)
        setPointsAwarded(0)
        setSmsSent(false)
        onOpenChange(false)
        
        // Reset form data
        setFormData({
          phoneNumber: "",
          name: "",
          amountSpent: "",
          awardPoints: true,
          note: "",
        })
        setValidationErrors({})
        setEstimatedPoints(0)
        
        // Call onSuccess callback after modal is closed to refresh data
        if (onSuccess) {
          onSuccess()
        }
      }, 1500)
      
    } catch (err) {
      console.error('💥 [RecordActivity] Submit error:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.')
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
          <DialogTitle className="sr-only">Add Customer Activity</DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
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
            {smsSent && (
              <p className="text-sm text-green-600 mt-2">
                📱 SMS notification sent!
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
              <Input
                placeholder="Amount Spent"
                name="amountSpent"
                type="number"
                min="0"
                step="0.01"
                value={formData.amountSpent}
                onChange={handleChange}
                required
                className={`${validationErrors.amountSpent ? "border-red-500" : ""} [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]`}
              />
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

