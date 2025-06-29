"use client"

import type React from "react"
import { useState } from "react"
import { X, MessageCircle, Gift, Check, AlertCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FilterOption {
  id: number
  field: string
  operator: "greater" | "less"
  value: string
}

interface ProcessedCustomer {
  id: string
  name: string
  phoneId: string
  totalSpend: string
  totalVisits: number
  lastVisitDate: string
  points: number
  tag: string
  secondaryStatus: 'Active' | 'At Risk' | 'Lapsed' | null
  spendingScore?: number
  source?: string
  hasApp?: boolean
}

interface SendBulkMessageModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers?: ProcessedCustomer[]
  appliedFilters?: FilterOption[]
}

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
}

// Mock rewards data
const availableRewards: Reward[] = [
  {
    id: "1",
    name: "Free Coffee",
    description: "Get a free regular coffee",
    pointsCost: 50
  },
  {
    id: "2",
    name: "Free Pastry",
    description: "Get a free pastry of your choice",
    pointsCost: 30
  },
  {
    id: "3",
    name: "10% Discount",
    description: "10% off your next purchase",
    pointsCost: 20
  },
  {
    id: "4",
    name: "Free Drink",
    description: "Get a free drink with any meal",
    pointsCost: 40
  },
  {
    id: "5",
    name: "20% Discount",
    description: "20% off your entire order",
    pointsCost: 75
  }
]

export function SendBulkMessageModal({ 
  open, 
  onOpenChange, 
  customers = [], 
  appliedFilters = [] 
}: SendBulkMessageModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sentCount, setSentCount] = useState(0)
  const [failedCount, setFailedCount] = useState(0)
  const [attachReward, setAttachReward] = useState(false)
  const [selectedReward, setSelectedReward] = useState("")
  const [message, setMessage] = useState("")

  // Calculate filtered customers count
  const fieldMapping: Record<string, string> = {
    "Total Spend": "totalSpend",
    "Total Visits": "totalVisits",
    "Last Visit Date": "lastVisitDate",
    Points: "points",
    Tag: "tag",
    "Reward Priority Index (RPI)": "rpi",
    "Loyalty Engagement Index (LEI)": "lei",
  }

  const filteredCustomers = customers.filter((customer) => {
    // If no filters applied, include all customers
    if (!appliedFilters || appliedFilters.length === 0) return true
    
    return appliedFilters.every((filter) => {
      // Skip filters with empty values
      if (!filter.value || !filter.field) return true
      
      const fieldName = fieldMapping[filter.field] || filter.field
      const customerValue = customer[fieldName as keyof ProcessedCustomer]

      if (customerValue === undefined || customerValue === null) {
        return false
      }

      // Handle tag comparisons (exact match)
      if (fieldName === "tag") {
        return customerValue.toString().toLowerCase() === filter.value.toLowerCase()
      }

      // Convert to number for numeric comparisons (remove commas)
      if (["totalSpend", "points", "rpi", "lei", "totalVisits", "spendingScore"].includes(fieldName)) {
        const numValue = typeof customerValue === 'string' ? 
          Number(customerValue.toString().replace(/,/g, '')) : 
          Number(customerValue)
        const filterValue = Number(filter.value)

        if (isNaN(filterValue)) return true

        if (filter.operator === "greater") {
          return numValue > filterValue
        } else {
          return numValue < filterValue
        }
      }

      // Handle date comparisons
      if (fieldName === "lastVisitDate") {
        if (customerValue.toString() === 'Never') {
          return filter.operator === "less"
        }

        try {
          const customerDate = new Date(customerValue.toString().split("/").reverse().join("/"))
          const filterDate = new Date(filter.value)

          if (isNaN(customerDate.getTime()) || isNaN(filterDate.getTime())) {
            return true
          }

          if (filter.operator === "greater") {
            return customerDate > filterDate
          } else {
            return customerDate < filterDate
          }
        } catch (error) {
          return true
        }
      }

      return true
    })
  })

  const qualifiedCustomerCount = filteredCustomers.length

  const getFilterDescription = (filter: FilterOption) => {
    const operatorText = filter.operator === "greater" ? ">" : "<"
    return `${filter.field} ${operatorText} ${filter.value}`
  }

  const selectedRewardDetails = availableRewards.find(r => r.id === selectedReward)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Prepare message with reward if attached
      let finalMessage = message.trim()
      if (attachReward && selectedRewardDetails) {
        finalMessage += `\n\n🎁 Special Reward: ${selectedRewardDetails.name} - ${selectedRewardDetails.description}`
      }

      // Prepare recipients for SMS API
      const recipients = filteredCustomers.map(customer => ({
        phone: customer.phoneId,
        id: customer.id
      }))

      // Send bulk SMS via our API
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipients,
          message: finalMessage,
          source_addr: 'ZAWADII'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send bulk SMS')
      }

      // Show success message
      setIsSuccess(true)
      setSentCount(result.sent_count || qualifiedCustomerCount)
      setFailedCount(result.failed_count || 0)

      // Reset and close after showing success
      setTimeout(() => {
        setIsSuccess(false)
        onOpenChange(false)
        setMessage("")
        setAttachReward(false)
        setSelectedReward("")
        setError(null)
        setSentCount(0)
        setFailedCount(0)
      }, 3000)

    } catch (err) {
      console.error('Bulk SMS Error:', err)
      setError(err instanceof Error ? err.message : 'Failed to send messages. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    // Reset form
    setMessage("")
    setAttachReward(false)
    setSelectedReward("")
    setError(null)
    setIsSuccess(false)
    setSentCount(0)
    setFailedCount(0)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-orange-500" />
            Send Bulk SMS
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-medium">Bulk SMS sent successfully!</p>
              <div className="text-sm text-gray-500 mt-2 text-center">
                <p>✅ {sentCount} messages sent successfully</p>
                {failedCount > 0 && <p>❌ {failedCount} messages failed</p>}
              </div>
            </div>
          ) : (
            <>
              {/* Customer Count and Filters Summary */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-orange-800">Target Audience</h3>
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {qualifiedCustomerCount} customers
                  </div>
                </div>
                
                {appliedFilters && appliedFilters.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-orange-700">Active filters:</p>
                    <div className="flex flex-wrap gap-2">
                      {appliedFilters.map((filter) => (
                        <Badge key={filter.id} variant="secondary" className="bg-orange-100 text-orange-800">
                          {getFilterDescription(filter)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-orange-700">No filters applied - targeting all customers</p>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Reward Attachment */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="attach-reward"
                      checked={attachReward}
                      onCheckedChange={(checked) => {
                        setAttachReward(checked as boolean)
                        if (!checked) setSelectedReward("")
                      }}
                    />
                    <Label htmlFor="attach-reward" className="flex items-center gap-2 font-medium">
                      <Gift className="h-4 w-4 text-orange-500" />
                      Attach a reward to this message
                    </Label>
                  </div>

                  {attachReward && (
                    <div className="ml-6 space-y-3">
                      <Select value={selectedReward} onValueChange={setSelectedReward}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reward to attach" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRewards.map((reward) => (
                            <SelectItem key={reward.id} value={reward.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{reward.name}</span>
                                <span className="text-sm text-gray-500 ml-2">{reward.pointsCost} pts</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {selectedRewardDetails && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-green-800">{selectedRewardDetails.name}</h4>
                              <p className="text-sm text-green-600">{selectedRewardDetails.description}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-green-800">{selectedRewardDetails.pointsCost} points</div>
                              <div className="text-xs text-green-600">per customer</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="font-medium">
                    SMS Message Content *
                  </Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value)
                      setError(null) // Clear error when user types
                    }}
                    placeholder="Write your SMS message here... (e.g., 'Thank you for being a loyal customer! Here's a special offer just for you.')"
                    className="min-h-[120px] resize-none"
                    maxLength={500}
                    required
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>SMS will be sent via Beem.africa</span>
                    <span>{message.length}/500</span>
                  </div>
                </div>

                {/* Preview */}
                {(message || selectedRewardDetails) && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">SMS Preview:</h4>
                    <div className="bg-white border rounded p-3 space-y-2">
                      {message && (
                        <p className="text-sm">{message}</p>
                      )}
                      {selectedRewardDetails && (
                        <div className="bg-orange-50 border border-orange-200 rounded p-2">
                          <p className="text-sm font-medium text-orange-800">🎁 Reward Attached:</p>
                          <p className="text-sm text-orange-700">{selectedRewardDetails.name} - {selectedRewardDetails.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!message.trim() || isSubmitting || qualifiedCustomerCount === 0}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending SMS...
                      </>
                    ) : (
                      <>
                        Send SMS to {qualifiedCustomerCount} customers
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
