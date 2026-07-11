'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus, Shield, Save } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CustomSelect } from '@/components/ui/custom-select'

interface Role {
  id: string
  name: string
}

export default function CreateUserPage() {
  const router = useRouter()
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<Role[]>([])
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
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
    const fetchRoles = async () => {
      try {
        const res = await fetch('/api/admin/roles')
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          setRoles(json.data)
        }
      } catch (error) {
        console.error(error)
      } finally {
        setLoadingRoles(false)
      }
    }
    fetchRoles()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as any
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      return toast.error('Nama, Email, dan Kata Sandi wajib diisi!')
    }
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json().catch(() => null)
      
      if (res.ok && json?.success) {
        toast.success('Pengguna baru berhasil ditambahkan!')
        router.push('/dashboard/settings/users')
      } else {
        toast.error(json?.message || 'Gagal menambahkan pengguna')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequirePermission action="create" resource="users">
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/settings/users" className="p-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all">
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Pengguna Baru</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Buat akun pengguna baru dan tetapkan akses mereka.</p>
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium"
            >
              <Save size={18} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Pengguna'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Panel 1: Personal Info */}
            <div className="lg:col-span-2 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <UserPlus size={20} />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Identitas & Autentikasi</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Misal: Budi Santoso" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Alamat Email <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="budi@example.com" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kata Sandi (Password) <span className="text-red-500">*</span></label>
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Minimal 8 karakter..." className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                
                <div className="md:col-span-2 border-t border-gray-100 dark:border-white/5 my-2 pt-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Informasi Tambahan (Opsional)</h3>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nomor Telepon</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="081234567890" className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Jenis Kelamin</label>
                  <CustomSelect 
                    value={formData.gender}
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
                  <textarea name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all resize-none" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Kota</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Negara</label>
                  <input type="text" name="country" value={formData.country} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all" />
                </div>
              </div>
            </div>

            {/* Panel 2: Access & Status */}
            <div className="space-y-6">
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Shield size={20} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Akses & Hak Istimewa</h2>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">Tentukan Peran (Role)</label>
                    <CustomSelect 
                      value={formData.roleId}
                      onChange={(val) => setFormData(prev => ({ ...prev, roleId: val }))}
                      disabled={loadingRoles}
                      options={[
                        { value: '', label: 'User Biasa (Tanpa Role Khusus)' },
                        ...roles.map(r => ({ value: r.id, label: r.name }))
                      ]}
                      placeholder="Pilih Peran"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Peran menentukan menu dan fitur apa saja yang bisa diakses oleh pengguna ini.</p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white block">Status Aktif</label>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Izinkan akun ini untuk segera login.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </RequirePermission>
  )
}
