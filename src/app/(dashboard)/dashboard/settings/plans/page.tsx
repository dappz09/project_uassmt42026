'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Plus, Trash2, Edit, Check, X, Server, Zap, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'

interface AiModel {
  id: string
  provider: string
  name: string
}

interface Plan {
  id: string
  name: string
  type: string
  price: number
  interval: string
  features: string // JSON string
  limitCount: number
  aiModelId: string | null
  aiModel?: AiModel | null
  isActive: boolean
}

export default function PlansSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<Plan[]>([])
  const [aiModels, setAiModels] = useState<AiModel[]>([])

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'Paid', // Free or Paid
    price: 0 as number | string,
    interval: 'month',
    features: [''], // Array of strings
    limitCount: 0 as number | string,
    aiModelId: '',
    isActive: true
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      // Fetch Plans
      const resPlans = await fetch('/api/admin/plans')
      const jsonPlans = await resPlans.json().catch(() => null)
      if (resPlans.ok && jsonPlans?.success) {
        setPlans(jsonPlans.data)
      }

      // Fetch AI Models for the dropdown
      const resAi = await fetch('/api/admin/ai-models')
      const jsonAi = await resAi.json().catch(() => null)
      if (resAi.ok && jsonAi?.success) {
        setAiModels(jsonAi.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat data paket')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (plan?: Plan) => {
    if (plan) {
      setEditingPlan(plan)
      setFormData({
        name: plan.name,
        type: plan.type,
        price: plan.price,
        interval: plan.interval,
        features: plan.features ? JSON.parse(plan.features) : [''],
        limitCount: plan.limitCount,
        aiModelId: plan.aiModelId || '',
        isActive: plan.isActive
      })
    } else {
      setEditingPlan(null)
      setFormData({
        name: '',
        type: 'Paid',
        price: 0 as number | string,
        interval: 'month',
        features: [''],
        limitCount: 0 as number | string,
        aiModelId: '',
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingPlan(null)
  }

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features]
    newFeatures[index] = value
    setFormData(prev => ({ ...prev, features: newFeatures }))
  }

  const addFeatureRow = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }))
  }

  const removeFeatureRow = (index: number) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, features: newFeatures.length > 0 ? newFeatures : [''] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name) return toast.error('Nama paket wajib diisi')

    setSaving(true)
    const toastId = toast.loading('Menyimpan paket...')

    try {
      const cleanFeatures = formData.features.map(f => f.trim()).filter(Boolean)
      const payload = {
        ...formData,
        features: cleanFeatures,
        aiModelId: formData.aiModelId || null
      }

      const url = editingPlan ? `/api/admin/plans/${editingPlan.id}` : '/api/admin/plans'
      const method = editingPlan ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(editingPlan ? 'Paket diperbarui' : 'Paket ditambahkan', { id: toastId })
        fetchData() // Refresh data
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
    if (!confirm(`Hapus paket ${name}? Ini tidak dapat dibatalkan.`)) return
    
    const toastId = toast.loading('Menghapus paket...')
    try {
      const res = await fetch(`/api/admin/plans/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success('Paket berhasil dihapus', { id: toastId })
        setPlans(prev => prev.filter(p => p.id !== id))
      } else {
        toast.error(json?.message || 'Gagal menghapus', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    }
  }

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka)
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
      resource="billing" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin.</div>}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Package size={24} className="text-indigo-500" />
                Paket & Fitur (Plans)
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kelola paket langganan dan hubungkan dengan Mesin AI.</p>
            </div>
            
            <RequirePermission action="update" resource="billing">
              <button 
                onClick={() => openModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 font-medium text-sm"
              >
                <Plus size={16} />
                <span>Tambah Paket Baru</span>
              </button>
            </RequirePermission>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const featuresList: string[] = plan.features ? JSON.parse(plan.features) : []

              return (
                <div key={plan.id} className={`relative flex flex-col bg-white dark:bg-zinc-900/80 border ${!plan.isActive ? 'border-dashed border-gray-300 dark:border-gray-700 opacity-70' : 'border-gray-200 dark:border-white/10'} rounded-3xl p-6 shadow-sm overflow-hidden`}>
                  
                  {/* Status Badge */}
                  {!plan.isActive && (
                    <div className="absolute top-4 right-4 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                      Nonaktif
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                        {plan.price === 0 ? 'Gratis' : formatRupiah(plan.price)}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">/{plan.interval === 'year' ? 'tahun' : 'bulan'}</span>
                      )}
                    </div>
                  </div>

                  {/* AI Routing Info */}
                  <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-3 mb-6 flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg flex-shrink-0">
                      <Server size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">Mesin AI Terpasang</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-indigo-100">
                        {plan.aiModel ? (
                          <span className="capitalize">{plan.aiModel.provider} <span className="font-mono text-xs opacity-75">({plan.aiModel.name})</span></span>
                        ) : (
                          <span className="text-gray-400 italic">Tidak ada (Gunakan Default)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="flex-1">
                    <ul className="space-y-3 mb-6">
                      <li className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Zap size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                        <span>Limit: <strong className="text-gray-900 dark:text-white">{plan.limitCount === 0 ? 'Unlimited' : `${plan.limitCount} Token`}</strong> per {plan.interval}</span>
                      </li>
                      {featuresList.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check size={16} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Actions */}
                  <RequirePermission action="update" resource="billing">
                    <div className="flex gap-2 mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
                      <button 
                        onClick={() => openModal(plan)}
                        className="flex-1 flex justify-center items-center gap-2 bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 py-2.5 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Edit size={16} /> Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(plan.id, plan.name)}
                        className="flex-none flex justify-center items-center w-12 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                        title="Hapus Paket"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </RequirePermission>

                </div>
              )
            })}

            {plans.length === 0 && (
              <div className="col-span-full p-12 text-center border-2 border-dashed border-gray-200 dark:border-white/10 rounded-3xl">
                <Package size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Belum ada paket langganan</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Mulai dengan membuat paket pertama Anda (misal: Paket Gratis).</p>
                <button 
                  onClick={() => openModal()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20"
                >
                  Buat Paket Pertama
                </button>
              </div>
            )}
          </div>

        </motion.div>
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-white/10 my-8 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 rounded-t-3xl z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingPlan ? 'Edit Paket' : 'Buat Paket Baru'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-white/10 w-8 h-8 flex justify-center items-center rounded-full transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar">
                <form id="plan-form" onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Nama Paket *</label>
                      <input 
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Misal: Pro, Enterprise"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Tipe Paket</label>
                      <div className="relative">
                        <select 
                          value={formData.type}
                          onChange={e => setFormData({...formData, type: e.target.value})}
                          className="w-full px-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                          <option value="Free" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Gratis (Free)</option>
                          <option value="Paid" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Berbayar (Paid)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Harga (Rp)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium text-sm">Rp</span>
                        <input 
                          type="number" 
                          min="0"
                          value={formData.price}
                          onChange={e => setFormData({...formData, price: e.target.value === '' ? '' : Number(e.target.value)})}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Siklus Tagihan</label>
                      <div className="relative">
                        <select 
                          value={formData.interval}
                          onChange={e => setFormData({...formData, interval: e.target.value})}
                          className="w-full px-4 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm appearance-none cursor-pointer"
                        >
                          <option value="month" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Bulanan</option>
                          <option value="year" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Tahunan</option>
                          <option value="one_time" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Sekali Bayar (Lifetime)</option>
                        </select>
                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* AI Routing Section */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="mt-0.5 text-indigo-600 dark:text-indigo-400">
                        <Server size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white">AI Routing (Kunci API)</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Pilih mesin AI yang akan melayani pengguna di paket ini.</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <select 
                        value={formData.aiModelId}
                        onChange={e => setFormData({...formData, aiModelId: e.target.value})}
                        className="w-full px-4 pr-10 py-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm appearance-none cursor-pointer"
                      >
                        <option value="" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">-- Jangan batasi (Gunakan Default Sistem) --</option>
                        {aiModels.map(ai => (
                          <option key={ai.id} value={ai.id} className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">
                            {ai.provider.toUpperCase()} - {ai.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-500 pointer-events-none" />
                    </div>

                    <div className="mt-4">
                      <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Limit Request / Token</label>
                      <div className="relative w-full sm:w-1/2">
                        <input 
                          type="number" 
                          min="0"
                          value={formData.limitCount}
                          onChange={e => setFormData({...formData, limitCount: e.target.value === '' ? '' : Number(e.target.value)})}
                          className="w-full px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-white dark:bg-black/40 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all text-sm font-mono pr-20"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">/ {formData.interval}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1.5">* Isi 0 untuk Unlimited.</p>
                    </div>
                  </div>

                  {/* Features List Array */}
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 block">Poin-poin Fitur (Ditampilkan di Landing Page)</label>
                    <div className="space-y-3">
                      {formData.features.map((feat, idx) => (
                        <div key={idx} className="flex gap-2">
                          <div className="flex-none pt-2 text-indigo-500"><Check size={16} /></div>
                          <input 
                            type="text"
                            value={feat}
                            onChange={e => handleFeatureChange(idx, e.target.value)}
                            placeholder="Contoh: Akses Model GPT-4"
                            className="w-full px-3 py-2 border-b border-gray-200 dark:border-white/10 bg-transparent text-gray-900 dark:text-white focus:border-indigo-500 outline-none transition-all text-sm"
                          />
                          <button 
                            type="button"
                            onClick={() => removeFeatureRow(idx)}
                            className="text-gray-400 hover:text-red-500 px-2 transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      type="button"
                      onClick={addFeatureRow}
                      className="mt-3 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-lg"
                    >
                      <Plus size={14} /> Tambah Poin Fitur
                    </button>
                  </div>

                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10">
                    <input 
                      type="checkbox"
                      id="isActivePlan"
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <label htmlFor="isActivePlan" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">Aktifkan Paket Ini</label>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400">Jika dimatikan, pengguna tidak bisa lagi membeli paket ini (pengguna lama tidak terpengaruh).</p>
                    </div>
                  </div>

                </form>
              </div>

              {/* Modal Footer */}
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
                  form="plan-form"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm flex items-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Menyimpan...</>
                  ) : (
                    <><Check size={16} /> Simpan Paket</>
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
