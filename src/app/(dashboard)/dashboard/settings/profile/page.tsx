'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { UserCircle, Save, Lock, Eye, EyeOff, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { CustomSelect } from '@/components/ui/custom-select'

export default function ProfileSettingsPage() {
  const { data: session, update } = useSession()
  const router = useRouter()

  // Profile State
  const [profile, setProfile] = useState({ 
    name: '', 
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    country: '',
    gender: '',
    isActive: true
  })
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password State
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/user/profile')
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          const d = json.data
          setProfile({ 
            name: d.name || '', 
            email: d.email || '',
            phone: d.phone || '',
            address: d.address || '',
            city: d.city || '',
            province: d.province || '',
            country: d.country || '',
            gender: d.gender || '',
            isActive: d.isActive ?? true
          })
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProfile(true)
    const toastId = toast.loading('Menyimpan profil...')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(json.message || 'Profil berhasil diperbarui', { id: toastId })
        // Update NextAuth session data client-side
        await update({ name: profile.name, email: profile.email })
        router.refresh()
      } else {
        toast.error(json?.message || 'Gagal menyimpan', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.new !== passwords.confirm) {
      toast.error('Konfirmasi kata sandi tidak cocok')
      return
    }

    setSavingPassword(true)
    const toastId = toast.loading('Memperbarui kata sandi...')

    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new
        })
      })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(json.message || 'Kata sandi berhasil diperbarui', { id: toastId })
        setPasswords({ current: '', new: '', confirm: '' })
        setShowPasswordForm(false) // Hide form on success
      } else {
        toast.error(json?.message || 'Gagal memperbarui', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setSavingPassword(false)
    }
  }

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }))
  }

  if (loadingProfile) {
    return <div className="p-8 text-center text-gray-500">Memuat profil...</div>
  }

  return (
    <div className="p-6 w-full max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Profil & Akun</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Kelola informasi identitas dan preferensi keamanan Anda.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Panel 1: Profil & Informasi Tambahan */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCircle size={20} className="text-purple-500" /> Informasi Dasar
                </h2>
                
                {/* Active Badge (Read Only) */}
                {profile.isActive ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-semibold uppercase tracking-wider">
                    <CheckCircle2 size={14} /> Akun Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold uppercase tracking-wider">
                    Akun Dinonaktifkan
                  </span>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-8 border-b border-gray-100 dark:border-white/10">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">Foto Profil</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Kami menggunakan inisial nama Anda sebagai avatar untuk saat ini.</p>
                </div>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-6">
                
                {/* 2-Column Grid for basic info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alamat Email</label>
                    <input 
                      type="email" 
                      required
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                      placeholder="nama@email.com"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nomor Telepon</label>
                    <input 
                      type="text" 
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                      placeholder="0812xxxxxxx"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Jenis Kelamin</label>
                    <CustomSelect 
                      value={profile.gender}
                      onChange={(val) => setProfile({ ...profile, gender: val })}
                      options={[
                        { value: 'Laki-laki', label: 'Laki-laki' },
                        { value: 'Perempuan', label: 'Perempuan' }
                      ]}
                      placeholder="Pilih Jenis Kelamin"
                    />
                  </div>
                </div>

                {/* Address block */}
                <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-4">Informasi Alamat</h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Alamat Lengkap</label>
                      <textarea 
                        value={profile.address}
                        onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all min-h-[80px]"
                        placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Kota / Kab.</label>
                        <input 
                          type="text" 
                          value={profile.city}
                          onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="Kota Anda"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Provinsi</label>
                        <input 
                          type="text" 
                          value={profile.province}
                          onChange={(e) => setProfile({ ...profile, province: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="Provinsi"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Negara</label>
                        <input 
                          type="text" 
                          value={profile.country}
                          onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                          placeholder="Indonesia"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button 
                    type="submit"
                    disabled={savingProfile}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm"
                  >
                    {savingProfile ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Simpan Perubahan Profil
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Panel 2: Keamanan */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden p-6 lg:p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Lock size={20} className="text-amber-500" /> Keamanan
                </h2>
              </div>
              
              {!showPasswordForm ? (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5 text-center">
                  <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mb-4">
                    <Lock size={20} />
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Kata Sandi Anda</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Ubah kata sandi secara berkala untuk menjaga keamanan akun Anda.</p>
                  
                  <button 
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center justify-center w-full gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 font-medium text-sm"
                  >
                    Ubah Kata Sandi <ChevronDown size={16} />
                  </button>
                </div>
              ) : (
                <AnimatePresence>
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <form onSubmit={handlePasswordSave} className="space-y-5">
                      {[
                        { id: 'current', label: 'Kata Sandi Saat Ini' },
                        { id: 'new', label: 'Kata Sandi Baru' },
                        { id: 'confirm', label: 'Konfirmasi Sandi Baru' }
                      ].map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{field.label}</label>
                          <div className="relative">
                            <input 
                              type={showPassword[field.id as keyof typeof showPassword] ? "text" : "password"}
                              required
                              value={passwords[field.id as keyof typeof passwords]}
                              onChange={(e) => setPasswords({ ...passwords, [field.id]: e.target.value })}
                              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all pr-12"
                              placeholder="••••••••"
                            />
                            <button 
                              type="button"
                              onClick={() => togglePasswordVisibility(field.id as keyof typeof showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              {showPassword[field.id as keyof typeof showPassword] ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className="pt-4 flex flex-col gap-3">
                        <button 
                          type="submit"
                          disabled={savingPassword}
                          className="flex w-full justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 font-medium text-sm"
                        >
                          {savingPassword ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock size={16} />}
                          Perbarui Kata Sandi
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false)
                            setPasswords({ current: '', new: '', confirm: '' })
                          }}
                          className="flex w-full justify-center items-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl transition-all font-medium text-sm"
                        >
                          Batal <ChevronUp size={16} />
                        </button>
                      </div>
                    </form>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
