'use client'

import { usePermission } from '@/hooks/use-permission'
import { ReactNode } from 'react'

interface RequirePermissionProps {
  action: string
  resource: string
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ action, resource, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission } = usePermission()

  if (!hasPermission(action, resource)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
