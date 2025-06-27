import { supabase } from '@/lib/supabaseClient'

export interface Reward {
  id: string
  business_id: string
  name: string
  description: string
  points_required: number
  image_url?: string
  category: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RewardCode {
  id: string
  reward_id: string
  code: string
  customer_id?: string
  is_used: boolean
  used_at?: string
  created_at: string
  expires_at?: string
  status?: 'available' | 'used' | 'expired' | 'pending'
}

export interface RewardRedemption {
  id: string
  customer_id: string
  reward_id: string
  points_used: number
  status: 'pending' | 'completed' | 'cancelled'
  created_at: string
  reward?: Reward
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

// Get all rewards for a business
export async function getBusinessRewards(businessId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching business rewards:', error)
    throw new Error('Failed to fetch rewards')
  }

  return data || []
}

// Create a new reward
export async function createReward(reward: Omit<Reward, 'id' | 'created_at' | 'updated_at'>): Promise<Reward> {
  const { data, error } = await supabase
    .from('rewards')
    .insert(reward)
    .select()
    .single()

  if (error) {
    console.error('Error creating reward:', error)
    throw new Error('Failed to create reward')
  }

  return data
}

// Update a reward
export async function updateReward(id: string, updates: Partial<Reward>): Promise<Reward> {
  const { data, error } = await supabase
    .from('rewards')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating reward:', error)
    throw new Error('Failed to update reward')
  }

  return data
}

// Delete a reward
export async function deleteReward(id: string): Promise<void> {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting reward:', error)
    throw new Error('Failed to delete reward')
  }
}

// Get available reward codes for a specific reward
export async function getAvailableRewardCodes(rewardId: string): Promise<RewardCode[]> {
  const { data, error } = await supabase
    .from('reward_codes')
    .select('*')
    .eq('reward_id', rewardId)
    .eq('is_used', false)
    .is('customer_id', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching available reward codes:', error)
    throw new Error('Failed to fetch reward codes')
  }

  return data || []
}

// Generate reward codes for a reward
export async function generateRewardCodes(rewardId: string, count: number): Promise<RewardCode[]> {
  const codes: Omit<RewardCode, 'id' | 'created_at'>[] = []
  
  for (let i = 0; i < count; i++) {
    const code = generateRandomCode()
    codes.push({
      reward_id: rewardId,
      code,
      is_used: false,
      status: 'available'
    })
  }

  const { data, error } = await supabase
    .from('reward_codes')
    .insert(codes)
    .select()

  if (error) {
    console.error('Error generating reward codes:', error)
    throw new Error('Failed to generate reward codes')
  }

  return data || []
}

// Redeem a reward for a customer
export async function redeemReward(customerId: string, rewardId: string, pointsUsed: number): Promise<RewardRedemption> {
  // Get an available reward code
  const { data: availableCodes, error: codeError } = await supabase
    .from('reward_codes')
    .select('*')
    .eq('reward_id', rewardId)
    .eq('is_used', false)
    .is('customer_id', null)
    .limit(1)

  if (codeError) {
    console.error('Error fetching available codes:', codeError)
    throw new Error('Failed to find available reward codes')
  }

  if (!availableCodes || availableCodes.length === 0) {
    throw new Error('No available reward codes for this reward')
  }

  const code = availableCodes[0]

  // Start a transaction to update the code and create redemption
  const { data: redemption, error: redemptionError } = await supabase
    .from('reward_redemptions')
    .insert({
      customer_id: customerId,
      reward_id: rewardId,
      points_used: pointsUsed,
      status: 'pending'
    })
    .select()
    .single()

  if (redemptionError) {
    console.error('Error creating redemption:', redemptionError)
    throw new Error('Failed to create reward redemption')
  }

  // Update the reward code
  const { error: updateError } = await supabase
    .from('reward_codes')
    .update({
      customer_id: customerId,
      is_used: true,
      used_at: new Date().toISOString(),
      status: 'used'
    })
    .eq('id', code.id)

  if (updateError) {
    console.error('Error updating reward code:', updateError)
    // TODO: Rollback the redemption if code update fails
    throw new Error('Failed to assign reward code')
  }

  return redemption
}

// Get customer redemptions
export async function getCustomerRedemptions(customerId: string): Promise<RewardRedemption[]> {
  const { data, error } = await supabase
    .from('reward_redemptions')
    .select(`
      *,
      reward:rewards(*)
    `)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching customer redemptions:', error)
    throw new Error('Failed to fetch redemptions')
  }

  return data || []
}

// Helper function to generate random codes
function generateRandomCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Get default terms
export function getDefaultTerms(): string {
  return `• This reward is valid for one-time use only
• Points cannot be refunded once redeemed
• Cannot be combined with other offers
• Management reserves the right to modify terms at any time`
} 