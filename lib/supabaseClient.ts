// lib/supabaseClient.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// For client components
export const supabase = createClientComponentClient()

// Legacy export for backwards compatibility
export { supabase as createClient }
