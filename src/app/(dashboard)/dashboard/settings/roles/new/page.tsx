'use client'

import { motion } from 'framer-motion'
import { ArrowLeft, ShieldPlus, Save } from 'lucide-react'
import { useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function CreateRolePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    if (!formData.name) {
      return toast.error('Nama peran wajib diisi!')
    }
    
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/roles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const json = await res.json().catch(() => null)
      
      if (res.ok && json?.success) {
        toast.success('Peran baru berhasil diciptakan!')
        router.push('/dashboard/settings/roles')
      } else {
        toast.error(json?.message || 'Gagal menambahkan peran')
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <RequirePermission action="create" resource="roles">
      <div className="p-6 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/settings/roles" className="p-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl transition-all">
                <ArrowLeft size={20} className="text-gray-600 dark:text-gray-300" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tambah Peran Baru</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Ciptakan peran kustom untuk menetapkan hak akses spesifik.</p>
              </div>
            </div>
            
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium"
            >
              <Save size={18} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Peran'}</span>
            </button>
          </div>

          <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <ShieldPlus size={20} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Detail Peran</h2>
            </div>

            <div className="space-y-5 max-w-2xl">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nama Peran <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Misal: Editor, Staff HRD, Kasir" 
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Gunakan nama yang jelas dan mendeskripsikan tanggung jawab peran ini.</p>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Deskripsi (Opsional)</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows={3} 
                  placeholder="Jelaskan apa yang bisa dilakukan oleh peran ini..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none" 
                />
              </div>
            </div>
            
            <div className="mt-8 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Catatan:</strong> Setelah peran berhasil dibuat, Anda akan diarahkan kembali ke tabel. Anda bisa mengatur hak izin (*Permissions*) secara terperinci (misal: "Bisa melihat pengguna", "Bisa menghapus catatan") dengan mengklik tombol "Detail Peran" (Ikon Mata) pada baris peran tersebut di tabel utama.
              </p>
            </div>
            
          </div>

        </motion.div>
      </div>
    </RequirePermission>
  )
}
