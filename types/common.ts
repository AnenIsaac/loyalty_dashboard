// Common types for the loyalty dashboard application

export interface BasePageProps {
  user_id: string
  business_id: string
}

export interface Business {
  id: string
  user_id: string
  name: string
  category: string
  description?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo_url?: string
  cover_image_url?: string
  operating_hours?: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  points_per_dollar?: number
  instagram?: string
  whatsapp?: string
  x?: string
  tiktok?: string
  carousel_images?: string[]
}

export interface Customer {
  id: string
  full_name?: string
  nickname?: string
  phone_number: string
  email?: string
  date_of_birth?: string
  created_at: string
}

export interface CustomerInteraction {
  id: string
  customer_id: string
  business_id: string
  interaction_type: string
  amount_spent?: number
  points_awarded?: number
  phone_number?: string
  name?: string
  optional_note?: string
  created_at: string
}

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

export interface RewardsCatalog {
  id: string
  business_id: string
  title: string
  description: string
  points_required: number
  value?: number
  code?: string
}

export interface CustomerReward {
  id: string
  customer_id: string
  business_id: string
  reward_id: string
  reward_code?: string
  points_spent: number
  status: 'pending' | 'claimed' | 'redeemed' | 'expired' | 'bought'
  claimed_at?: string
  redeemed_at?: string
  expires_at?: string
  note?: string
  reward_code_id?: number
  created_at: string
  // Joined data from database queries
  rewards?: Reward
  customers?: Customer
}

export interface CustomerPoint {
  id: string
  customer_id?: string
  phone_number: string
  business_id: string
  points: number
  total_amount_spent: number
  created_at: string
  updated_at: string
}

export interface ProcessedCustomer extends Customer {
  totalSpend: string
  totalVisits: number
  lastVisitDate: string
  points: number
  tag: string
  secondaryStatus: 'Active' | 'At Risk' | 'Lapsed' | null
  spendingScore: number
  phoneId: string
  name: string
  source?: string
  hasApp?: boolean
}

export interface FilterOption {
  id: number
  field: string
  operator: "greater" | "less"
  value: string
}

export interface LoadingState {
  isLoading: boolean
  error: string | null
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface CustomerMetrics {
  totalCustomers: number
  newCustomersThisMonth: number
  avgSpendPerVisit: number
  visitFrequency: number
} 