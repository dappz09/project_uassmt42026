import { PermissionGuard } from '@/components/guards/permission-guard'

export default function ProfilePage() {
  return (
    <PermissionGuard requiredPermission="read:profile">
      <div>
        <h1 className="text-2xl font-bold mb-4">Profile</h1>
        <p className="text-gray-600">Halaman profil pengguna.</p>
      </div>
    </PermissionGuard>
  )
}