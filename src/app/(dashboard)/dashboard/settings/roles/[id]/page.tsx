'use client'
import { motion } from 'framer-motion'
import { ArrowLeft, Save, ShieldAlert, Check, List, Eye, Plus, Edit2, Trash2, Search, Settings } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import Link from 'next/link'
import { toast } from 'sonner'
import { useParams } from 'next/navigation'

export default function RoleDetailPage() {
  const params = useParams()
  const roleId = params.id as string

  const [role, setRole] = useState<any>(null)
  const [allPermissions, setAllPermissions] = useState<any[]>([])
  const [activePermissions, setActivePermissions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const roleRes = await fetch(`/api/admin/roles/${roleId}`)
        const roleJson = await roleRes.json().catch(() => null)
        if (roleRes.ok && roleJson?.success) {
          setRole(roleJson.data)
        }

        const permRes = await fetch(`/api/admin/roles/${roleId}/permissions`)
        const permJson = await permRes.json().catch(() => null)
        if (permRes.ok && permJson?.success) {
          setAllPermissions(permJson.data.allPermissions)
          setActivePermissions(new Set(permJson.data.assignedPermissionIds))
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [roleId])

  const handleToggle = (permissionId: string) => {
    if (role?.name === 'SuperAdmin') {
      toast.error('Hak akses SuperAdmin tidak dapat diubah!')
      return
    }

    setActivePermissions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId)
      } else {
        newSet.add(permissionId)
      }
      return newSet
    })
  }

  const handleSave = async () => {
    if (role?.name === 'SuperAdmin') {
      toast.error('Hak akses SuperAdmin tidak dapat diubah!')
      return
    }

    setSaving(true)
    const toastId = toast.loading('Menyimpan hak akses...')
    
    try {
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permissionIds: Array.from(activePermissions)
        })
      })
      const json = await res.json().catch(() => null)
      
      if (res.ok && json?.success) {
        toast.success(json.message || 'Permission tersimpan', { id: toastId })
      } else {
        toast.error(json?.message || 'Gagal menyimpan', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const getActionConfig = (action: string) => {
    switch (action.toLowerCase()) {
      case 'view': return { label: 'Lihat Daftar', icon: <List size={16} className="text-blue-500" /> }
      case 'show': return { label: 'Lihat Detail', icon: <Eye size={16} className="text-teal-500" /> }
      case 'create': return { label: 'Tambah Baru', icon: <Plus size={16} className="text-green-500" /> }
      case 'update': return { label: 'Ubah Data', icon: <Edit2 size={16} className="text-amber-500" /> }
      case 'delete': return { label: 'Hapus Data', icon: <Trash2 size={16} className="text-red-500" /> }
      case 'lookup': return { label: 'Pencarian', icon: <Search size={16} className="text-purple-500" /> }
      default: return { label: action, icon: <Settings size={16} className="text-gray-500" /> }
    }
  }

  const getResourceLabel = (res: string) => {
    const map: Record<string, string> = {
      dashboard: 'Dasbor (Dashboard)',
      users: 'Manajemen Pengguna (Users)',
      roles: 'Manajemen Peran (Roles)',
      permissions: 'Hak Akses Sistem',
      notes: 'Catatan Video AI (Notes)',
      plans: 'Paket Langganan (Plans)',
      transactions: 'Riwayat Pembayaran (Transactions)',
      settings: 'Pengaturan Sistem (Settings)',
      promocodes: 'Promo & Diskon (Promocodes)',
      usagerecords: 'Penggunaan Limit (Usage Records)'
    }
    return map[res] || res
  }

  const getActionDesc = (action: string, res: string) => {
    switch(action.toLowerCase()) {
      case 'view': return `Bisa mengakses halaman daftar utama`
      case 'show': return `Bisa melihat profil/detail spesifik`
      case 'create': return `Bisa membuat data entri baru`
      case 'update': return `Bisa memodifikasi data yang ada`
      case 'delete': return `Bisa menghapus data secara permanen`
      case 'lookup': return `Bisa menggunakan fitur filter/cari`
      default: return `Aksi ${action} pada ${res}`
    }
  }

  // Group permissions by resource for easier viewing
  const groupedPermissions = allPermissions.reduce((acc: any, perm: any) => {
    if (!acc[perm.resource]) acc[perm.resource] = []
    acc[perm.resource].push(perm)
    return acc
  }, {})

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat detail peran...</div>
  }

  if (!role) {
    return <div className="p-8 text-center text-red-500">Peran tidak ditemukan.</div>
  }

  const isSuperAdmin = role.name === 'SuperAdmin'

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <RequirePermission 
        action="show" 
        resource="roles" 
        fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak.</div>}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="mb-6 flex items-center gap-4">
            <Link href="/dashboard/settings/roles" className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Detail Peran: {role.name}</h1>
                {isSuperAdmin && (
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-full text-xs font-semibold flex items-center gap-1">
                    <ShieldAlert size={14} /> Full Access
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{role.description || 'Tidak ada deskripsi'}</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Konfigurasi Hak Akses (Permissions)</h2>
              <RequirePermission action="update" resource="roles">
                <button 
                  onClick={handleSave}
                  disabled={saving || isSuperAdmin}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                  Simpan Permission
                </button>
              </RequirePermission>
            </div>

            {isSuperAdmin ? (
              <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex items-start gap-4">
                <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="font-semibold text-amber-900 dark:text-amber-200 mb-1">SuperAdmin Memiliki Akses Penuh</h3>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Peran SuperAdmin tidak memerlukan konfigurasi manual. Peran ini selalu memiliki akses tak terbatas ke seluruh sistem (`*:*`).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedPermissions).map(([resource, perms]: [string, any]) => (
                  <div key={resource} className="border border-gray-100 dark:border-white/5 rounded-xl p-5 bg-gray-50/50 dark:bg-black/20">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      {getResourceLabel(resource)}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {perms.map((perm: any) => {
                        const isOn = activePermissions.has(perm.id)
                        const config = getActionConfig(perm.action)
                        const customDesc = getActionDesc(perm.action, resource)
                        
                        return (
                          <div key={perm.id} className="flex flex-col p-4 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-xl hover:border-purple-300 dark:hover:border-purple-500/50 transition-colors shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 rounded-md bg-gray-100 dark:bg-black/30">
                                  {config.icon}
                                </div>
                                <div className="font-semibold text-sm text-gray-900 dark:text-white">{config.label}</div>
                              </div>
                              <button
                                onClick={() => handleToggle(perm.id)}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                                  isOn ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                                role="switch"
                                aria-checked={isOn}
                              >
                                <span className="sr-only">Toggle {perm.action} {perm.resource}</span>
                                <span
                                  aria-hidden="true"
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out ${
                                    isOn ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 pl-[38px]">
                              {customDesc}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
          </div>
        </motion.div>
      </RequirePermission>
    </div>
  )
}
