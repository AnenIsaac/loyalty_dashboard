// middleware.ts (in root directory)
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cache key for business check - using a more secure approach
const BUSINESS_CHECK_CACHE_KEY = 'sb-biz-check'
const AUTH_CHECK_CACHE_KEY = 'sb-auth-check'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Skip middleware for non-page requests and static files
  const isPageRequest = req.nextUrl.pathname.match(/\.[^/]+$/) === null
  if (!isPageRequest) {
    return res
  }

  // Define auth routes
  const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password', '/auth/callback']
  const publicRoutes = ['/']
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  // Check auth cache first
  const authCheckCookie = req.cookies.get(AUTH_CHECK_CACHE_KEY)
  let cachedAuthCheck = null
  
  try {
    cachedAuthCheck = authCheckCookie?.value 
      ? JSON.parse(authCheckCookie.value) 
      : null
  } catch (error) {
    console.error('Error parsing auth check cache:', error)
    res.cookies.delete(AUTH_CHECK_CACHE_KEY)
  }

  // Use cached auth result if valid and recent (1 minute)
  const ONE_MINUTE = 60 * 1000
  const isAuthCacheValid = cachedAuthCheck?.timestamp 
    && (Date.now() - cachedAuthCheck.timestamp < ONE_MINUTE)

  if (isAuthCacheValid) {
    // If cached as authenticated and trying to access auth routes, redirect away
    if (cachedAuthCheck.isAuthenticated && isAuthRoute) {
      return NextResponse.redirect(new URL('/reports', req.url))
    }
    
    if (!cachedAuthCheck.isAuthenticated && !isAuthRoute && !isPublicRoute) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    return res
  }

  // Validate user session using getUser() for proper JWT verification
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  // Cache auth result
  const authCheckResult = {
    isAuthenticated: !!user,
    timestamp: Date.now()
  }
  
  res.cookies.set({
    name: AUTH_CHECK_CACHE_KEY,
    value: JSON.stringify(authCheckResult),
    path: '/',
    maxAge: 60, // 1 minute
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  // Handle authentication errors or missing user
  if (authError || !user) {
    // Only clear session cookies if there's an actual error
    if (authError) {
      console.log('Auth validation failed:', authError.message)
      res.cookies.delete('sb-access-token')
      res.cookies.delete('sb-refresh-token')
    }
    
    // Allow access to auth routes and public routes only
    if (!isAuthRoute && !isPublicRoute) {
      const redirectUrl = new URL('/auth/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
    
    return res
  }

  // User is authenticated beyond this point
  console.log('Middleware - Authenticated user access:', {
    userId: user.id,
    pathname: req.nextUrl.pathname
  })

  // Set a hint for client-side to know middleware validated auth
  res.headers.set('x-middleware-auth', 'validated')

  // If trying to access auth routes while authenticated, redirect to reports
  if (isAuthRoute) {
    return NextResponse.redirect(new URL('/reports', req.url))
  }

  // Skip business check for business setup route to prevent redirect loops
  if (req.nextUrl.pathname.startsWith('/auth/business-setup')) {
    return res
  }

  // Check cached business status
  const businessCheckCookie = req.cookies.get(BUSINESS_CHECK_CACHE_KEY)
  let cachedBusinessCheck = null
  
  try {
    cachedBusinessCheck = businessCheckCookie?.value 
      ? JSON.parse(businessCheckCookie.value) 
      : null
  } catch (error) {
    console.error('Error parsing business check cache:', error)
    res.cookies.delete(BUSINESS_CHECK_CACHE_KEY)
  }

  // Use cached result if valid and recent (2 minutes)
  const TWO_MINUTES = 2 * 60 * 1000
  const isCacheValid = cachedBusinessCheck?.timestamp 
    && (Date.now() - cachedBusinessCheck.timestamp < TWO_MINUTES)
    && cachedBusinessCheck.userId === user.id

  if (isCacheValid) {
    if (!cachedBusinessCheck.hasBusiness) {
      return NextResponse.redirect(new URL('/auth/business-setup', req.url))
    }
    return res
  }

  // Perform fresh business check
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id, status, name, user_id')
    .eq('user_id', user.id)
    .single()

  // Handle database errors
  if (businessError && businessError.code !== 'PGRST116') {
    console.error('Error fetching business data:', businessError)
    return res
  }

  // Cache the business check result
  const businessCheckResult = {
    userId: user.id,
    hasBusiness: !!business,
    status: business?.status || null,
    timestamp: Date.now()
  }
  
  res.cookies.set({
    name: BUSINESS_CHECK_CACHE_KEY,
    value: JSON.stringify(businessCheckResult),
    path: '/',
    maxAge: 120, // 2 minutes
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  })

  // Redirect to business setup if no business exists
  if (!business) {
    return NextResponse.redirect(new URL('/auth/business-setup', req.url))
  }

  return res
}

export const config = {
  matcher: [
    // Match all request paths except for the ones starting with:
    // - _next/static (static files)
    // - _next/image (image optimization files)
    // - favicon.ico (favicon file)
    // - public/
    // - api/
    // - _next/
    '/((?!_next/static|_next/image|favicon.ico|public/|api/|_next/).*)',
  ],
}