import { PermissionGuard } from '@/components/guards/permission-guard'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <PermissionGuard requiredPermission="read:settings">
      <div>
        <h1 className="text-2xl font-bold mb-4">Settings</h1>
        <p className="text-gray-600 mb-6">Pengaturan akun dan sistem.</p>
        
        <div className="space-y-4">
          <Link 
            href="/dashboard/settings/profile" 
            className="block p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold">Profile</h2>
            <p className="text-sm text-gray-500">Ubah informasi profil Anda</p>
          </Link>
          
          <Link 
            href="/dashboard/settings/billing" 
            className="block p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
          >
            <h2 className="font-semibold">Billing</h2>
            <p className="text-sm text-gray-500">Kelola langganan dan pembayaran</p>
          </Link>
        </div>
      </div>
    </PermissionGuard>
  )
}