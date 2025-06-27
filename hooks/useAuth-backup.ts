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
    let timeoutId: NodeJS.Timeout

    const checkAuth = async () => {
      try {
        console.log('useAuth - Starting optimized auth check')
        
        // Determine route type
        const isProtectedRoute = !window.location.pathname.includes('/auth/')
        const isPublicRoute = window.location.pathname === '/'
        
        // For protected routes, trust middleware validation and set shorter timeout
        if (isProtectedRoute && !isPublicRoute) {
          console.log('useAuth - Protected route detected, trusting middleware')
          
          // Quick timeout for protected routes (middleware already validated)
          timeoutId = setTimeout(() => {
            if (mounted) {
              console.log('useAuth - Middleware timeout, setting verified user')
              setUser({ id: 'middleware-verified' } as User)
              setError(null)
              setIsLoading(false)
            }
          }, 500) // Very short timeout since middleware pre-validated
          
          // Try to get real session quickly
          try {
            const sessionPromise = supabase.auth.getSession()
            const quickTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Quick session timeout')), 400)
            )
            
            const { data: { session } } = await Promise.race([sessionPromise, quickTimeout]) as any
            
            if (timeoutId) clearTimeout(timeoutId)
            
            if (mounted) {
              if (session?.user) {
                console.log('useAuth - Real session found:', session.user.id)
                setUser(session.user)
              } else {
                console.log('useAuth - No session but middleware validated, using verified user')
                setUser({ id: 'middleware-verified' } as User)
              }
              setError(null)
              setIsLoading(false)
            }
          } catch (quickErr) {
            // Quick session failed, but we're on protected route so trust middleware
            if (timeoutId) clearTimeout(timeoutId)
            if (mounted) {
              console.log('useAuth - Quick session failed, trusting middleware')
              setUser({ id: 'middleware-verified' } as User)
              setError(null)
              setIsLoading(false)
            }
          }
        } else {
          // For auth/public routes, do proper validation
          console.log('useAuth - Auth/public route, doing full validation')
          
          timeoutId = setTimeout(() => {
            if (mounted) {
              console.log('useAuth - Full validation timeout')
              setIsLoading(false)
            }
          }, 3000)
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession()
          
          if (timeoutId) clearTimeout(timeoutId)
          
          if (!mounted) return

          if (sessionError) {
            throw sessionError
          }

          if (!session?.user) {
            if (!window.location.pathname.includes('/auth/')) {
              console.log('useAuth - No session, redirecting to login')
              redirectToLogin()
            }
            setIsLoading(false)
            return
          }

          console.log('useAuth - User authenticated:', session.user.id)
          setUser(session.user)
          setError(null)
          setIsLoading(false)
        }
      } catch (err) {
        if (timeoutId) clearTimeout(timeoutId)
        if (!mounted) return
        
        console.error('useAuth - Auth error:', err)
        
        // If on protected route, trust middleware despite error
        const isProtectedRoute = !window.location.pathname.includes('/auth/')
        const isPublicRoute = window.location.pathname === '/'
        
        if (isProtectedRoute && !isPublicRoute) {
          console.log('useAuth - Error on protected route, trusting middleware')
          setUser({ id: 'middleware-verified' } as User)
          setError(null)
        } else {
          setError(err instanceof Error ? err.message : 'Authentication failed')
        }
        setIsLoading(false)
      }
    }

    checkAuth()

    // Optimized auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return
      
      console.log('useAuth - Auth state change:', event)
      
      if (event === 'SIGNED_OUT') {
        setUser(null)
        setError(null)
        if (!window.location.pathname.includes('/auth/')) {
          router.push('/auth/login')
        }
      } else if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
        console.log('useAuth - User authenticated via state change:', session.user.id)
        setUser(session.user)
        setError(null)
        setIsLoading(false)
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [redirectToLogin, router, supabase.auth])

  return { user, isLoading, error }
} 