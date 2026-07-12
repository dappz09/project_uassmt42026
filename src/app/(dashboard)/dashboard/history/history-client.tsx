'use client'

import { motion } from 'framer-motion'
import { History, Eye, Trash2, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { DataTable, Column } from '@/components/ui/data-table'
import { RequirePermission } from '@/components/auth/require-permission'

type Note = {
  id: string
  title: string
  content: string
  videoId: string | null
  videoUrl: string | null
  createdAt: Date
}

export function HistoryClient({ notes }: { notes: Note[] }) {
  if (notes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-xl backdrop-blur-xl min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
            <History size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Riwayat</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mb-6">
            Anda belum membuat ringkasan catatan apapun. Mulai konversi video YouTube pertama Anda sekarang!
          </p>
          <RequirePermission action="create" resource="notes">
            <Link 
              href="/dashboard/create"
              className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition shadow-lg shadow-purple-500/25"
            >
              Buat Catatan Baru
            </Link>
          </RequirePermission>
        </div>
      </motion.div>
    )
  }

  const columns: Column<Note>[] = [
    {
      id: 'action',
      label: 'Aksi',
      className: 'w-24',
      render: (note) => (
        <div className="flex items-center gap-2">
          <RequirePermission action="show" resource="notes">
            <Link href={`/dashboard/history/${note.id}`} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors flex items-center justify-center" title="Lihat Detail">
              <Eye size={16} />
            </Link>
          </RequirePermission>
          <RequirePermission action="delete" resource="notes">
            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus">
              <Trash2 size={16} />
            </button>
          </RequirePermission>
        </div>
      )
    },
    {
      id: 'title',
      label: 'Judul Catatan',
      exportValue: (note) => note.title,
      render: (note) => (
        <div className="font-medium text-gray-900 dark:text-white whitespace-nowrap">
          {note.title}
        </div>
      )
    },
    {
      id: 'content',
      label: 'Cuplikan',
      exportValue: (note) => note.content,
      render: (note) => (
        <span className="text-gray-600 dark:text-gray-300 line-clamp-1 max-w-[300px]" title={note.content}>
          {note.content}
        </span>
      )
    },
    {
      id: 'videoUrl',
      label: 'Tautan Video',
      exportValue: (note) => note.videoUrl || '-',
      render: (note) => (
        note.videoUrl ? (
          <a 
            href={note.videoUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center gap-1.5 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium whitespace-nowrap"
          >
            Lihat Video <ExternalLink size={14} />
          </a>
        ) : <span className="text-gray-400">-</span>
      )
    },
    {
      id: 'createdAt',
      label: 'Dibuat Pada',
      exportValue: (note) => new Date(note.createdAt).toLocaleString('id-ID'),
      render: (note) => (
        <span className="text-gray-600 dark:text-gray-300 whitespace-nowrap">
          {new Date(note.createdAt).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
      )
    }
  ]

  const globalFilterFn = (row: Note, searchQuery: string) => {
    const query = searchQuery.toLowerCase()
    return (
      row.title.toLowerCase().includes(query) ||
      row.content.toLowerCase().includes(query) ||
      (row.videoUrl || '').toLowerCase().includes(query)
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <RequirePermission action="view" resource="notes">
        <DataTable
          data={notes}
          columns={columns}
          loading={false}
          globalFilterFn={globalFilterFn}
          searchPlaceholder="Cari judul, cuplikan, atau link video..."
          exportFilename="Riwayat_Catatan_NoteTube"
        />
      </RequirePermission>
    </motion.div>
  )
}
