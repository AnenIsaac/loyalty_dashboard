import React, { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { useDropzone } from "react-dropzone"
import { Upload, X, Loader2 } from "lucide-react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Business } from "@/types/common"
import { createReward, updateReward, getDefaultTerms, type Reward, type RewardFormData } from "@/lib/rewards"
import { supabase } from '@/lib/supabaseClient'

export interface Reward {
  id: string
  created_at: string
  business_id: string
  title: string
  description: string | null
  points_required: number
  cost: number | null
  is_active: boolean
  image_url: string | null
  terms_and_conditions: string | null
  uses_default_terms: boolean
  expiry_date: string | null
}

interface ZawadiiSettings {
  id: number
  money_points_ratio: number
}

interface AddEditRewardModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reward?: Reward | null
  business: Business | null
  settings: ZawadiiSettings | null
  onSave?: (reward: Reward) => void
  onError?: (error: string) => void
}

export function AddEditRewardModal({ open, onOpenChange, reward, business, settings, onSave, onError }: AddEditRewardModalProps) {
  const [formData, setFormData] = useState<{
    name: string
    points: number
    cost: string | number
    description: string
    status: "active" | "inactive"
    imageUrl: string
    termsAndConditions: string
    expiryDate: string
    useDefaultTerms: boolean
  }>({
    name: "",
    points: 0,
    cost: "",
    description: "",
    status: "active",
    imageUrl: "",
    termsAndConditions: "",
    expiryDate: "",
    useDefaultTerms: true,
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Debug settings data
  console.log('Modal received settings:', settings)
  console.log('Modal received business:', business)

  const defaultTerms = `• This reward is valid for one-time use only
• Points cannot be refunded once redeemed
• Cannot be combined with other offers
• Management reserves the right to modify terms at any time`

  // Auto-calculate points when cost changes using zawadii_settings
  const calculatePoints = (cost: number): number => {
    console.log('Calculating points with cost:', cost, 'settings:', settings)
    if (!settings?.money_points_ratio || cost <= 0) return 0
    const points = Math.round(cost / settings.money_points_ratio)
    console.log('Calculated points:', points)
    return points
  }

  // Upload image to Supabase Storage
  const uploadRewardImage = async (file: File, rewardId?: string): Promise<{ url: string | null; error: string | null }> => {
    if (!business?.id) {
      return { url: null, error: 'Business data not available' }
    }
    
    const supabase = createClientComponentClient()
    
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = rewardId 
        ? `${rewardId}.${fileExt}` 
        : `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const filePath = `${business.id}/rewards/${fileName}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        return { url: null, error: uploadError.message }
      }

      const { data: urlData } = supabase.storage
        .from('business-assets')
        .getPublicUrl(filePath)

      return { url: urlData.publicUrl, error: null }
    } catch (error: any) {
      return { url: null, error: error.message }
    }
  }

  useEffect(() => {
    // Reset form when modal opens
    if (open) {
      if (reward) {
        // Handle both database reward format and local Reward format
        const formatDateForInput = (dateString: string | null | undefined): string => {
          if (!dateString) return ""
          try {
            // Handle both ISO date strings and YYYY-MM-DD format
            const date = new Date(dateString)
            if (isNaN(date.getTime())) return ""
            // Format as YYYY-MM-DD for HTML date input
            return date.toISOString().split('T')[0]
          } catch {
            return ""
          }
        }

        const rewardData = {
          name: reward.title || (reward as any).name,
          points: reward.points_required || (reward as any).pointsCost,
          cost: reward.cost || 0,
          description: reward.description || "",
          status: (reward.is_active !== undefined ? reward.is_active : (reward as any).status === 'active') ? "active" : "inactive",
          imageUrl: reward.image_url || (reward as any).image || "",
          termsAndConditions: reward.terms_and_conditions || "",
          expiryDate: formatDateForInput(reward.expiry_date),
          useDefaultTerms: reward.uses_default_terms ?? true,
        }
        
        console.log('Modal received reward for editing:', reward)
        console.log('Raw expiry_date from reward:', reward.expiry_date)
        console.log('Formatted expiry date:', formatDateForInput(reward.expiry_date))
        console.log('Setting form data for edit:', rewardData)
        
        setFormData(rewardData)
      } else {
        // Clear form for new reward
        console.log('Modal opened for new reward - clearing form')
        setFormData({
          name: "",
          points: 0,
          cost: "",
          description: "",
          status: "active",
          imageUrl: "",
          termsAndConditions: "",
          expiryDate: "",
          useDefaultTerms: true,
        })
      }
    }
  }, [open, reward])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target
    
    // Allow empty string for better UX
    if (value === "") {
      setFormData((prev) => ({ ...prev, [name]: "" }))
      return
    }
    
    const numValue = parseInt(value) || 0
    
    if (name === 'cost') {
      // Auto-calculate points when cost changes
      const calculatedPoints = calculatePoints(numValue)
      setFormData((prev) => ({ 
        ...prev, 
        [name]: numValue,
        points: calculatedPoints
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: numValue }))
    }
  }

  const handleStatusChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      status: checked ? "active" : "inactive",
    }))
  }

  const handleTermsToggle = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      useDefaultTerms: checked,
      termsAndConditions: checked ? "" : prev.termsAndConditions,
    }))
  }

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png"],
    },
    maxFiles: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!business?.id) {
      onError?.('Business data not available. Please try again.')
      return
    }
    
    setIsLoading(true)
    // Using shared supabase client
    
    try {
      let imageUrl = formData.imageUrl

      // Handle image upload if there's a new image
      if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
        const response = await fetch(formData.imageUrl)
        const blob = await response.blob()
        const file = new File([blob], 'reward-image.jpg', { type: blob.type })
        
        const { url, error: uploadError } = await uploadRewardImage(file, reward?.id)
        if (uploadError) {
          onError?.(uploadError)
          return
        }
        imageUrl = url
      }

      // Prepare reward data for database
      const rewardData = {
        title: formData.name,
        description: formData.description,
        points_required: formData.points,
        cost: typeof formData.cost === 'string' && formData.cost === '' ? 0 : Number(formData.cost),
        is_active: formData.status === 'active',
        image_url: imageUrl,
        terms_and_conditions: formData.useDefaultTerms ? null : formData.termsAndConditions,
        uses_default_terms: formData.useDefaultTerms,
        expiry_date: formData.expiryDate || null
      }

      console.log('Submitting reward data to database:', rewardData)

      if (reward) {
        // Update existing reward
        const { data, error } = await supabase
          .from('rewards')
          .update(rewardData)
          .eq('id', reward.id)
          .eq('business_id', business.id)
          .select()
          .single()

        if (error) {
          onError?.(error.message)
          return
        }
        if (data && onSave) {
          onSave(data)
        }
    } else {
        // Create new reward
        const { data, error } = await supabase
          .from('rewards')
          .insert({ ...rewardData, business_id: business.id })
          .select()
          .single()

        if (error) {
          onError?.(error.message)
          return
        }
        if (data && onSave) {
          onSave(data)
        }
      }
      
    onOpenChange(false)
      
    } catch (error: any) {
      console.error('Submit error:', error)
      onError?.(error.message || 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{reward ? "Edit Reward" : "Add New Reward"}</DialogTitle>
        </DialogHeader>
        
        {!business ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">Loading business data...</p>
          </div>
        ) : (
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex-1 overflow-y-auto px-1">
              <form onSubmit={handleSubmit} className="space-y-6 pb-4" ref={formRef}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Reward Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cost">Cost (TZS)</Label>
              <Input
                id="cost"
                name="cost"
                type="number"
                min={0}
                value={formData.cost}
                onChange={handleNumberChange}
                      placeholder="Enter cost (e.g. 1000)"
                required
              />
            </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="points">Points Required (Auto-calculated)</Label>
                    <Input
                      id="points"
                      name="points"
                      type="number"
                      value={formData.points}
                      readOnly
                      className="bg-gray-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">
                      {settings?.money_points_ratio 
                        ? `Calculated: Cost ÷ ${settings.money_points_ratio} = ${formData.points} points`
                        : 'Points conversion rate not set in system settings'
                      }
                    </p>
                  </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
                    <div className="flex items-center space-x-2 h-10">
                <Switch
                  id="status"
                  checked={formData.status === "active"}
                  onCheckedChange={handleStatusChange}
                        className="data-[state=checked]:bg-green-500"
                />
                      <Label htmlFor="status" className={`font-medium ${formData.status === "active" ? "text-green-600" : "text-gray-500"}`}>
                  {formData.status === "active" ? "Active" : "Inactive"}
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Reward Image</Label>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${
                  isDragActive
                    ? "border-orange-500 bg-orange-50"
                    : "border-gray-300 hover:border-orange-500"
                }
                ${formData.imageUrl ? "h-[200px]" : "h-[120px]"}`}
            >
              <input {...getInputProps()} />
              {formData.imageUrl ? (
                <div className="relative h-full">
                  <img
                    src={formData.imageUrl}
                    alt="Reward image"
                    className="h-full mx-auto object-contain"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute top-0 right-0 text-gray-500 hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation()
                      setFormData((prev) => ({ ...prev, imageUrl: "" }))
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <Upload className="h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    {isDragActive
                      ? "Drop the image here"
                      : "Drag and drop image here, or click to select"}
                  </p>
                </div>
              )}
            </div>
          </div>

            <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
              <Input
                    id="expiryDate"
                    name="expiryDate"
                type="date"
                    value={formData.expiryDate}
                onChange={handleInputChange}
              />
            </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="useDefaultTerms"
                      checked={formData.useDefaultTerms}
                      onCheckedChange={handleTermsToggle}
                      className="data-[state=checked]:bg-green-500"
                    />
                    <Label htmlFor="useDefaultTerms" className="font-medium">
                      Use Default Terms & Conditions
                    </Label>
                  </div>
                  
                  {formData.useDefaultTerms ? (
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">
                        Default Terms & Conditions:
                      </Label>
                      <div className="text-sm text-gray-600 whitespace-pre-line">
                        {defaultTerms}
            </div>
          </div>
                  ) : (
          <div className="space-y-2">
                      <Label htmlFor="termsAndConditions">Custom Terms & Conditions</Label>
            <Textarea
              id="termsAndConditions"
              name="termsAndConditions"
              value={formData.termsAndConditions}
              onChange={handleInputChange}
                        placeholder="Enter your custom terms and conditions for this reward"
                        rows={6}
                        required={!formData.useDefaultTerms}
            />
                    </div>
                  )}
                </div>
              </form>
          </div>

            <DialogFooter className="flex-shrink-0 border-t pt-4 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
              Cancel
            </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="min-w-[100px]"
                onClick={(e) => {
                  e.preventDefault()
                  if (formRef.current) {
                    formRef.current.requestSubmit()
                  }
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `${reward ? 'Update' : 'Save'} Reward`
                )}
              </Button>
          </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 