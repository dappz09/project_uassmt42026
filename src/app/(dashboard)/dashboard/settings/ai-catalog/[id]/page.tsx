'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ArrowLeft, Box, Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface AiCatalog {
  id: string
  providerName: string
  providerValue: string
  models: string
}

export default function CatalogModelsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [catalog, setCatalog] = useState<AiCatalog | null>(null)
  const [models, setModels] = useState<string[]>([])
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [modelName, setModelName] = useState('')

  useEffect(() => {
    fetchCatalog()
  }, [id])

  const fetchCatalog = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/ai-catalog/${id}`)
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setCatalog(json.data)
        try {
          const parsed = JSON.parse(json.data.models)
          setModels(Array.isArray(parsed) ? parsed : [])
        } catch (e) {
          setModels([])
        }
      } else {
        toast.error(json?.message || 'Gagal memuat detail provider')
        router.push('/dashboard/settings/ai-catalog')
      }
    } catch (e) {
      console.error(e)
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    setEditingIndex(null)
    setModelName('')
    setIsEditModalOpen(true)
  }

  const openEditModal = (idx: number) => {
    setEditingIndex(idx)
    setModelName(models[idx])
    setIsEditModalOpen(true)
  }

  const saveModelsToDb = async (newModels: string[]) => {
    if (!catalog) return false
    const toastId = toast.loading('Menyimpan perubahan...')
    
    try {
      const res = await fetch(`/api/admin/ai-catalog/${catalog.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerName: catalog.providerName,
          providerValue: catalog.providerValue,
          models: JSON.stringify(newModels)
        })
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success('Daftar model berhasil diperbarui', { id: toastId })
        return true
      } else {
        toast.error(json?.message || 'Gagal menyimpan model', { id: toastId })
        return false
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
      return false
    }
  }

  const handleSaveModel = async () => {
    if (!modelName.trim()) {
      toast.error('Nama model tidak boleh kosong')
      return
    }

    setIsSaving(true)
    let newModels = [...models]

    if (editingIndex !== null) {
      // Edit existing
      newModels[editingIndex] = modelName.trim()
    } else {
      // Add new
      if (newModels.includes(modelName.trim())) {
        toast.error('Model ini sudah ada dalam daftar')
        setIsSaving(false)
        return
      }
      newModels.push(modelName.trim())
    }

    const success = await saveModelsToDb(newModels)
    if (success) {
      setModels(newModels)
      setIsEditModalOpen(false)
    }
    setIsSaving(false)
  }

  const handleDeleteModel = async (idx: number, name: string) => {
    if (!confirm(`Hapus model "${name}" dari daftar?`)) return

    const newModels = models.filter((_, i) => i !== idx)
    const success = await saveModelsToDb(newModels)
    if (success) {
      setModels(newModels)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!catalog) return null

  return (
    <RequirePermission 
      action="view" 
      resource="api" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin.</div>}
    >
      <div className="p-6 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <Link href="/dashboard/settings/ai-catalog" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-purple-600 transition-colors mb-6">
            <ArrowLeft size={16} />
            <span>Kembali ke Kamus AI</span>
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Box size={24} className="text-purple-500" />
                Daftar Model: {catalog.providerName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kode Unik: <span className="font-mono text-purple-600 dark:text-purple-400">{catalog.providerValue}</span></p>
            </div>
            
            <RequirePermission action="update" resource="api">
              <button 
                onClick={openAddModal}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
              >
                <Plus size={16} />
                <span>Tambah Model</span>
              </button>
            </RequirePermission>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Model</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-32 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                  {models.length > 0 ? (
                    models.map((model, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono text-sm text-gray-900 dark:text-white bg-gray-100 dark:bg-zinc-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-white/10">
                            {model}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <RequirePermission action="update" resource="api">
                              <button 
                                onClick={() => openEditModal(idx)}
                                className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 w-8 h-8 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                                title="Edit Model"
                              >
                                <Pencil size={16} />
                              </button>
                            </RequirePermission>
                            
                            <RequirePermission action="delete" resource="api">
                              <button 
                                onClick={() => handleDeleteModel(idx, model)}
                                className="bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 w-8 h-8 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                                title="Hapus Model"
                              >
                                <Trash2 size={16} />
                              </button>
                            </RequirePermission>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
                        Belum ada model yang terdaftar untuk provider ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </motion.div>
      </div>

      {/* EDIT/ADD MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Model' : 'Tambah Model'}</DialogTitle>
            <DialogDescription>
              Masukkan nama / kode identifikasi model (misalnya: gpt-4o, gemini-1.5-pro).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Nama Model</label>
              <input 
                type="text"
                value={modelName}
                onChange={e => setModelName(e.target.value)}
                placeholder="Contoh: gpt-4o"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-mono"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSaveModel} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequirePermission>
  )
}
