import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
}

export interface RewardFormData {
  name: string
  points: number
  cost: number
  description: string
  status: 'active' | 'inactive'
  imageUrl: string
  termsAndConditions: string
  expiryDate: string
  useDefaultTerms: boolean
}

// Upload image to Supabase Storage
export async function uploadRewardImage(
  businessId: string,
  file: File,
  rewardId?: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = createClientComponentClient()
  
  try {
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = rewardId 
      ? `${rewardId}.${fileExt}` 
      : `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const filePath = `${businessId}/rewards/${fileName}`
    
    // Upload file to business-assets bucket
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('business-assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { url: null, error: uploadError.message }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('business-assets')
      .getPublicUrl(filePath)

    return { url: urlData.publicUrl, error: null }
  } catch (error: any) {
    console.error('Image upload failed:', error)
    return { url: null, error: error.message }
  }
}

// Create new reward
export async function createReward(
  businessId: string,
  formData: RewardFormData
): Promise<{ data: Reward | null; error: string | null }> {
  const supabase = createClientComponentClient()
  
  try {
    let imageUrl = null
    
    // Handle image upload if there's an image
    if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
      // Convert base64 to File
      const response = await fetch(formData.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'reward-image.jpg', { type: blob.type })
      
      const { url, error: uploadError } = await uploadRewardImage(businessId, file)
      if (uploadError) {
        return { data: null, error: uploadError }
      }
      imageUrl = url
    }

    // Prepare reward data for database
    const rewardData = {
      business_id: businessId,
      title: formData.name,
      description: formData.description,
      points_required: formData.points,
      cost: formData.cost,
      is_active: formData.status === 'active',
      image_url: imageUrl,
      terms_and_conditions: formData.useDefaultTerms ? null : formData.termsAndConditions,
      uses_default_terms: formData.useDefaultTerms
    }

    // Insert reward into database
    const { data, error } = await supabase
      .from('rewards')
      .insert(rewardData)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Create reward failed:', error)
    return { data: null, error: error.message }
  }
}

// Update existing reward
export async function updateReward(
  businessId: string,
  rewardId: string,
  formData: RewardFormData
): Promise<{ data: Reward | null; error: string | null }> {
  const supabase = createClientComponentClient()
  
  try {
    let imageUrl = formData.imageUrl

    // Handle image upload if there's a new image
    if (formData.imageUrl && formData.imageUrl.startsWith('data:')) {
      // Convert base64 to File
      const response = await fetch(formData.imageUrl)
      const blob = await response.blob()
      const file = new File([blob], 'reward-image.jpg', { type: blob.type })
      
      const { url, error: uploadError } = await uploadRewardImage(businessId, file, rewardId)
      if (uploadError) {
        return { data: null, error: uploadError }
      }
      imageUrl = url
    }

    // Prepare reward data for database
    const rewardData = {
      title: formData.name,
      description: formData.description,
      points_required: formData.points,
      cost: formData.cost,
      is_active: formData.status === 'active',
      image_url: imageUrl,
      terms_and_conditions: formData.useDefaultTerms ? null : formData.termsAndConditions,
      uses_default_terms: formData.useDefaultTerms
    }

    // Update reward in database
    const { data, error } = await supabase
      .from('rewards')
      .update(rewardData)
      .eq('id', rewardId)
      .eq('business_id', businessId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Update reward failed:', error)
    return { data: null, error: error.message }
  }
}

// Get all rewards for a business
export async function getBusinessRewards(
  businessId: string
): Promise<{ data: Reward[] | null; error: string | null }> {
  const supabase = createClientComponentClient()
  
  try {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error: any) {
    console.error('Get rewards failed:', error)
    return { data: null, error: error.message }
  }
}

// Delete a reward
export async function deleteReward(
  businessId: string,
  rewardId: string
): Promise<{ error: string | null }> {
  const supabase = createClientComponentClient()
  
  try {
    // First get the reward to check if it has an image
    const { data: reward } = await supabase
      .from('rewards')
      .select('image_url')
      .eq('id', rewardId)
      .eq('business_id', businessId)
      .single()

    // Delete the reward from database
    const { error: deleteError } = await supabase
      .from('rewards')
      .delete()
      .eq('id', rewardId)
      .eq('business_id', businessId)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return { error: deleteError.message }
    }

    // Delete image from storage if it exists
    if (reward?.image_url) {
      const filePath = `${businessId}/rewards/${rewardId}`
      await supabase.storage
        .from('business-assets')
        .remove([filePath])
    }

    return { error: null }
  } catch (error: any) {
    console.error('Delete reward failed:', error)
    return { error: error.message }
  }
}

// Get default terms
export function getDefaultTerms(): string {
  return `• This reward is valid for one-time use only
• Points cannot be refunded once redeemed
• Cannot be combined with other offers
• Management reserves the right to modify terms at any time`
} 