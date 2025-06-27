import { useState, useEffect, useCallback, useMemo } from "react"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"
import { LoadingComponent } from "@/components/ui/loading-component"
import { ErrorComponent } from "@/components/ui/error-component"
import { InfoIcon, Settings, Loader2, AlertTriangle } from "lucide-react"

// TypeScript Interfaces
interface RewardFormData {
  points_conversion: number
  tin: string
}

interface ZawadiiSettings {
  id: number
  money_points_ratio: number
}

interface RewardConfigurationProps {
  userId: string
  businessId: string
  onUpdate?: () => void
}

interface ValidationErrors {
  [key: string]: string
}

interface LoadingState {
  isLoading: boolean
  isSaving: boolean
  isLoadingSettings: boolean
}

export function RewardConfiguration({ userId, businessId, onUpdate }: RewardConfigurationProps) {
  const [formData, setFormData] = useState<RewardFormData>({
    points_conversion: 2,
    tin: "",
  })
  
  const [zawadiiSettings, setZawadiiSettings] = useState<ZawadiiSettings | null>(null)
  const [originalData, setOriginalData] = useState<RewardFormData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    isSaving: false,
    isLoadingSettings: true
  })
  const [error, setError] = useState<string>('')
  const [settingsError, setSettingsError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  
  const { toast } = useToast()
  const supabase = createClientComponentClient()

  const hasChanges = useMemo(() => {
    if (!originalData) return false
    return Object.keys(formData).some(key => 
      formData[key as keyof RewardFormData] !== originalData[key as keyof RewardFormData]
    )
  }, [formData, originalData])

  const fetchZawadiiSettings = useCallback(async () => {
    try {
      setLoadingState(prev => ({ ...prev, isLoadingSettings: true }))
      setSettingsError('')

      const { data: settingsData, error: settingsError } = await supabase
        .from('zawadii_settings')
        .select('id, money_points_ratio')
        .eq('id', 1)
        .single()

      if (settingsError) {
        console.warn('Could not fetch zawadii settings:', settingsError)
        
        if (settingsError.code === 'PGRST301' || settingsError.message?.includes('policy')) {
          setSettingsError('Database configuration issue: Unable to access system settings. Please contact support.')
        } else if (settingsError.code === 'PGRST116') {
          setSettingsError('System settings not found. Using default conversion rate.')
          // Set default settings
          setZawadiiSettings({ id: 1, money_points_ratio: 100 })
        } else {
          setSettingsError('Failed to load system settings. Using default conversion rate.')
          setZawadiiSettings({ id: 1, money_points_ratio: 100 })
        }
      } else {
        setZawadiiSettings(settingsData)
        console.log('Zawadii settings loaded:', settingsData)
      }
    } catch (err) {
      console.error('Error fetching zawadii settings:', err)
      setSettingsError('Error loading system settings. Using default conversion rate.')
      setZawadiiSettings({ id: 1, money_points_ratio: 100 })
    } finally {
      setLoadingState(prev => ({ ...prev, isLoadingSettings: false }))
    }
  }, [supabase])

  const fetchRewardData = useCallback(async () => {
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
        .select('points_conversion, tin')
        .eq('user_id', userId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // No business found, set empty defaults
          const emptyData: RewardFormData = {
            points_conversion: 2,
            tin: "",
          }
          setFormData(emptyData)
          setOriginalData(emptyData)
        } else {
          throw fetchError
        }
      } else {
        const rewardData: RewardFormData = {
          points_conversion: business.points_conversion || 2,
          tin: business.tin || "",
        }
        
        setFormData(rewardData)
        setOriginalData(rewardData)
      }
    } catch (err) {
      console.error('Error fetching reward data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load reward configuration')
    } finally {
      setLoadingState(prev => ({ ...prev, isLoading: false }))
    }
  }, [userId, supabase])

  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {}
    
    if (formData.points_conversion < 1 || formData.points_conversion > 10) {
      errors.points_conversion = 'Cashback percentage must be between 1% and 10%'
    }
    
    if (formData.tin && formData.tin.trim().length > 0) {
      // Basic TIN validation - adjust according to your country's format
      if (formData.tin.trim().length < 8) {
        errors.tin = 'TIN must be at least 8 characters'
      }
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
      const rewardData = {
        points_conversion: formData.points_conversion,
        tin: formData.tin?.trim() || null,
      }

      const { error: updateError } = await supabase
        .from('businesses')
        .update(rewardData)
        .eq('user_id', userId)

      if (updateError) throw updateError
      
      toast({
        title: "Success",
        description: "Reward configuration updated successfully!",
      })

      setOriginalData({ ...formData })
      
      if (onUpdate) {
        onUpdate()
      }
      
    } catch (err) {
      console.error('Error saving reward data:', err)
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save reward configuration",
        variant: "destructive",
      })
    } finally {
      setLoadingState(prev => ({ ...prev, isSaving: false }))
    }
  }, [formData, userId, validateForm, supabase, toast, onUpdate])

  const handleInputChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) => {
    const { value } = e.target
    if (field === "points_conversion") {
      // Ensure value is between 1 and 10
      const numValue = Math.min(Math.max(Number(value) || 1, 1), 10)
      setFormData((prev) => ({ ...prev, [field]: numValue }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
    
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }, [validationErrors])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    handleSave()
  }, [handleSave])

  const handleRetry = useCallback(() => {
    fetchRewardData()
    fetchZawadiiSettings()
  }, [fetchRewardData, fetchZawadiiSettings])

  const handleReset = useCallback(() => {
    if (originalData) {
      setFormData({ ...originalData })
      setValidationErrors({})
    }
  }, [originalData])

  useEffect(() => {
    fetchRewardData()
    fetchZawadiiSettings()
  }, [fetchRewardData, fetchZawadiiSettings])

  // Loading and Error States
  if (loadingState.isLoading) {
    return <LoadingComponent message="Loading reward configuration..." />
  }

  if (error) {
    return (
      <ErrorComponent 
        message={error}
        onRetry={handleRetry}
      />
    )
  }

  // Calculate example rewards with proper flow
  const exampleSpend = 100000
  const cashbackValue = (exampleSpend * formData.points_conversion) / 100
  const pointsAwarded = zawadiiSettings ? Math.round(cashbackValue / zawadiiSettings.money_points_ratio) : 0

  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Settings className="h-6 w-6 text-[#F8843A]" />
          <h2 className="text-2xl font-bold text-gray-900">Reward Configuration</h2>
        </div>
        <p className="text-gray-600">
          Configure your loyalty program cashback settings and TRA integration
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="points_conversion">Cashback Percentage</Label>
            <Input
              id="points_conversion"
              type="number"
              min={1}
              max={10}
              step={0.1}
              value={formData.points_conversion}
              onChange={(e) => handleInputChange(e, "points_conversion")}
              required
              disabled={loadingState.isSaving}
              className={validationErrors.points_conversion ? 'border-red-500' : ''}
            />
            {validationErrors.points_conversion && (
              <p className="text-sm text-red-600">{validationErrors.points_conversion}</p>
            )}
            <p className="text-sm text-gray-500">
              This is how much cashback value you give back to customers on every interaction (1-10%)
            </p>
          </div>

          {/* Zawadii Settings Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium text-blue-900">System Conversion Rate</h4>
            </div>
            {loadingState.isLoadingSettings ? (
              <p className="text-sm text-blue-700">Loading system settings...</p>
            ) : settingsError ? (
              <p className="text-sm text-red-600">{settingsError}</p>
            ) : zawadiiSettings ? (
              <div className="text-sm text-blue-700">
                <p><strong>Money to Points Ratio:</strong> {zawadiiSettings.money_points_ratio} TZS = 1 point</p>
                <p className="mt-1">This means every {zawadiiSettings.money_points_ratio} TZS of cashback value equals 1 Zawadii point.</p>
              </div>
            ) : (
              <p className="text-sm text-red-600">Unable to load system settings</p>
            )}
          </div>

          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">Complete Cashback Flow Example:</p>
              <div className="mt-2 space-y-1 text-sm">
                <p><strong>1. Customer Spending:</strong> {exampleSpend.toLocaleString()} TZS</p>
                <p><strong>2. Your Cashback ({formData.points_conversion}%):</strong> {cashbackValue.toLocaleString()} TZS cashback value</p>
                {zawadiiSettings ? (
                  <>
                    <p><strong>3. Points Conversion:</strong> {cashbackValue.toLocaleString()} TZS ÷ {zawadiiSettings.money_points_ratio} = {pointsAwarded} Zawadii points</p>
                    <p className="mt-2 font-medium text-green-700">
                      → Customer receives {pointsAwarded} points they can redeem for rewards
                    </p>
                  </>
                ) : (
                  <p className="text-red-600"><strong>3. Points Conversion:</strong> Unable to calculate (system settings unavailable)</p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {formData.points_conversion > 5 && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                <p className="font-medium">High Cashback Rate Warning</p>
                <p>
                  You've set a cashback rate above 5%. While this can attract customers, 
                  high cashback rates may impact your profit margins. Consider if this rate 
                  aligns with your business goals and is financially sustainable.
                </p>
                <p className="mt-2 text-sm">
                  <strong>Recommended:</strong> Most successful businesses use 2-4% cashback rates.
                </p>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Tax Information</h3>

          <div className="space-y-2">
            <Label htmlFor="tin">TIN (Tax Identification Number)</Label>
            <Input
              id="tin"
              value={formData.tin}
              onChange={(e) => handleInputChange(e, "tin")}
              placeholder="Enter your business TIN"
              disabled={loadingState.isSaving}
              className={validationErrors.tin ? 'border-red-500' : ''}
            />
            {validationErrors.tin && (
              <p className="text-sm text-red-600">{validationErrors.tin}</p>
            )}
            <p className="text-sm text-gray-500">
              Optional: Your business Tax Identification Number
            </p>
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
              'Save Configuration'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 