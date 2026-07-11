import { PermissionGuard } from '@/components/guards/permission-guard'

export default function BillingPage() {
  return (
    <PermissionGuard requiredPermission="read:billing">
      <div>
        <h1 className="text-2xl font-bold mb-4">Billing</h1>
        <p className="text-gray-600">Halaman pembayaran dan langganan.</p>
      </div>
    </PermissionGuard>
  )
}