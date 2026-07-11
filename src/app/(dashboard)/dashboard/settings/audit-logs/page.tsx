'use client'
import { motion } from 'framer-motion'
import { Activity, Search, Download, TerminalSquare } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'
import { DataTable, Column } from '@/components/ui/data-table'

interface AuditLog {
  id: string
  userId: string | null
  user?: { name: string | null, email: string } | null
  action: string
  resource: string
  details: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export default function AuditLogsPage() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [selectedDetails, setSelectedDetails] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/audit-logs')
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setLogs(json.data)
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat log aktivitas')
    } finally {
      setLoading(false)
    }
  }

  const getActionColor = (action: string) => {
    const act = action.toUpperCase()
    if (act.includes('CREATE') || act.includes('ADD') || act.includes('LOGIN')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    if (act.includes('DELETE') || act.includes('REMOVE') || act.includes('LOGOUT')) return 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30'
    if (act.includes('UPDATE') || act.includes('EDIT')) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30'
    return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-gray-500/30'
  }

  const columns: Column<AuditLog>[] = [
    {
      id: 'createdAt',
      label: 'Waktu',
      exportValue: (log) => new Date(log.createdAt).toLocaleString('id-ID'),
      render: (log) => (
        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
          {new Date(log.createdAt).toLocaleString('id-ID', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
          })}
        </span>
      )
    },
    {
      id: 'user',
      label: 'Pengguna',
      exportValue: (log) => log.user?.email || 'Sistem (Tanpa User)',
      render: (log) => (
        <div className="flex flex-col">
          {log.user ? (
            <>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user.name || 'User'}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{log.user.email}</span>
            </>
          ) : (
            <span className="text-sm italic text-gray-500">Sistem Automatis</span>
          )}
        </div>
      )
    },
    {
      id: 'action',
      label: 'Aksi',
      exportValue: (log) => log.action,
      render: (log) => (
        <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase rounded-md border ${getActionColor(log.action)}`}>
          {log.action}
        </span>
      )
    },
    {
      id: 'resource',
      label: 'Modul / Sumber',
      exportValue: (log) => log.resource,
      render: (log) => (
        <span className="text-sm font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wider text-xs bg-purple-50 dark:bg-purple-500/10 px-2 py-1 rounded">
          {log.resource}
        </span>
      )
    },
    {
      id: 'network',
      label: 'Jaringan & Perangkat',
      exportValue: (log) => `IP: ${log.ipAddress || '-'} | Browser: ${log.userAgent || '-'}`,
      render: (log) => (
        <div className="flex flex-col max-w-[150px]">
          <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 truncate" title={log.ipAddress || 'unknown'}>
            IP: {log.ipAddress || '-'}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate" title={log.userAgent || 'unknown'}>
            {log.userAgent || '-'}
          </span>
        </div>
      )
    },
    {
      id: 'details',
      label: 'Detail Payload',
      exportValue: (log) => log.details || '-',
      render: (log) => (
        <div className="flex items-center">
          {log.details && log.details !== '{}' ? (
            <button 
              onClick={() => setSelectedDetails(log.details)}
              className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-lg transition-colors border border-gray-200 dark:border-white/10"
            >
              <TerminalSquare size={14} /> Lihat JSON
            </button>
          ) : (
            <span className="text-xs text-gray-400 italic">- Kosong -</span>
          )}
        </div>
      )
    }
  ]

  const globalFilterFn = (row: AuditLog, query: string) => {
    const q = query.toLowerCase()
    return (
      (row.user?.email || '').toLowerCase().includes(q) ||
      (row.user?.name || '').toLowerCase().includes(q) ||
      row.action.toLowerCase().includes(q) ||
      row.resource.toLowerCase().includes(q) ||
      (row.ipAddress || '').toLowerCase().includes(q)
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
      resource="audit_logs" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin melihat log aktivitas.</div>}
    >
      <div className="p-6 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                <Activity size={24} className="text-purple-500" />
                Log Aktivitas (Audit Trails)
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Rekam jejak digital untuk keamanan dan pemantauan sistem (*Compliance*).</p>
            </div>
          </div>

          <DataTable 
            data={logs}
            columns={columns}
            searchPlaceholder="Cari email, ip, aksi, atau modul..."
            exportFilename="audit_logs_export"
            emptyMessage="Belum ada aktivitas terekam."
            emptySubMessage="Sistem akan mulai merekam aktivitas penting ke dalam database."
            globalFilterFn={globalFilterFn}
          />

        </motion.div>
      </div>

      {/* JSON Modal for Details */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-white/10"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TerminalSquare size={18} className="text-purple-500" /> Payload Detail
              </h3>
              <button 
                onClick={() => setSelectedDetails(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                Tutup
              </button>
            </div>
            
            <div className="bg-gray-50 dark:bg-black/40 rounded-xl p-4 overflow-x-auto border border-gray-200 dark:border-white/5">
              <pre className="text-[13px] font-mono text-gray-800 dark:text-green-400">
                {JSON.stringify(JSON.parse(selectedDetails), null, 2)}
              </pre>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button 
                onClick={() => setSelectedDetails(null)}
                className="bg-gray-200 hover:bg-gray-300 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                Kembali
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </RequirePermission>
  )
}
