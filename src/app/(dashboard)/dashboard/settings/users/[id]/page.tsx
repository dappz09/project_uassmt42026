'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, UserCircle, Shield, Save, Crown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import Link from 'next/link'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { CustomSelect } from '@/components/ui/custom-select'

interface Role {
  id: string
  name: string
}

interface Subscription {
  id: string
  plan: string
  status: string
}

interface UserDetail {
  id: string
  name: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  country: string
  gender: string
  isActive: boolean
  roleId: string
  role?: Role
  subscription?: Subscription
}

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  
  const [formData, setFormData] = useState<UserDetail>({
    id: '',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    country: '',
    gender: '',
    isActive: true,
    roleId: ''
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, rolesRes] = await Promise.all([
          fetch(`/api/admin/users/${params.id}`),
          fetch('/api/admin/roles')
        ])

        const userJson = await userRes.json().catch(() => null)
        const rolesJson = await rolesRes.json().catch(() => null)

        if (userRes.ok && userJson?.success) {
          const u = userJson.data
          setFormData({
            id: u.id,
            name: u.name || '',
            email: u.email || '',
            phone: u.phone || '',
            address: u.address || '',
            city: u.city || '',
            province: u.province || '',
            country: u.country || '',
            gender: u.gender || '',
            isActive: u.isActive ?? true,
            roleId: u.roleId || '',
            subscription: u.subscription
          })
        } else {
          toast.error(userJson?.message || 'Gagal memuat detail pengguna')
          router.push('/dashboard/settings/users')
        }

        if (rolesRes.ok && rolesJson?.success) {
          setRoles(rolesJson.data)
        }
      } catch (error) {
        console.error(error)
        toast.error('Terjadi kesalahan jaringan')
      } finally {
        setLoading(false)
      }
    }
    
    if (params.id) {
      fetchData()
    }
  }, [params.id, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json().catch(() => null)
      
      if (res.ok && json?.success) {
        toast.success('Perubahan berhasil disimpan')
      } else {
        toast.error(json?.message || 'Gagal menyimpan perubahan')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <RequirePermission permission="read:users">
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/settings/users" className="p-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all">
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  {formData.name || 'Pengguna Tanpa Nama'}
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${
                    formData.isActive 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
                      : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  }`}>
                    {formData.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{formData.email}</p>
              </div>
            </div>
            
            <RequirePermission permission="update:users">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium"
              >
                <Save size={18} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
              </button>
            </RequirePermission>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Panel 1: Personal Info */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <UserCircle size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Informasi Pribadi</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email (Read Only)</label>
                  <input type="email" value={formData.email} readOnly className="w-full px-4 py-2.5 bg-gray-100 dark:bg-black/40 border border-gray-200 dark:border-white/5 rounded-xl text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Telepon</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Kelamin</label>
                  <CustomSelect 
                    value={formData.gender || ''}
                    onChange={(val) => setFormData(prev => ({ ...prev, gender: val }))}
                    options={[
                      { value: 'Laki-laki', label: 'Laki-laki' },
                      { value: 'Perempuan', label: 'Perempuan' }
                    ]}
                    placeholder="Pilih Jenis Kelamin"
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Lengkap</label>
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kota</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Provinsi</label>
                  <input type="text" name="province" value={formData.province} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Negara</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
              </div>
            </div>

            {/* Panel 2: Access & Subscription */}
            <div className="space-y-6">
              
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Shield size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Akses & Status</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Peran Jabatan (Role)</label>
                    <CustomSelect 
                      value={formData.roleId || ''}
                      onChange={(val) => setFormData(prev => ({ ...prev, roleId: val }))}
                      disabled={loadingRoles}
                      options={[
                        { value: '', label: 'User Biasa (Tanpa Role Khusus)' },
                        ...roles.map(r => ({ value: r.id, label: r.name }))
                      ]}
                      placeholder="Pilih Peran"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Menentukan hak akses pengguna di dalam sistem.</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white block">Status Akun</label>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Izinkan pengguna untuk login.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Crown size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Langganan (Premium)</h2>
                </div>
                
                {formData.subscription ? (
                  <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/20">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Paket Saat Ini</span>
                      <span className="px-2 py-1 text-xs font-bold rounded bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 uppercase tracking-wider">
                        {formData.subscription.plan}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                        {formData.subscription.status}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
                    Pengguna ini tidak memiliki langganan aktif.
                  </div>
                )}
              </div>

            </div>
          </div>

        </motion.div>
      </div>
    </RequirePermission>
  )
}
