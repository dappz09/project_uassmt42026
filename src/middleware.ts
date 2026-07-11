import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

type RouteConfig = {
  path: string
  roles?: string[]
  permissions?: string[]
}

const protectedRoutes: RouteConfig[] = [
  // SuperAdmin only - system settings
  { path: '/dashboard/settings', roles: ['SuperAdmin'] },
  { path: '/dashboard/roles', roles: ['SuperAdmin'] },
  { path: '/dashboard/permissions', roles: ['SuperAdmin'] },
  
  // Manager & SuperAdmin - user management
  { path: '/dashboard/users', roles: ['SuperAdmin', 'Manager'] },
  
  // All authenticated users
  { path: '/dashboard', roles: ['SuperAdmin', 'Manager', 'User'] },
  { path: '/dashboard/product', roles: ['SuperAdmin', 'Manager', 'User'] },
]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session
  const userRole = session?.user?.role || 'User'
  const userPermissions = session?.user?.permissions || []

  // Public routes - no login required
  const isPublicRoute = 
    nextUrl.pathname === '/' ||
    nextUrl.pathname === '/login' || 
    nextUrl.pathname === '/register' ||
    nextUrl.pathname === '/pricing' ||
    nextUrl.pathname.startsWith('/api/auth') ||
    nextUrl.pathname.startsWith('/api/register')

  if (isPublicRoute) {
    if (isLoggedIn && nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  // Protect /dashboard and /admin routes - must be logged in
  if (nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname.startsWith('/admin')) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
  }

  // Check role-based access
  const matchedRoute = protectedRoutes.find((route) => 
    nextUrl.pathname.startsWith(route.path)
  )

  if (matchedRoute) {
    // SuperAdmin bypasses all access controls
    if (userRole === 'SuperAdmin') {
      return NextResponse.next()
    }

    // Check role requirement
    if (matchedRoute.roles && !matchedRoute.roles.includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard/unauthorized', nextUrl))
    }

    // Check permission requirement
    if (matchedRoute.permissions) {
      const hasPermission = matchedRoute.permissions.some((perm) =>
        userPermissions.includes(perm) || userPermissions.includes('*:*')
      )
      if (!hasPermission) {
        return NextResponse.redirect(new URL('/dashboard/unauthorized', nextUrl))
      }
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}