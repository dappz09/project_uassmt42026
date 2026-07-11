'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Tag, Plus, Trash2, Edit, Check, X, Calendar, Percent, Coins, Users } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'
import { CustomSelect } from '@/components/ui/custom-select'

interface PromoCode {
  id: string
  code: string
  discountPercent: number | null
  discountAmount: number | null
  maxUses: number | null
  currentUses: number
  expiresAt: string | null
  isActive: boolean
}

export default function PromosSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [promos, setPromos] = useState<PromoCode[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent', // percent or amount
    discountValue: 0 as number | string,
    maxUses: '' as number | string, // '' means unlimited
    expiresAt: '', // YYYY-MM-DD string
    isActive: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/promos')
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setPromos(json.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat data kode promo')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (promo?: PromoCode) => {
    if (promo) {
      setEditingPromo(promo)
      setFormData({
        code: promo.code,
        discountType: promo.discountPercent ? 'percent' : 'amount',
        discountValue: promo.discountPercent || promo.discountAmount || 0,
        maxUses: promo.maxUses || '',
        expiresAt: promo.expiresAt ? new Date(promo.expiresAt).toISOString().split('T')[0] : '',
        isActive: promo.isActive
      })
    } else {
      setEditingPromo(null)
      setFormData({
        code: generateRandomCode(),
        discountType: 'percent',
        discountValue: 10,
        maxUses: '',
        expiresAt: '',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPromo(null)
  }

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  const handleGenerateCode = () => {
    setFormData(prev => ({ ...prev, code: generateRandomCode() }))
  }

  const savePromo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code) {
      toast.error('Kode promo wajib diisi')
      return
    }

    setSaving(true)
    const toastId = toast.loading('Menyimpan kode promo...')

    try {
      const url = editingPromo ? `/api/admin/promos/${editingPromo.id}` : '/api/admin/promos'
      const method = editingPromo ? 'PUT' : 'POST'

      const payload = {
        code: formData.code.toUpperCase(),
        discountPercent: formData.discountType === 'percent' ? Number(formData.discountValue) : null,
        discountAmount: formData.discountType === 'amount' ? Number(formData.discountValue) : null,
        maxUses: formData.maxUses === '' ? null : Number(formData.maxUses),
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(editingPromo ? 'Kode Promo diperbarui' : 'Kode Promo ditambahkan', { id: toastId })
        fetchData()
        closeModal()
      } else {
        toast.error(json?.message || 'Gagal menyimpan', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const deletePromo = async (id: string, code: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus promo ${code}?`)) return

    const toastId = toast.loading('Menghapus promo...')
    try {
      const res = await fetch(`/api/admin/promos/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success('Kode promo dihapus', { id: toastId })
        setPromos(prev => prev.filter(p => p.id !== id))
      } else {
        toast.error(json?.message || 'Gagal menghapus', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    }
  }

  const toggleStatus = async (promo: PromoCode) => {
    const toastId = toast.loading('Memperbarui status...')
    try {
      const res = await fetch(`/api/admin/promos/${promo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promo.code,
          isActive: !promo.isActive
        }) // We only send what's strictly necessary + the code to pass validation
      })
      const json = await res.json()
      
      if (res.ok && json.success) {
        toast.success(`Promo ${promo.code} di${!promo.isActive ? 'aktifkan' : 'nonaktifkan'}`, { id: toastId })
        setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, isActive: !p.isActive } : p))
      } else {
        toast.error(json.message || 'Gagal', { id: toastId })
      }
    } catch (e) {
      toast.error('Gagal memperbarui', { id: toastId })
    }
  }

  const isExpired = (dateString: string | null) => {
    if (!dateString) return false
    return new Date(dateString) < new Date()
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <RequirePermission 
      action="view" 
      resource="api" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin.</div>}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Tag size={24} className="text-indigo-500" />
                Kode Promo & Diskon
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Buat dan kelola kupon diskon untuk pelanggan.</p>
            </div>
            
            <RequirePermission action="create" resource="api">
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
              >
                <Plus size={16} /> Buat Promo Baru
              </button>
            </RequirePermission>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {promos.length === 0 ? (
                <div className="col-span-full p-12 text-center bg-gray-50 dark:bg-zinc-900/50 rounded-3xl border border-dashed border-gray-300 dark:border-zinc-800">
                  <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4 text-gray-400">
                    <Tag size={32} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada promo</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-sm mx-auto">Tingkatkan penjualan dengan memberikan diskon menarik kepada pelanggan Anda.</p>
                  <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors">
                    Buat Promo Pertama
                  </button>
                </div>
              ) : (
                promos.map((promo) => {
                  const expired = isExpired(promo.expiresAt)
                  const fullyUsed = promo.maxUses !== null && promo.currentUses >= promo.maxUses
                  const statusLabel = expired ? 'Kedaluwarsa' : fullyUsed ? 'Habis Terpakai' : promo.isActive ? 'Aktif' : 'Nonaktif'
                  const statusColor = expired || fullyUsed ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' 
                                    : promo.isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
                                    : 'bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-gray-400'

                  return (
                    <motion.div 
                      key={promo.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`relative overflow-hidden rounded-3xl border ${promo.isActive && !expired && !fullyUsed ? 'border-indigo-200 dark:border-indigo-500/30 shadow-xl shadow-indigo-500/5' : 'border-gray-200 dark:border-white/10 shadow-sm'} bg-white dark:bg-zinc-900 transition-all group flex flex-col`}
                    >
                      {/* Ribbon / Status Banner */}
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-gray-100 dark:bg-black/40 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 font-mono text-lg font-bold text-gray-900 dark:text-white tracking-widest uppercase">
                            {promo.code}
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2 mb-6">
                          {promo.discountPercent ? (
                            <>
                              <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                {promo.discountPercent}%
                              </span>
                              <span className="text-sm font-semibold text-gray-500">OFF</span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                                - Rp {promo.discountAmount?.toLocaleString('id-ID')}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                              <Users size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-0.5">Penggunaan</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {promo.currentUses} / {promo.maxUses === null ? '∞' : promo.maxUses}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-gray-500">
                              <Calendar size={14} />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-gray-500 mb-0.5">Batas Waktu</p>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {promo.expiresAt ? new Date(promo.expiresAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selamanya'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-gray-100 dark:border-white/5 p-4 flex gap-2 bg-gray-50/50 dark:bg-zinc-900/50">
                        <RequirePermission action="update" resource="api">
                          <button 
                            onClick={() => toggleStatus(promo)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                              promo.isActive 
                                ? 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5' 
                                : 'border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'
                            }`}
                          >
                            {promo.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </RequirePermission>
                        <RequirePermission action="update" resource="api">
                          <button 
                            onClick={() => openModal(promo)}
                            className="w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm hover:border-indigo-200 dark:hover:border-indigo-500/30"
                            title="Edit Promo"
                          >
                            <Edit size={14} />
                          </button>
                        </RequirePermission>
                        <RequirePermission action="delete" resource="api">
                          <button 
                            onClick={() => deletePromo(promo.id, promo.code)}
                            className="w-10 flex items-center justify-center rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors shadow-sm hover:border-red-200 dark:hover:border-red-500/30"
                            title="Hapus Promo"
                          >
                            <Trash2 size={14} />
                          </button>
                        </RequirePermission>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Modal Form */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="absolute inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm"
              />
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#111] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden flex flex-col max-h-full"
              >
                <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/[0.02]">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {editingPromo ? 'Edit Kode Promo' : 'Buat Promo Baru'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {editingPromo ? `Memperbarui promo ${editingPromo.code}` : 'Atur detail diskon untuk pelanggan.'}
                    </p>
                  </div>
                  <button 
                    onClick={closeModal}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar">
                  <form id="promoForm" onSubmit={savePromo} className="space-y-6">
                    
                    {/* Code Input */}
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Kode Promo *</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          required
                          value={formData.code}
                          onChange={e => setFormData({...formData, code: e.target.value.toUpperCase().replace(/\s/g, '')})}
                          placeholder="Misal: MERDEKA26"
                          className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white uppercase font-mono tracking-wider font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleGenerateCode}
                          className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-300 text-sm font-medium transition-colors border border-gray-200 dark:border-white/10 flex-shrink-0"
                          title="Buat kode acak"
                        >
                          Acak
                        </button>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5 uppercase">* Tanpa spasi. Otomatis huruf kapital.</p>
                    </div>

                    {/* Type and Value */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="overflow-visible">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Tipe Diskon</label>
                        <CustomSelect 
                          value={formData.discountType}
                          onChange={(val) => setFormData({...formData, discountType: val})}
                          options={[
                            { value: 'percent', label: 'Persentase (%)' },
                            { value: 'amount', label: 'Nominal (Rp)' }
                          ]}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
                          Besaran Diskon {formData.discountType === 'percent' ? '(%)' : '(Rp)'}
                        </label>
                        <div className="relative">
                          {formData.discountType === 'amount' && (
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                          )}
                          {formData.discountType === 'percent' && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">%</span>
                          )}
                          <input 
                            type="number" 
                            min="0"
                            max={formData.discountType === 'percent' ? "100" : undefined}
                            required
                            value={formData.discountValue}
                            onChange={e => setFormData({...formData, discountValue: e.target.value === '' ? '' : Number(e.target.value)})}
                            className={`w-full ${formData.discountType === 'amount' ? 'pl-10' : 'pl-4'} ${formData.discountType === 'percent' ? 'pr-10' : 'pr-4'} py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm font-mono font-semibold`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Max Uses & Expires At */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                          <span>Batas Kuota</span>
                          <span className="text-indigo-500 font-bold opacity-70">Opsional</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            min="1"
                            value={formData.maxUses}
                            onChange={e => setFormData({...formData, maxUses: e.target.value === '' ? '' : Number(e.target.value)})}
                            placeholder="Tak Terbatas"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm"
                          />
                          <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex justify-between">
                          <span>Batas Waktu</span>
                          <span className="text-indigo-500 font-bold opacity-70">Opsional</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="date" 
                            value={formData.expiresAt}
                            onChange={e => setFormData({...formData, expiresAt: e.target.value})}
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                    </div>

                  </form>
                </div>
                
                <div className="p-6 sm:p-8 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex justify-end gap-3">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    form="promoForm"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 min-w-[120px]"
                  >
                    {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={16} /> Simpan</>}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </RequirePermission>
  )
}
