'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Eye, EyeOff, Plus, Trash2, Check, X, AlertTriangle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { CustomSelect } from '@/components/ui/custom-select'
import { toast } from 'sonner'
import Link from 'next/link'

interface AiModel {
  id: string
  provider: string
  name: string
  apiKey: string
  isNew?: boolean
  isEdited?: boolean
}

interface AiCatalog {
  id: string
  providerName: string
  providerValue: string
  models: string // JSON string array
}

export default function AiModelsPage() {
  const [loading, setLoading] = useState(true)
  const [savingAi, setSavingAi] = useState<string | null>(null)
  
  const [aiModels, setAiModels] = useState<AiModel[]>([])
  const [catalog, setCatalog] = useState<AiCatalog[]>([])
  const [showAiKey, setShowAiKey] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      
      // Fetch Master Catalog
      const resCat = await fetch('/api/admin/ai-catalog')
      const jsonCat = await resCat.json().catch(() => null)
      if (resCat.ok && jsonCat?.success) {
        setCatalog(jsonCat.data)
      }

      // Fetch AI Models
      const resAi = await fetch('/api/admin/ai-models')
      const jsonAi = await resAi.json().catch(() => null)
      if (resAi.ok && jsonAi?.success) {
        setAiModels(jsonAi.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  // Derive providers array from Catalog for CustomSelect
  const providerOptions = catalog.map(c => ({
    value: c.providerValue,
    label: c.providerName
  }))

  const getModelOptionsForProvider = (providerValue: string) => {
    const catItem = catalog.find(c => c.providerValue === providerValue)
    if (!catItem) return []
    try {
      const arr = JSON.parse(catItem.models)
      if (Array.isArray(arr)) {
        return arr.map(m => ({ value: m, label: m }))
      }
    } catch (e) {}
    return []
  }

  const addAiModel = () => {
    setAiModels(prev => [
      { id: `new_${Date.now()}`, provider: '', name: '', apiKey: '', isNew: true },
      ...prev
    ])
  }

  const removeNewAiModel = (id: string) => {
    setAiModels(prev => prev.filter(m => m.id !== id))
  }

  const handleAiChange = (id: string, field: keyof AiModel, value: string) => {
    setAiModels(prev => prev.map(m => {
      if (m.id === id) {
        // Jika mengganti provider, reset name modelnya
        if (field === 'provider' && m.provider !== value) {
          return { ...m, provider: value, name: '', isEdited: !m.isNew }
        }
        return { ...m, [field]: value, isEdited: !m.isNew }
      }
      return m
    }))
  }

  const toggleAiVisibility = (id: string) => {
    setShowAiKey(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const saveAiModel = async (model: AiModel) => {
    if (!model.provider || !model.name || !model.apiKey) {
      toast.error('Semua kolom (Provider, Nama Model, Kunci API) harus diisi')
      return
    }

    setSavingAi(model.id)
    const toastId = toast.loading('Menyimpan AI...')

    try {
      const url = model.isNew ? '/api/admin/ai-models' : `/api/admin/ai-models/${model.id}`
      const method = model.isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: model.provider,
          name: model.name,
          apiKey: model.apiKey
        })
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(model.isNew ? 'AI berhasil ditambahkan' : 'AI berhasil diperbarui', { id: toastId })
        setAiModels(prev => prev.map(m => m.id === model.id ? { ...json.data, isNew: false, isEdited: false } : m))
      } else {
        toast.error(json?.message || 'Gagal menyimpan AI', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setSavingAi(null)
    }
  }

  const deleteAiModel = async (id: string) => {
    if (!confirm('Anda yakin ingin menghapus konfigurasi kunci AI ini?')) return

    const toastId = toast.loading('Menghapus AI...')
    try {
      const res = await fetch(`/api/admin/ai-models/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success('AI berhasil dihapus', { id: toastId })
        setAiModels(prev => prev.filter(m => m.id !== id))
      } else {
        toast.error(json?.message || 'Gagal menghapus AI', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    }
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
      <div className="p-6 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Sparkles size={24} className="text-indigo-500" />
                Model & Mesin AI
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rakitan dinamis kunci API berdasarkan Katalog Induk AI.</p>
            </div>
          </div>

          <div className="space-y-6">

            {catalog.length === 0 && (
              <div className="p-6 rounded-2xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-900/30 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-800/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                  <AlertTriangle size={24} />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-indigo-800 dark:text-indigo-400 font-semibold mb-1">Katalog AI Kosong</h3>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed mb-3">
                    Anda belum mendefinisikan satupun Provider AI di Katalog Utama. Anda wajib menambahkan Provider (misal: OpenAI, Gemini) di sana terlebih dahulu agar bisa dipilih di halaman ini.
                  </p>
                  <Link href="/dashboard/settings/ai-catalog" className="inline-block bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    Buka Katalog AI
                  </Link>
                </div>
              </div>
            )}

            <div className={`bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm backdrop-blur-xl ${catalog.length === 0 ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Daftar AI Aktif</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Daftar mesin AI resmi di sistem Anda. Nantinya dapat dipasangkan ke Paket Langganan.</p>
                  </div>
                </div>
                
                <RequirePermission action="update" resource="api">
                  <button 
                    onClick={addAiModel}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20"
                  >
                    <Plus size={16} /> Tambah Kunci AI
                  </button>
                </RequirePermission>
              </div>

              {aiModels.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 dark:bg-black/20 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Belum ada Kunci AI yang disimpan.</p>
                  <button onClick={addAiModel} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
                    Mulai Tambah AI
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence>
                    {aiModels.map((ai) => {
                      const modelOptions = getModelOptionsForProvider(ai.provider)
                      return (
                      <motion.div 
                        key={ai.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`border ${ai.isNew || ai.isEdited ? 'border-indigo-500/50 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20'} rounded-xl p-4 flex flex-col lg:flex-row gap-4 items-start lg:items-end overflow-visible transition-colors`}
                      >
                        
                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Provider Induk</label>
                          <CustomSelect 
                            value={ai.provider}
                            onChange={(val) => handleAiChange(ai.id, 'provider', val)}
                            options={providerOptions}
                            placeholder="Pilih Provider"
                          />
                        </div>

                        <div className="flex-1 w-full space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Varian Model</label>
                          {modelOptions.length > 0 ? (
                            <CustomSelect 
                              value={ai.name}
                              onChange={(val) => handleAiChange(ai.id, 'name', val)}
                              options={modelOptions}
                              placeholder="Pilih Model"
                            />
                          ) : (
                            <div className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/40 text-gray-400 dark:text-gray-500 text-sm italic">
                              {ai.provider ? 'Model tidak tersedia di Katalog' : 'Pilih Provider dulu'}
                            </div>
                          )}
                        </div>

                        <div className="flex-[2] w-full space-y-1.5">
                          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex justify-between">
                            <span>API Key Rahasia</span>
                            {(ai.isNew || ai.isEdited) && <span className="text-indigo-600 dark:text-indigo-400 font-bold">* Belum Disimpan</span>}
                          </label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input 
                                type={showAiKey[ai.id] ? "text" : "password"}
                                value={ai.apiKey}
                                onChange={(e) => handleAiChange(ai.id, 'apiKey', e.target.value)}
                                placeholder="sk-..."
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all pr-12 text-sm font-mono"
                              />
                              <button 
                                onClick={() => toggleAiVisibility(ai.id)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                {showAiKey[ai.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>

                            {/* Action Buttons */}
                            <RequirePermission action="update" resource="api">
                              {ai.isNew || ai.isEdited ? (
                                <button 
                                  onClick={() => saveAiModel(ai)}
                                  disabled={savingAi === ai.id}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 rounded-xl transition-colors flex items-center justify-center flex-shrink-0 disabled:opacity-50"
                                  title="Simpan baris"
                                >
                                  {savingAi === ai.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={18} />}
                                </button>
                              ) : null}
                              
                              <button 
                                onClick={() => ai.isNew ? removeNewAiModel(ai.id) : deleteAiModel(ai.id)}
                                className="bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 px-4 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
                                title="Hapus baris"
                              >
                                {ai.isNew ? <X size={18} /> : <Trash2 size={18} />}
                              </button>
                            </RequirePermission>

                          </div>
                        </div>

                      </motion.div>
                    )})}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {/* Warning Info */}
            <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 flex flex-col justify-center">
               <h3 className="text-zinc-800 dark:text-zinc-200 font-semibold mb-2 flex items-center gap-2">Integritas Basis Data Berantai</h3>
               <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                 Provider dan Model yang muncul di halaman ini diatur sepenuhnya melalui menu **Katalog AI**. Anda tidak bisa menghapus Provider di Katalog Utama jika kuncinya sedang digunakan di halaman ini, dan Anda tidak bisa menghapus kunci di halaman ini jika sedang dipakai oleh Paket Langganan. Semuanya terlindungi dengan sempurna.
               </p>
            </div>

          </div>
        </motion.div>
      </div>
    </RequirePermission>
  )
}
