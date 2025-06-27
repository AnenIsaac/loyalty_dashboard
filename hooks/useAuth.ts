import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { User } from '@supabase/auth-helpers-nextjs'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  error: string | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientComponentClient()

  const redirectToLogin = useCallback(() => {
    const returnTo = window.location.pathname + window.location.search
    router.push(`/auth/login?redirectTo=${encodeURIComponent(returnTo)}`)
  }, [router])

  useEffect(() => {
    let mounted = true

    const checkAuth = async () => {
      try {
        console.log('useAuth - Checking authentication...')
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (sessionError) {
          throw sessionError
        }

        if (!session?.user) {
          console.log('useAuth - No session found')
          if (!window.location.pathname.includes('/auth/')) {
            redirectToLogin()
          }
          setUser(null)
          setError(null)
          setIsLoading(false)
          return
        }

        console.log('useAuth - User authenticated:', session.user.id)
        setUser(session.user)
        setError(null)
        setIsLoading(false)
      } catch (err) {
        console.error('useAuth - Auth error:', err)
        
        if (!mounted) return
        
        setUser(null)
        setError(err instanceof Error ? err.message : 'Authentication failed')
        setIsLoading(false)
        
        if (!window.location.pathname.includes('/auth/')) {
          redirectToLogin()
        }
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      console.log('useAuth - Auth state change:', event, !!session?.user)
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setError(null)
        setIsLoading(false)
        if (!window.location.pathname.includes('/auth/')) {
          router.push('/auth/login')
        }
      } else if (session?.user) {
        console.log('useAuth - User signed in:', session.user.id)
        setUser(session.user)
        setError(null)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [redirectToLogin, router, supabase.auth])

  return { user, isLoading, error }
}
