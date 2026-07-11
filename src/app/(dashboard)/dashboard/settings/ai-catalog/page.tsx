'use client'
import { motion } from 'framer-motion'
import { Library, Plus, Trash2, Eye, Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'
import { DataTable, Column } from '@/components/ui/data-table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface AiCatalog {
  id: string
  providerName: string
  providerValue: string
  models: string // JSON string
}

export default function AiCatalogPage() {
  const [loading, setLoading] = useState(true)
  const [catalogs, setCatalogs] = useState<AiCatalog[]>([])
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state (only basic info, models managed in details page)
  const [formData, setFormData] = useState({
    id: '',
    providerName: '',
    providerValue: '',
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/ai-catalog')
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setCatalogs(json.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat katalog AI')
    } finally {
      setLoading(false)
    }
  }

  const getModelsCount = (jsonString: string) => {
    try {
      const arr = JSON.parse(jsonString)
      return Array.isArray(arr) ? arr.length : 0
    } catch (e) {
      return 0
    }
  }

  const openEditModal = (catalog?: AiCatalog) => {
    if (catalog) {
      setFormData({
        id: catalog.id,
        providerName: catalog.providerName,
        providerValue: catalog.providerValue,
      })
    } else {
      setFormData({
        id: '',
        providerName: '',
        providerValue: '',
      })
    }
    setIsEditModalOpen(true)
  }

  const handleSave = async () => {
    if (!formData.providerName || !formData.providerValue) {
      toast.error('Nama UI dan Kode Nilai wajib diisi')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading('Menyimpan katalog...')

    try {
      const isNew = !formData.id
      const url = isNew ? '/api/admin/ai-catalog' : `/api/admin/ai-catalog/${formData.id}`
      const method = isNew ? 'POST' : 'PUT'

      // Jika baru, inisialisasi models dengan array kosong
      const bodyPayload: any = {
        providerName: formData.providerName,
        providerValue: formData.providerValue,
      }
      if (isNew) bodyPayload.models = '[]'
      else {
        // Jika update, ambil existing models agar tidak menimpa
        const existing = catalogs.find(c => c.id === formData.id)
        if (existing) bodyPayload.models = existing.models
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      })

      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success(isNew ? 'Katalog berhasil ditambahkan' : 'Katalog berhasil diperbarui', { id: toastId })
        setIsEditModalOpen(false)
        fetchData() // Refresh data
      } else {
        toast.error(json?.message || 'Gagal menyimpan katalog', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const deleteCatalog = async (id: string, providerName: string) => {
    if (!confirm(`Hapus provider ${providerName} dari katalog? Jika sedang dipakai di "Model AI", sistem akan menolaknya.`)) return

    const toastId = toast.loading('Menghapus katalog...')
    try {
      const res = await fetch(`/api/admin/ai-catalog/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)

      if (res.ok && json?.success) {
        toast.success('Katalog berhasil dihapus', { id: toastId })
        setCatalogs(prev => prev.filter(c => c.id !== id))
      } else {
        toast.error(json?.message || 'Gagal menghapus', { id: toastId })
      }
    } catch (e) {
      toast.error('Terjadi kesalahan jaringan', { id: toastId })
    }
  }

  const columns: Column<AiCatalog>[] = [
    {
      id: 'action',
      label: 'Aksi',
      className: 'w-36 text-center',
      render: (cat) => (
        <div className="flex justify-center gap-2">
          <Link 
            href={`/dashboard/settings/ai-catalog/${cat.id}`}
            className="bg-blue-100 hover:bg-blue-200 dark:bg-blue-500/20 dark:hover:bg-blue-500/30 text-blue-600 dark:text-blue-400 w-8 h-8 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
            title="Lihat Detail & Kelola Model"
          >
            <Eye size={16} />
          </Link>

          <RequirePermission action="update" resource="api">
            <button 
              onClick={() => openEditModal(cat)}
              className="bg-orange-100 hover:bg-orange-200 dark:bg-orange-500/20 dark:hover:bg-orange-500/30 text-orange-600 dark:text-orange-400 w-8 h-8 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              title="Edit Provider"
            >
              <Pencil size={16} />
            </button>
          </RequirePermission>
          
          <RequirePermission action="delete" resource="api">
            <button 
              onClick={() => deleteCatalog(cat.id, cat.providerName)}
              className="bg-red-100 hover:bg-red-200 dark:bg-red-500/20 dark:hover:bg-red-500/30 text-red-600 dark:text-red-400 w-8 h-8 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
              title="Hapus Provider"
            >
              <Trash2 size={16} />
            </button>
          </RequirePermission>
        </div>
      )
    },
    {
      id: 'providerName',
      label: 'Label Provider (UI)',
      exportValue: (cat) => cat.providerName,
      render: (cat) => (
        <span className="font-medium">{cat.providerName}</span>
      )
    },
    {
      id: 'providerValue',
      label: 'Kode / Nilai (Unik)',
      exportValue: (cat) => cat.providerValue,
      render: (cat) => (
        <span className="font-mono text-sm text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded">
          {cat.providerValue}
        </span>
      )
    },
    {
      id: 'modelsCount',
      label: 'Jumlah Model',
      exportValue: (cat) => getModelsCount(cat.models).toString(),
      render: (cat) => (
        <span className="text-gray-500 dark:text-gray-400">
          {getModelsCount(cat.models)} Model
        </span>
      )
    }
  ]

  const globalFilterFn = (row: AiCatalog, query: string) => {
    const q = query.toLowerCase()
    return (
      row.providerName.toLowerCase().includes(q) ||
      row.providerValue.toLowerCase().includes(q)
    )
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
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Library size={24} className="text-purple-500" />
                Kamus / Katalog AI
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Master Data untuk seluruh Provider AI yang akan muncul di dropdown.</p>
            </div>
            
            <RequirePermission action="update" resource="api">
              <button 
                onClick={() => openEditModal()}
                className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2.5 rounded-xl transition-all text-sm font-medium shadow-lg shadow-purple-500/20"
              >
                <Plus size={16} />
                <span>Tambah Provider</span>
              </button>
            </RequirePermission>
          </div>

          <DataTable 
            data={catalogs}
            columns={columns}
            searchPlaceholder="Cari provider..."
            exportFilename="katalog_ai_master"
            emptyMessage="Belum ada Master Katalog AI."
            emptySubMessage="Klik tombol 'Tambah Provider' di atas untuk memulai membuat kamus."
            globalFilterFn={globalFilterFn}
          />

        </motion.div>
      </div>

      {/* EDIT/ADD MODAL */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formData.id ? 'Edit Provider AI' : 'Tambah Provider AI'}</DialogTitle>
            <DialogDescription>
              Masukkan informasi dasar provider. Daftar model dapat dikelola dengan mengklik tombol detail (ikon mata).
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Label Provider (UI)</label>
              <input 
                type="text"
                value={formData.providerName}
                onChange={e => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                placeholder="Contoh: Google Gemini"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
              />
            </div>
            
            <div className="grid gap-2">
              <label className="text-sm font-semibold">Kode / Nilai (Unik)</label>
              <input 
                type="text"
                value={formData.providerValue}
                onChange={e => setFormData(prev => ({ ...prev, providerValue: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))}
                placeholder="Contoh: google"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all font-mono"
              />
              <span className="text-xs text-gray-500">Gunakan huruf kecil, angka, strip (-), atau underscore (_).</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequirePermission>
  )
}
