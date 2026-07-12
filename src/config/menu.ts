export interface MenuItem {
  title: string
  href: string
  icon: string
  permission?: string
  children?: MenuItem[]
}

export const menuConfig: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: 'LayoutDashboard',
    permission: 'view:users', // Only Admin & Manager have view:users
  },
  {
    title: 'Buat Catatan',
    href: '/dashboard/create',
    icon: 'Wand2',
  },
  {
    title: 'Riwayat Catatan',
    href: '/dashboard/history',
    icon: 'History',
  },
  {
    title: 'Penggunaan Limit',
    href: '/dashboard/usage',
    icon: 'BarChart3',
  },
  {
    title: 'Pengaturan',
    href: '/dashboard/settings',
    icon: 'Settings',
    children: [
      { title: 'Profil & Akun', href: '/dashboard/settings/profile', icon: 'UserCircle' },
      { title: 'Manajemen Pengguna', href: '/dashboard/settings/users', icon: 'Users', permission: 'view:users' },
      { title: 'Peran & Hak Akses', href: '/dashboard/settings/roles', icon: 'Lock', permission: 'view:roles' },
      { title: 'Keamanan Sistem', href: '/dashboard/settings/security', icon: 'Shield', permission: 'view:settings' },
      { title: 'Katalog AI', href: '/dashboard/settings/ai-catalog', icon: 'Library', permission: 'view:settings' },
      { title: 'Model & Mesin AI', href: '/dashboard/settings/ai-models', icon: 'Sparkles', permission: 'view:settings' },
      { title: 'Konfigurasi API', href: '/dashboard/settings/api', icon: 'Key', permission: 'view:settings' },
      { title: 'Log Aktivitas', href: '/dashboard/settings/audit-logs', icon: 'Activity', permission: 'view:settings' },
      { title: 'Paket & Fitur', href: '/dashboard/settings/plans', icon: 'Package', permission: 'view:settings' },
      { title: 'Metode Pembayaran', href: '/dashboard/settings/payment-methods', icon: 'CreditCard', permission: 'view:settings' },
      { title: 'Transaksi & Pendapatan', href: '/dashboard/settings/transactions', icon: 'Receipt', permission: 'view:settings' },
      { title: 'Kode Promo', href: '/dashboard/settings/promos', icon: 'Ticket', permission: 'view:settings' },
    ]
  },
]
