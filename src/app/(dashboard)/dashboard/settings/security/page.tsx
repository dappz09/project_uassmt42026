'use client'
import { motion } from 'framer-motion'
import { Shield, Save, KeyRound, Lock, AlertCircle, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'

interface SecuritySettings {
  SECURITY_MFA_REQUIRED: boolean
  SECURITY_PASSWORD_STRENGTH: boolean
  SECURITY_SESSION_TIMEOUT: string
  SECURITY_MAX_LOGIN_ATTEMPTS: string
  SECURITY_AUTO_LOCK: boolean
}

export default function SecuritySettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<SecuritySettings>({
    SECURITY_MFA_REQUIRED: false,
    SECURITY_PASSWORD_STRENGTH: false,
    SECURITY_SESSION_TIMEOUT: '24h',
    SECURITY_MAX_LOGIN_ATTEMPTS: '5',
    SECURITY_AUTO_LOCK: true
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings')
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          // Convert flat array to object
          const fetchedSettings = json.data.reduce((acc: any, curr: any) => {
            acc[curr.key] = curr.value
            return acc
          }, {})

          setSettings({
            SECURITY_MFA_REQUIRED: fetchedSettings['SECURITY_MFA_REQUIRED'] === 'true',
            SECURITY_PASSWORD_STRENGTH: fetchedSettings['SECURITY_PASSWORD_STRENGTH'] === 'true',
            SECURITY_SESSION_TIMEOUT: fetchedSettings['SECURITY_SESSION_TIMEOUT'] || '24h',
            SECURITY_MAX_LOGIN_ATTEMPTS: fetchedSettings['SECURITY_MAX_LOGIN_ATTEMPTS'] || '5',
            SECURITY_AUTO_LOCK: fetchedSettings['SECURITY_AUTO_LOCK'] !== 'false' // default true if not set
          })
        }
      } catch (e) {
        console.error(e)
        toast.error('Gagal memuat pengaturan keamanan')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleToggle = (key: keyof SecuritySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const keysToSave = [
        { key: 'SECURITY_MFA_REQUIRED', value: String(settings.SECURITY_MFA_REQUIRED), description: 'Wajibkan Otentikasi Dua Faktor (2FA)' },
        { key: 'SECURITY_PASSWORD_STRENGTH', value: String(settings.SECURITY_PASSWORD_STRENGTH), description: 'Wajibkan Kata Sandi Kuat (Simbol & Angka)' },
        { key: 'SECURITY_SESSION_TIMEOUT', value: settings.SECURITY_SESSION_TIMEOUT, description: 'Batas Waktu Sesi Aktif' },
        { key: 'SECURITY_MAX_LOGIN_ATTEMPTS', value: settings.SECURITY_MAX_LOGIN_ATTEMPTS, description: 'Maksimal Percobaan Login Gagal' },
        { key: 'SECURITY_AUTO_LOCK', value: String(settings.SECURITY_AUTO_LOCK), description: 'Kunci Otomatis Jika Gagal Login Beruntun' },
      ]

      const promises = keysToSave.map(item => 
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
      )

      await Promise.all(promises)
      toast.success('Pengaturan keamanan berhasil disimpan dan langsung diterapkan!')
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan')
    } finally {
      setSaving(false)
    }
  }

  // Calculate Security Score
  const getSecurityScore = () => {
    let score = 0
    if (settings.SECURITY_MFA_REQUIRED) score += 30
    if (settings.SECURITY_PASSWORD_STRENGTH) score += 30
    if (settings.SECURITY_AUTO_LOCK) score += 20
    if (settings.SECURITY_MAX_LOGIN_ATTEMPTS === '3' || settings.SECURITY_MAX_LOGIN_ATTEMPTS === '5') score += 10
    if (settings.SECURITY_SESSION_TIMEOUT !== '7d') score += 10
    return score
  }

  const score = getSecurityScore()
  let scoreColor = 'text-red-500'
  if (score >= 80) scoreColor = 'text-emerald-500'
  else if (score >= 50) scoreColor = 'text-amber-500'

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <RequirePermission 
      action="view" 
      resource="security" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin.</div>}
    >
      <div className="p-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Keamanan Sistem</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Konfigurasi perlindungan dan kebijakan akses tingkat server.</p>
            </div>
            
            <RequirePermission action="update" resource="security">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm"
              >
                <Save size={16} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}</span>
              </button>
            </RequirePermission>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Health Score Panel */}
            <div className="lg:col-span-1 bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl flex flex-col items-center justify-center">
               <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-gray-100 dark:border-white/5 mb-4">
                  <div className={`text-4xl font-bold ${scoreColor}`}>{score}</div>
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" className={`text-gray-200 dark:text-gray-800`} />
                    <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="8" 
                      strokeDasharray={`${(score / 100) * 289} 289`} 
                      className={score >= 80 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-red-500'} 
                      strokeLinecap="round" />
                  </svg>
               </div>
               <h3 className="font-semibold text-gray-900 dark:text-white">Skor Keamanan</h3>
               <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                 {score >= 80 ? 'Sistem Anda memiliki proteksi maksimal.' : 'Beberapa fitur keamanan kritis belum diaktifkan.'}
               </p>
            </div>

            {/* Config Panels */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Access Policies */}
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <KeyRound size={16} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kebijakan Akses</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white block">Wajibkan Otentikasi Dua Faktor (2FA)</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Memaksa semua peran manajerial untuk mengaktifkan 2FA.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.SECURITY_MFA_REQUIRED} onChange={() => handleToggle('SECURITY_MFA_REQUIRED')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-900 dark:text-white block">Kewajiban Kata Sandi Kuat</label>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Menolak kata sandi yang tidak memiliki minimal 8 karakter, 1 angka, dan 1 simbol.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={settings.SECURITY_PASSWORD_STRENGTH} onChange={() => handleToggle('SECURITY_PASSWORD_STRENGTH')} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Session Management */}
              <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                    <Lock size={16} />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manajemen Sesi & *Lockout*</h2>
                </div>

                <div className="space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white block flex items-center gap-2"><Clock size={14} /> Batas Waktu Sesi Aktif</label>
                      <select name="SECURITY_SESSION_TIMEOUT" value={settings.SECURITY_SESSION_TIMEOUT} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none">
                        <option value="15m">15 Menit</option>
                        <option value="1h">1 Jam</option>
                        <option value="24h">24 Jam</option>
                        <option value="7d">7 Hari</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900 dark:text-white block flex items-center gap-2"><AlertCircle size={14} /> Maks. Percobaan Login</label>
                      <input type="number" name="SECURITY_MAX_LOGIN_ATTEMPTS" min="3" max="20" value={settings.SECURITY_MAX_LOGIN_ATTEMPTS} onChange={handleChange} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all" />
                    </div>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-900 dark:text-white block">Kunci Otomatis (*Auto Lock*)</label>
                        <span className="text-xs text-gray-500 dark:text-gray-400 block mt-0.5">Blokir IP/Akun jika batas maksimal percobaan login tercapai.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={settings.SECURITY_AUTO_LOCK} onChange={() => handleToggle('SECURITY_AUTO_LOCK')} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
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
