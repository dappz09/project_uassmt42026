'use client'
import { motion } from 'framer-motion'
import { Key, Save, CreditCard, Mail, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'

interface ApiSettings {
  API_STRIPE_SECRET_KEY?: string
  API_STRIPE_WEBHOOK_SECRET?: string
  API_RESEND_KEY?: string
}

export default function ApiSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  
  // Standard Settings
  const [settings, setSettings] = useState<ApiSettings>({
    API_RESEND_KEY: ''
  })
  
  const [showKey, setShowKey] = useState({
    API_RESEND_KEY: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch General Settings
      const resSettings = await fetch('/api/admin/settings')
      const jsonSettings = await resSettings.json().catch(() => null)
      
      if (resSettings.ok && jsonSettings?.success) {
        const fetchedSettings = jsonSettings.data.reduce((acc: any, curr: any) => {
          acc[curr.key] = curr.value
          return acc
        }, {})

        setSettings({
          API_RESEND_KEY: fetchedSettings['API_RESEND_KEY'] || ''
        })
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat konfigurasi')
    } finally {
      setLoading(false)
    }
  }

  // Basic Settings handlers
  const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setSettings(prev => ({ ...prev, [name]: value }))
  }

  const toggleVisibility = (key: keyof typeof showKey) => {
    setShowKey(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    const toastId = toast.loading('Menyimpan pengaturan layanan...')
    
    try {
      const keysToSave = [
        { key: 'API_RESEND_KEY', value: settings.API_RESEND_KEY, description: 'Resend.com API Key for Email Delivery' }
      ]

      const promises = keysToSave.map(item => 
        fetch('/api/admin/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        })
      )

      await Promise.all(promises)
      toast.success('Pengaturan layanan berhasil disimpan!', { id: toastId })
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan layanan', { id: toastId })
    } finally {
      setSavingSettings(false)
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
    <RequirePermission 
      action="view" 
      resource="api" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin.</div>}
    >
      <div className="p-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Key size={24} className="text-purple-500" />
                Konfigurasi Integrasi & API
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kelola kunci integrasi pihak ketiga (*Third-Party Services*).</p>
            </div>
            
            <RequirePermission action="update" resource="api">
              <button 
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm"
              >
                <Save size={16} />
                <span>{savingSettings ? 'Menyimpan...' : 'Simpan Layanan'}</span>
              </button>
            </RequirePermission>
          </div>

          <div className="space-y-6">
            
            {/* Email Delivery: Resend */}
            <div className="bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Email Delivery</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Infrastruktur pengiriman email (SMTP/Resend).</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">Resend API Key</label>
                <div className="relative md:w-1/2">
                  <input 
                    type={showKey.API_RESEND_KEY ? "text" : "password"}
                    name="API_RESEND_KEY"
                    value={settings.API_RESEND_KEY}
                    onChange={handleSettingsChange}
                    placeholder="re_..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500/50 outline-none transition-all pr-12 font-mono text-sm"
                  />
                  <button 
                    onClick={() => toggleVisibility('API_RESEND_KEY')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showKey.API_RESEND_KEY ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </RequirePermission>
  )
}
