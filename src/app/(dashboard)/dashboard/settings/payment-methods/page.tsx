'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { CreditCard, Plus, Trash2, Edit, Check, X, ShieldAlert, ShieldCheck, Key, ChevronDown, CheckSquare, Square } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'

interface PaymentGateway {
  id: string
  name: string
  providerName: string
  apiKey: string | null
  publicApiKey: string | null
  webhookUrl: string | null
  isProduction: boolean
  isActive: boolean
  instructions: string | null
  activeChannels?: string | null
}

const AVAILABLE_CHANNELS: Record<string, string[]> = {
  midtrans: ['qris', 'gopay', 'shopeepay', 'bca_va', 'mandiri_va', 'bni_va', 'bri_va', 'credit_card', 'alfamart', 'indomaret'],
  xendit: ['qris', 'ovo', 'dana', 'linkaja', 'bca_va', 'mandiri_va', 'bni_va', 'bri_va', 'credit_card', 'alfamart'],
  stripe: ['credit_card', 'google_pay', 'apple_pay'],
  paypal: ['paypal_balance', 'credit_card'],
  manual: ['bank_transfer'],
  custom: ['custom_channel']
}

const CHANNEL_LABELS: Record<string, string> = {
  qris: 'QRIS',
  gopay: 'GoPay',
  shopeepay: 'ShopeePay',
  ovo: 'OVO',
  dana: 'DANA',
  linkaja: 'LinkAja',
  bca_va: 'BCA Virtual Account',
  mandiri_va: 'Mandiri Virtual Account',
  bni_va: 'BNI Virtual Account',
  bri_va: 'BRI Virtual Account',
  credit_card: 'Kartu Kredit',
  alfamart: 'Alfamart',
  indomaret: 'Indomaret',
  google_pay: 'Google Pay',
  apple_pay: 'Apple Pay',
  paypal_balance: 'Saldo PayPal',
  bank_transfer: 'Transfer Bank Manual',
  custom_channel: 'Kanal Kustom'
}

export default function PaymentMethodsPage() {
  const [loading, setLoading] = useState(true)
  const [gateways, setGateways] = useState<PaymentGateway[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState<PaymentGateway | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    providerName: 'midtrans', // default
    apiKey: '',
    publicApiKey: '',
    webhookUrl: '',
    isProduction: false,
    isActive: true,
    instructions: '',
    activeChannels: [] as string[]
  })
  const [saving, setSaving] = useState(false)

  const providers = [
    { id: 'midtrans', name: 'Midtrans' },
    { id: 'xendit', name: 'Xendit' },
    { id: 'stripe', name: 'Stripe' },
    { id: 'manual', name: 'Manual Bank Transfer' },
    { id: 'paypal', name: 'PayPal' },
    { id: 'custom', name: 'Custom Gateway' }
  ]

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/payment-gateways')
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setGateways(json.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat metode pembayaran')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (gateway?: PaymentGateway) => {
    if (gateway) {
      setEditingGateway(gateway)
      let parsedChannels: string[] = []
      try {
        if (gateway.activeChannels) parsedChannels = JSON.parse(gateway.activeChannels)
      } catch (e) {}

      setFormData({
        name: gateway.name,
        providerName: gateway.providerName,
        apiKey: gateway.apiKey || '',
        publicApiKey: gateway.publicApiKey || '',
        webhookUrl: gateway.webhookUrl || '',
        isProduction: gateway.isProduction,
        isActive: gateway.isActive,
        instructions: gateway.instructions || '',
        activeChannels: parsedChannels
      })
    } else {
      setEditingGateway(null)
      setFormData({
        name: '',
        providerName: 'midtrans',
        apiKey: '',
        publicApiKey: '',
        webhookUrl: '',
        isProduction: false,
        isActive: true,
        instructions: '',
        activeChannels: AVAILABLE_CHANNELS['midtrans'] || [] // Default all active
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingGateway(null)
  }

  const toggleChannel = (channel: string) => {
    setFormData(prev => ({
      ...prev,
      activeChannels: prev.activeChannels.includes(channel)
        ? prev.activeChannels.filter(c => c !== channel)
        : [...prev.activeChannels, channel]
    }))
  }

  const handleProviderChange = (providerId: string) => {
    setFormData({
      ...formData,
      providerName: providerId,
      activeChannels: AVAILABLE_CHANNELS[providerId] || [] // reset channels to default all on change
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Nama Metode Pembayaran wajib diisi')
    if (formData.providerName !== 'manual' && !formData.apiKey) {
      if (!confirm('Server Key / Secret Key kosong. Metode pembayaran otomatis mungkin tidak akan berfungsi. Tetap simpan?')) return
    }

    setSaving(true)
    const toastId = toast.loading('Menyimpan metode pembayaran...')

    try {
      const url = editingGateway ? `/api/admin/payment-gateways/${editingGateway.id}` : '/api/admin/payment-gateways'
      const method = editingGateway ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(editingGateway ? 'Diperbarui' : 'Ditambahkan', { id: toastId })
        fetchData()
        closeModal()
      } else {
        toast.error(json?.message || 'Gagal menyimpan', { id: toastId })
      }
    } catch (error) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus gateway ${name}? Ini akan memutuskan integrasi pembayaran yang menggunakannya.`)) return
    
    const toastId = toast.loading('Menghapus gateway...')
    try {
      const res = await fetch(`/api/admin/payment-gateways/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success('Gateway dihapus', { id: toastId })
        setGateways(prev => prev.filter(g => g.id !== id))
      } else {
        toast.error(json?.message || 'Gagal menghapus', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
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
      resource="billing" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin.</div>}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <CreditCard size={24} className="text-purple-500" />
                Metode Pembayaran (Gateways)
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Atur integrasi kunci API pembayaran (Midtrans, Xendit, Stripe, dll).</p>
            </div>
            
            <RequirePermission action="update" resource="billing">
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm"
              >
                <Plus size={16} />
                <span>Tambah Gateway</span>
              </button>
            </RequirePermission>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gateways.map((gw) => {
              let parsedChannels: string[] = []
              try { if (gw.activeChannels) parsedChannels = JSON.parse(gw.activeChannels) } catch (e) {}

              return (
                <div key={gw.id} className={`relative flex flex-col bg-white dark:bg-zinc-900/80 border ${!gw.isActive ? 'border-dashed border-gray-300 dark:border-gray-700 opacity-70' : 'border-gray-200 dark:border-white/10'} rounded-3xl p-6 shadow-sm overflow-hidden`}>
                  
                  {/* Active/Inactive Badge */}
                  {!gw.isActive && (
                    <div className="absolute top-4 right-4 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Nonaktif
                    </div>
                  )}

                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">{gw.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize flex items-center gap-1.5 mt-1">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      {gw.providerName}
                    </p>
                  </div>

                  {/* Mode Indicator */}
                  <div className={`mt-2 mb-4 p-3 rounded-xl border flex items-center gap-3 ${gw.isProduction ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-500/30 text-red-700 dark:text-red-400' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30 text-blue-700 dark:text-blue-400'}`}>
                    {gw.isProduction ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider">{gw.isProduction ? 'Production / Live Mode' : 'Sandbox / Test Mode'}</p>
                      <p className="text-[10px] opacity-80">{gw.isProduction ? 'Pembayaran Uang Asli Aktif' : 'Mode Uji Coba Tanpa Uang Asli'}</p>
                    </div>
                  </div>

                  {/* Active Channels Chips */}
                  {parsedChannels.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {parsedChannels.map(c => (
                        <span key={c} className="bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 text-[10px] font-semibold px-2 py-1 rounded-md">
                          {CHANNEL_LABELS[c] || c}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex-1 space-y-3 mb-6">
                    {gw.providerName !== 'manual' && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-white/5 pt-3">
                        <Key size={14} className="text-gray-400" />
                        <span>API Keys: {gw.apiKey ? <span className="text-purple-600 dark:text-purple-400 font-medium">Terisi (Rahasia)</span> : <span className="text-red-500 font-medium italic">Kosong</span>}</span>
                      </div>
                    )}
                    {gw.webhookUrl && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate pt-1">
                        Webhook: <span className="font-mono">{gw.webhookUrl}</span>
                      </div>
                    )}
                  </div>

                  <RequirePermission action="update" resource="billing">
                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                      <button 
                        onClick={() => openModal(gw)}
                        className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Edit size={16} /> Konfigurasi
                      </button>
                      <button 
                        onClick={() => handleDelete(gw.id, gw.name)}
                        className="flex-none flex justify-center items-center w-12 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </RequirePermission>

                </div>
              )
            })}

            {gateways.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                <CreditCard size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada Gateway Pembayaran</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Tambahkan gateway untuk mulai menerima uang dari pelanggan.</p>
                <button 
                  onClick={() => openModal()}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-500/20"
                >
                  Hubungkan Gateway
                </button>
              </div>
            )}
          </div>

        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-white/10 my-8 flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 rounded-t-3xl z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CreditCard size={20} className="text-purple-500" />
                  {editingGateway ? 'Konfigurasi Gateway' : 'Gateway Baru'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-white/10 w-8 h-8 flex justify-center items-center rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="gateway-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Nama Tampilan (UI) *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Misal: Pembayaran Otomatis via Midtrans"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Penyedia Layanan (Provider)</label>
                      <div className="relative">
                        <select 
                          value={formData.providerName}
                          onChange={e => handleProviderChange(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm appearance-none pr-10 cursor-pointer"
                        >
                          {providers.map(p => (
                            <option key={p.id} value={p.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">{p.name}</option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <ChevronDown size={18} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.providerName !== 'manual' && (
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-500/20 rounded-2xl p-5 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-2 block">Server Key / Secret Key</label>
                        <input 
                          type="password"
                          value={formData.apiKey}
                          onChange={e => setFormData({...formData, apiKey: e.target.value})}
                          placeholder="Kunci rahasia untuk koneksi server"
                          className="w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm font-mono placeholder:font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-2 block">Client Key / Public Key (Opsional)</label>
                        <input 
                          type="text"
                          value={formData.publicApiKey}
                          onChange={e => setFormData({...formData, publicApiKey: e.target.value})}
                          placeholder="Untuk integrasi frontend"
                          className="w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm font-mono placeholder:font-sans"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-purple-800 dark:text-purple-400 uppercase tracking-wider mb-2 block">Webhook URL Callback</label>
                        <input 
                          type="text"
                          value={formData.webhookUrl}
                          onChange={e => setFormData({...formData, webhookUrl: e.target.value})}
                          placeholder="https://domain-anda.com/api/webhooks/midtrans"
                          className="w-full px-4 py-2.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm font-mono placeholder:font-sans"
                        />
                      </div>
                    </div>
                  )}

                  {formData.providerName === 'manual' && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Instruksi Transfer Manual</label>
                      <textarea
                        value={formData.instructions}
                        onChange={e => setFormData({...formData, instructions: e.target.value})}
                        placeholder={`BCA: 1234567890 a.n PT Perusahaan Anda\nMandiri: 0987654321 a.n PT Perusahaan Anda\n\nKirim bukti transfer ke WhatsApp 08123456789`}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm resize-none"
                      />
                    </div>
                  )}

                  {/* Payment Channels Section */}
                  {(AVAILABLE_CHANNELS[formData.providerName] || []).length > 0 && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 mt-4">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Kanal Pembayaran yang Diaktifkan</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {AVAILABLE_CHANNELS[formData.providerName].map(channel => {
                          const isActive = formData.activeChannels.includes(channel)
                          return (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => toggleChannel(channel)}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border text-sm transition-all text-left ${
                                isActive 
                                ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-500/30 dark:text-purple-300 font-medium' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-white/5 dark:border-white/10 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
                              }`}
                            >
                              {isActive ? <CheckSquare size={16} className="text-purple-500 flex-none" /> : <Square size={16} className="text-gray-400 flex-none" />}
                              <span className="truncate">{CHANNEL_LABELS[channel] || channel}</span>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-3">Hanya kanal terpilih yang akan dimunculkan ke pembeli saat checkout.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${formData.isProduction ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-500/30' : 'bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10'}`}>
                      <input 
                        type="checkbox"
                        id="isProduction"
                        checked={formData.isProduction}
                        onChange={e => setFormData({...formData, isProduction: e.target.checked})}
                        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="isProduction" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer block mb-1">
                          Mode Produksi (LIVE)
                        </label>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
                          Jika dicentang, transaksi akan menggunakan uang asli (API Live). Jika tidak, transaksi berstatus Sandbox / Testing.
                        </p>
                      </div>
                    </div>

                    <div className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${formData.isActive ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-500/30' : 'bg-gray-50 border-gray-200 dark:bg-white/5 dark:border-white/10'}`}>
                      <input 
                        type="checkbox"
                        id="isActive"
                        checked={formData.isActive}
                        onChange={e => setFormData({...formData, isActive: e.target.checked})}
                        className="w-5 h-5 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <div>
                        <label htmlFor="isActive" className="text-sm font-bold text-gray-900 dark:text-white cursor-pointer block mb-1">
                          Aktifkan Metode Ini
                        </label>
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-tight">
                          Menampilkan gateway ini sebagai pilihan pembayaran di halaman Checkout pelanggan.
                        </p>
                      </div>
                    </div>
                  </div>

                </form>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-zinc-900 rounded-b-3xl flex justify-end gap-3 sticky bottom-0">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  form="gateway-form"
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-purple-500/20 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Check size={16} /> Simpan Gateway</>
                  )}
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </RequirePermission>
  )
}
