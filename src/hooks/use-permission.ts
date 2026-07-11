'use client'

import { useSession } from 'next-auth/react'

export function usePermission() {
  const { data: session } = useSession()
  const permissions = session?.user?.permissions || []

  const hasPermission = (action: string, resource: string) => {
    // Optional: SuperAdmin bypasses all
    if (session?.user?.role === 'SuperAdmin') return true
    
    return permissions.includes(`${action}:${resource}`)
  }

  const hasAnyPermission = (requiredPermissions: Array<{ action: string, resource: string }>) => {
    if (session?.user?.role === 'SuperAdmin') return true
    return requiredPermissions.some(req => permissions.includes(`${req.action}:${req.resource}`))
  }

  const hasAllPermissions = (requiredPermissions: Array<{ action: string, resource: string }>) => {
    if (session?.user?.role === 'SuperAdmin') return true
    return requiredPermissions.every(req => permissions.includes(`${req.action}:${req.resource}`))
  }

  return { hasPermission, hasAnyPermission, hasAllPermissions, permissions }
}
