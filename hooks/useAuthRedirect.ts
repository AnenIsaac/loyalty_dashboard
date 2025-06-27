// hooks/useAuthRedirect.ts
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function useAuthRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simplified redirect - don't check session again since middleware handles it
      const redirectTo = searchParams.get('redirectTo') || '/reports'
      router.push(redirectTo)
    setLoading(false)
  }, [router, searchParams])

  return { loading }
}