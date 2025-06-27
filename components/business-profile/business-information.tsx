import { useState, useEffect, useCallback, useMemo } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { Loader2, Building2, Mail, Phone, MapPin, FileText } from "lucide-react"
import { validateEmail, validatePhone } from "@/utils/validation"

interface BusinessFormData {
  name: string
  description: string
  location_description: string
  phone_number: string
  email: string
}

interface BusinessInformationProps {
  userId: string
  onUpdate?: () => void
}

interface ValidationErrors {
  [key: string]: string
}

interface LoadingState {
  isLoading: boolean
  isSaving: boolean
}

export function BusinessInformation({ userId, onUpdate }: BusinessInformationProps) {
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    location_description: '',
    phone_number: '',
    email: '',
  })
  
  const [originalData, setOriginalData] = useState<BusinessFormData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isSaving: false
  })
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const hasChanges = useMemo(() => {
    if (!originalData) return false
    return Object.keys(formData).some(key => 
      formData[key as keyof BusinessFormData] !== originalData[key as keyof BusinessFormData]
    )
  }, [formData, originalData])

  const fetchBusinessData = useCallback(async () => {
    if (!userId) {
      setError('User ID is required')
      setLoadingState(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      setLoadingState(prev => ({ ...prev, isLoading: true }))
      setError('')

      const { data: business, error: fetchError } = await supabase
        .from('businesses')
        .select('name, description, location_description, phone_number, email')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          console.log('No business found for user:', userId)
          setOriginalData({
            name: '',
            description: '',
            location_description: '',
            phone_number: '',
            email: '',
          })
        } else {
          throw fetchError
        }
      } else {
        const businessData: BusinessFormData = {
          name: business.name || '',
          description: business.description || '',
          location_description: business.location_description || '',
          phone_number: business.phone_number || '',
          email: business.email || '',
        }
        
        setFormData(businessData)
        setOriginalData(businessData)
      }
    } catch (err) {
      console.error('Error fetching business data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load business information')
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }))
    }
  }, [userId, supabase])

  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Business name is required'
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Business name must be at least 2 characters'
    }
    
    if (!formData.phone_number.trim()) {
      errors.phone_number = 'Phone number is required'
    } else if (!validatePhone(formData.phone_number.replace(/\s+/g, ''))) {
      errors.phone_number = 'Please enter a valid phone number'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must be less than 500 characters'
    }
    
    if (formData.location_description && formData.location_description.length > 200) {
      errors.location_description = 'Location description must be less than 200 characters'
    }

    return errors
  }, [formData])

  const handleSave = useCallback(async () => {
    const errors = validateForm()
    setValidationErrors(errors)
    
    if (Object.keys(errors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before saving.",
        variant: "destructive",
      })
      return
    }

    setLoadingState(prev => ({ ...prev, isSaving: true }))
    
    try {
      const businessData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        location_description: formData.location_description.trim() || null,
        phone_number: formData.phone_number.trim(),
        email: formData.email.trim(),
        user_id: userId
      }

      if (originalData && originalData.name) {
        const { error: updateError } = await supabase
          .from('businesses')
          .update(businessData)
          .eq('user_id', userId)

        if (updateError) throw updateError
        
        toast({
          title: "Success",
          description: "Business information updated successfully!",
        })
      } else {
        const { error: insertError } = await supabase
          .from('businesses')
          .insert([businessData])

        if (insertError) throw insertError
        
        toast({
          title: "Success",
          description: "Business profile created successfully!",
        })
      }

      setOriginalData({ ...formData })
      
      if (onUpdate) {
        onUpdate()
      }
      
    } catch (err) {
      console.error('Error saving business data:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save business information",
        variant: "destructive",
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isSaving: false }))
    }
  }, [formData, originalData, userId, validateForm, supabase, toast, onUpdate])

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }, [validationErrors])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    handleSave()
  }, [handleSave])

  const handleRetry = useCallback(() => {
    fetchBusinessData()
  }, [fetchBusinessData])

  const handleReset = useCallback(() => {
    if (originalData) {
      setFormData({ ...originalData })
      setValidationErrors({})
    }
  }, [originalData])

  useEffect(() => {
    fetchBusinessData()
  }, [fetchBusinessData])

  if (loadingState.isLoading) {
    return <LoadingComponent message="Loading business information..." />
  }

  if (error) {
    return (
      <ErrorComponent 
        message={error}
        onRetry={handleRetry}
      />
    )
  }

  const isEditing = originalData && originalData.name

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Building2 className="h-6 w-6 text-[#F8843A]" />
          <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
        </div>
        <p className="text-gray-600">
          {isEditing 
            ? 'Update your business details and contact information' 
            : 'Enter your business details to create your profile'
          }
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center space-x-1">
              <Building2 className="h-4 w-4" />
              <span>Business Name *</span>
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your business name"
              disabled={loadingState.isSaving}
              className={validationErrors.name ? 'border-red-500' : ''}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-600">{validationErrors.name}</p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center space-x-1">
              <Phone className="h-4 w-4" />
              <span>Phone Number *</span>
            </Label>
            <Input
              id="phone_number"
              name="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="+255712345678"
              disabled={loadingState.isSaving}
              className={validationErrors.phone_number ? 'border-red-500' : ''}
            />
            {validationErrors.phone_number && (
              <p className="text-sm text-red-600">{validationErrors.phone_number}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center space-x-1">
              <Mail className="h-4 w-4" />
              <span>Business Email *</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="business@example.com"
              disabled={loadingState.isSaving}
              className={validationErrors.email ? 'border-red-500' : ''}
            />
            {validationErrors.email && (
              <p className="text-sm text-red-600">{validationErrors.email}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="description">Business Description</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Tell customers about your business, products, or services..."
            rows={4}
            disabled={loadingState.isSaving}
            className={validationErrors.description ? 'border-red-500' : ''}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{validationErrors.description || 'Optional - helps customers understand your business'}</span>
            <span>{formData.description.length}/500</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="location_description" className="flex items-center space-x-1">
            <MapPin className="h-4 w-4" />
            <span>Location Description</span>
          </Label>
          <Textarea
            id="location_description"
            name="location_description"
            value={formData.location_description}
            onChange={handleInputChange}
            placeholder="Describe your location with landmarks (e.g., 'Near Mlimani City Mall, opposite bus stop')"
            rows={2}
            disabled={loadingState.isSaving}
            className={validationErrors.location_description ? 'border-red-500' : ''}
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>{validationErrors.location_description || 'Optional - helps customers find you'}</span>
            <span>{formData.location_description.length}/200</span>
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t">
          <div>
            {hasChanges && originalData && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleReset}
                disabled={loadingState.isSaving}
              >
                Reset Changes
              </Button>
            )}
          </div>
          
          <Button 
            type="submit" 
            disabled={loadingState.isSaving || !hasChanges}
            className="bg-[#F8843A] hover:bg-orange-500"
          >
            {loadingState.isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              isEditing ? 'Update Information' : 'Create Business Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}