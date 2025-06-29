// middleware.ts - Simplified and robust version
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Skip middleware for static files and API routes
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.includes('.')
  ) {
    return res
  }

  // Define routes
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/callback', '/auth/verify-email']
  const publicRoutes = ['/']
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  try {
    // Simple auth check without timeout
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    // Handle authentication errors or missing user
    if (authError || !user) {
      // Allow access to auth routes and public routes
      if (!isAuthRoute && !isPublicRoute) {
        const redirectUrl = new URL('/auth/login', req.url)
        return NextResponse.redirect(redirectUrl)
      }
      return res
    }

    // User is authenticated
    console.log('Middleware - Authenticated user access:', {
      userId: user.id,
      pathname: req.nextUrl.pathname
    })

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && !req.nextUrl.pathname.startsWith('/auth/business-setup')) {
      return NextResponse.redirect(new URL('/reports', req.url))
    }

    // Allow access to business setup route
    if (req.nextUrl.pathname.startsWith('/auth/business-setup')) {
      return res
    }

    // Simple business check for protected routes
    if (!isAuthRoute && !isPublicRoute) {
      try {
        const { data: business } = await supabase
          .from('businesses')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!business) {
          return NextResponse.redirect(new URL('/auth/business-setup', req.url))
        }
      } catch (businessError) {
        // If business check fails, allow access to prevent loops
        console.log('Business check failed, allowing access')
      }
    }

    return res

  } catch (error) {
    console.log('Middleware error:', error)
    // On any error, allow access to prevent loops
    return res
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
