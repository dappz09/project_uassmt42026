'use client'

import { useSession } from 'next-auth/react'
import { AlertCircle } from 'lucide-react'

interface PermissionGuardProps {
  requiredPermission?: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function PermissionGuard({ requiredPermission, children, fallback }: PermissionGuardProps) {
  const { data: session } = useSession()
  const userPermissions = session?.user?.permissions || []

  if (!requiredPermission) {
    return <>{children}</>
  }

  const hasPermission = userPermissions.includes(requiredPermission) || userPermissions.includes('*:*')

  if (!hasPermission) {
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Akses Ditolak</h2>
          <p className="text-gray-500">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
        </div>
      )
    )
  }

  return <>{children}</>
}