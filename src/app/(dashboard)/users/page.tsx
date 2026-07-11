import { PermissionGuard } from '@/components/guards/permission-guard'

export default function UsersPage() {
  return (
    <PermissionGuard requiredPermission="read:users">
      <div>
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <p className="text-gray-600">Halaman manajemen users.</p>
      </div>
    </PermissionGuard>
  )
}