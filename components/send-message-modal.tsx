"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Check, Loader2, PenLine, AlertCircle, MessageCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface CustomerData {
  name: string
  phoneId: string
  points: string
  totalSpend: string
  id?: string // Customer ID if they exist in customers table
  customer_id?: string // Alternative field name
}

interface SendMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customer: CustomerData | null
  businessId?: string
}

interface RewardOption {
  id: string
  title: string
  rewardCodeId: string
  rewardCode: string
  rewardId: string
}

export function SendMessageModal({ open, onOpenChange, customer, businessId }: SendMessageModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    message: "",
    attachReward: false,
    selectedReward: "",
  })
  
  // New state for enhanced functionality
  const [moneyPointsRatio, setMoneyPointsRatio] = useState<number>(1)
  const [lastVisitDate, setLastVisitDate] = useState<string>('Never')
  const [availableRewards, setAvailableRewards] = useState<RewardOption[]>([])
  const [isCustomerEligible, setIsCustomerEligible] = useState(false)
  const [selectedRewardDetails, setSelectedRewardDetails] = useState<RewardOption | null>(null)
  const [isLoadingRewards, setIsLoadingRewards] = useState(false)
  const [actualCustomerId, setActualCustomerId] = useState<string | null>(null)
  const [businessName, setBusinessName] = useState<string>('')

  const supabase = createClientComponentClient()

  // Load initial data when modal opens
  useEffect(() => {
    if (open && customer && businessId) {
      loadInitialData()
    }
  }, [open, customer, businessId])

  const loadInitialData = async () => {
    if (!customer || !businessId) return

    try {
      // Load business name
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single()

      if (businessData && !businessError) {
        setBusinessName(businessData.name)
      }

      // Check if customer is eligible by looking up phone number in customers table
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, phone_number')
        .eq('phone_number', customer.phoneId)
        .limit(1)
        .single()

      const isEligible = !!customerData && !customerError
      setIsCustomerEligible(isEligible)
      setActualCustomerId(customerData?.id || null)

      // Load money_points_ratio from zawadii_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('zawadii_settings')
        .select('money_points_ratio')
        .limit(1)
        .single()

      if (settingsData && !settingsError) {
        setMoneyPointsRatio(settingsData.money_points_ratio || 1)
      }

      // Load last visit date using the same logic as customers page
      let relevantInteractions = []
      if (customerData) {
        // App customer - match by customer_id + business_id
        const { data: appInteractions, error: appError } = await supabase
          .from('customer_business_interactions')
          .select('created_at')
          .eq('customer_id', customerData.id)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })

        if (appInteractions && !appError) {
          relevantInteractions = appInteractions
        }
      } else {
        // Walk-in customer - match by phone_number + business_id
        const { data: walkinInteractions, error: walkinError } = await supabase
          .from('customer_business_interactions')
          .select('created_at')
          .eq('phone_number', customer.phoneId)
          .eq('business_id', businessId)
          .order('created_at', { ascending: false })

        if (walkinInteractions && !walkinError) {
          relevantInteractions = walkinInteractions
        }
      }

      if (relevantInteractions.length > 0) {
        const lastVisit = new Date(relevantInteractions[0].created_at)
        setLastVisitDate(lastVisit.toLocaleDateString('en-GB'))
      }

      // Load available rewards if customer is eligible
      if (isEligible) {
        await loadAvailableRewards()
      }

    } catch (err) {
      console.error('Error loading initial data:', err)
    }
  }

  const loadAvailableRewards = async () => {
    if (!businessId) return

    setIsLoadingRewards(true)
    try {
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('reward_codes')
        .select(`
          id,
          code,
          reward_id,
          rewards (
            id,
            title
          )
        `)
        .eq('business_id', businessId)
        .eq('status', 'unused')
        .order('code')

      if (rewardsData && !rewardsError) {
        // Group by reward title to show unique rewards
        const rewardMap = new Map<string, RewardOption>()
        
        rewardsData.forEach((item: any) => {
          const rewardTitle = item.rewards?.title || 'Unknown Reward'
          if (!rewardMap.has(rewardTitle)) {
            rewardMap.set(rewardTitle, {
              id: `${item.reward_id}_${item.id}`,
              title: rewardTitle,
              rewardCodeId: item.id,
              rewardCode: item.code,
              rewardId: item.reward_id
            })
          }
        })

        setAvailableRewards(Array.from(rewardMap.values()))
      }
    } catch (err) {
      console.error('Error loading rewards:', err)
    } finally {
      setIsLoadingRewards(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleCheckboxChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, attachReward: checked, selectedReward: checked ? prev.selectedReward : "" }))
    if (!checked) {
      setSelectedRewardDetails(null)
    }
  }

  const handleRewardChange = (value: string) => {
    setFormData((prev) => ({ ...prev, selectedReward: value }))
    const reward = availableRewards.find(r => r.id === value)
    setSelectedRewardDetails(reward || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customer || !formData.message.trim()) return

    setIsSubmitting(true)
    setError(null)

    let pendingRewardCodeId: string | null = null
    let pendingCustomerRewardId: string | null = null

    try {
      // Step 1: If reward is attached, prepare it but mark as 'pending'
      let rewardInfo = null
      if (formData.attachReward && selectedRewardDetails && isCustomerEligible && actualCustomerId) {
        // Update reward_codes table to 'pending' status
        const { error: updateError } = await supabase
          .from('reward_codes')
          .update({ 
            status: 'pending',
            customer_id: actualCustomerId,
            bought_at: new Date().toISOString()
          })
          .eq('id', selectedRewardDetails.rewardCodeId)

        if (updateError) {
          throw new Error(`Failed to prepare reward: ${updateError.message}`)
        }

        // Insert into customer_rewards table with 'pending' status
        const { data: customerRewardData, error: insertError } = await supabase
          .from('customer_rewards')
          .insert({
            customer_id: actualCustomerId,
            reward_id: selectedRewardDetails.rewardId,
            business_id: businessId,
            status: 'pending',
            reward_code_id: selectedRewardDetails.rewardCodeId,
            claimed_at: new Date().toISOString()
          })
          .select('id')
          .single()

        if (insertError) {
          // Rollback reward_codes update
          await supabase
            .from('reward_codes')
            .update({ 
              status: 'unused',
              customer_id: null,
              bought_at: null
            })
            .eq('id', selectedRewardDetails.rewardCodeId)

          throw new Error(`Failed to prepare customer reward: ${insertError.message}`)
        }

        pendingRewardCodeId = selectedRewardDetails.rewardCodeId
        pendingCustomerRewardId = customerRewardData.id

        rewardInfo = {
          title: selectedRewardDetails.title,
          code: selectedRewardDetails.rewardCode
        }
      }

      // Step 2: Format the message with business name and reward info
      let finalMessage = formData.message.trim()
      
      // Add business name to the end of the message
      if (businessName && !finalMessage.includes(businessName)) {
        finalMessage = `${finalMessage} - ${businessName}`
      }

      // Add reward info to message if attached
      if (rewardInfo) {
        finalMessage += `\n\nAttached reward: ${rewardInfo.title}, reward code: ${rewardInfo.code}`
      }

      // Step 3: Send SMS via our simplified API
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients: [{
            phone: customer.phoneId,
            id: customer.name.replace(/\s+/g, '_').toLowerCase()
          }],
          message: finalMessage
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send SMS')
      }

      // Step 4: If SMS was successful and reward was attached, finalize the reward
      if (pendingRewardCodeId && pendingCustomerRewardId) {
        // Update reward_codes to 'bought' status
        const { error: finalizeRewardError } = await supabase
          .from('reward_codes')
          .update({ status: 'bought' })
          .eq('id', pendingRewardCodeId)

        if (finalizeRewardError) {
          console.error('Failed to finalize reward code:', finalizeRewardError)
          // Don't throw error here as SMS was successful
        }

        // Update customer_rewards to 'bought' status
        const { error: finalizeCustomerRewardError } = await supabase
          .from('customer_rewards')
          .update({ status: 'bought' })
          .eq('id', pendingCustomerRewardId)

        if (finalizeCustomerRewardError) {
          console.error('Failed to finalize customer reward:', finalizeCustomerRewardError)
          // Don't throw error here as SMS was successful
        }
      }

      setIsSuccess(true)

      // Reset and close after showing success
      setTimeout(() => {
        setIsSuccess(false)
        onOpenChange(false)
        setFormData({
          message: "",
          attachReward: false,
          selectedReward: "",
        })
        setSelectedRewardDetails(null)
        setError(null)
      }, 2000)

    } catch (err) {
      console.error('SMS Error:', err)
      
      // Step 5: If anything failed and we have pending rewards, rollback
      if (pendingRewardCodeId) {
        try {
          await supabase
            .from('reward_codes')
            .update({ 
              status: 'unused',
              customer_id: null,
              bought_at: null
            })
            .eq('id', pendingRewardCodeId)
        } catch (rollbackError) {
          console.error('Failed to rollback reward code:', rollbackError)
        }
      }

      if (pendingCustomerRewardId) {
        try {
          await supabase
            .from('customer_rewards')
            .delete()
            .eq('id', pendingCustomerRewardId)
        } catch (rollbackError) {
          console.error('Failed to rollback customer reward:', rollbackError)
        }
      }

      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    setFormData({
      message: "",
      attachReward: false,
      selectedReward: "",
    })
    setSelectedRewardDetails(null)
    setError(null)
    setIsSuccess(false)
  }

  if (!customer) return null

  // Calculate reward value balance using money_points_ratio
  const customerPoints = Number(customer.points) || 0
  const rewardValueBalance = Math.round(customerPoints * moneyPointsRatio).toLocaleString()

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="flex items-center">
          <Button variant="ghost" size="icon" className="absolute right-4 top-4" onClick={handleClose}>
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </DialogHeader>

        <div className="flex flex-col items-center text-center mb-4">
          <div className="bg-[#F8843A] rounded-md p-4 flex items-center justify-center mb-4">
            <MessageCircle className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-lg font-medium">Send SMS to</h2>
          <h2 className="text-xl font-bold">{customer.name}</h2>
        </div>

        <p className="text-sm text-gray-500 mb-4 text-center">
          Reward value balance: TZS {rewardValueBalance}
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSuccess ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="rounded-full bg-green-100 p-3 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-medium">SMS sent successfully!</p>
            <p className="text-sm text-gray-500 mt-1">Message delivered to {customer.phoneId}</p>
            {selectedRewardDetails && (
              <p className="text-sm text-green-600 mt-1">Reward code sent: {selectedRewardDetails.rewardCode}</p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Phone Number:</span>
                <span>{customer.phoneId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Points:</span>
                <span>{customer.points}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Spent:</span>
                <span>TZS {customer.totalSpend}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Last Visit:</span>
                <span>{lastVisitDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Reward Value Balance:</span>
                <span>TZS {rewardValueBalance}</span>
              </div>
            </div>

            {/* Only show reward attachment for eligible customers */}
            {isCustomerEligible && (
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="attach-reward" 
                  checked={formData.attachReward} 
                  onCheckedChange={handleCheckboxChange}
                  disabled={availableRewards.length === 0}
                />
                <Label htmlFor="attach-reward">
                  Attach a Reward? 
                  {availableRewards.length === 0 && (
                    <span className="text-xs text-gray-400 ml-1">(No rewards available)</span>
                  )}
                </Label>
              </div>
            )}

            {formData.attachReward && isCustomerEligible && (
              <Select value={formData.selectedReward} onValueChange={handleRewardChange}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingRewards ? "Loading rewards..." : "Select Reward"} />
                </SelectTrigger>
                <SelectContent>
                  {availableRewards.map((reward) => (
                    <SelectItem key={reward.id} value={reward.id}>
                      {reward.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Show reward preview when attached */}
            {selectedRewardDetails && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">📎 Reward to be sent: {selectedRewardDetails.title}</p>
                <p className="text-sm text-green-600">🎫 Reward Code: {selectedRewardDetails.rewardCode}</p>
              </div>
            )}

            <div className="space-y-2 relative">
              <Textarea
                placeholder="Type your message here..."
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="min-h-[120px]"
                maxLength={500}
                required
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formData.message.length}/500</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6 text-orange-500"
              >
                <PenLine className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-[#F8843A] hover:bg-[#E77A35]" 
              disabled={isSubmitting || !formData.message.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending SMS...
                </>
              ) : (
                "Send SMS"
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
