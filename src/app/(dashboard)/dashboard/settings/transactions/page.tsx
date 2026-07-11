'use client'
import { motion } from 'framer-motion'
import { Receipt, Search, Download, TrendingUp, AlertCircle, CheckCircle2, ArrowUpDown, ChevronDown } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import { toast } from 'sonner'
import dayjs from 'dayjs'
import 'dayjs/locale/id'

dayjs.locale('id')

interface Transaction {
  id: string
  invoiceId: string | null
  userId: string
  amount: number
  currency: string
  status: string
  paymentMethod: string | null
  metadata: string | null
  createdAt: string
  user: { name: string | null, email: string }
  plan?: { name: string, type: string } | null
}

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState({ totalRevenue: 0, successCount: 0, pendingCount: 0, totalTransactions: 0 })
  
  const [searchTerm, setSearchTerm] = useState('')
  const [timeFilter, setTimeFilter] = useState('all') // all, today, 7days, 30days
  const [statusFilter, setStatusFilter] = useState('all') // all, SUCCESS, PENDING, FAILED
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/transactions')
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setTransactions(json.data.transactions)
        setSummary(json.data.summary)
      } else {
        toast.error(json?.message || 'Gagal memuat transaksi')
      }
    } catch (e) {
      console.error(e)
      toast.error('Terjadi kesalahan jaringan')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (transactions.length === 0) return toast.info('Tidak ada data untuk diekspor')

    const headers = ['Invoice ID', 'Waktu', 'Nama Pelanggan', 'Email', 'Paket', 'Metode Pembayaran', 'Mata Uang', 'Nominal', 'Status']
    const csvContent = [
      headers.join(','),
      ...transactions.map(t => [
        t.invoiceId || t.id,
        dayjs(t.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        `"${t.user.name || '-'}"`,
        t.user.email,
        `"${t.plan?.name || '-'}"`,
        t.paymentMethod || '-',
        t.currency,
        t.amount,
        t.status
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `transaksi_pendapatan_${dayjs().format('YYYYMMDD')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  let filteredTransactions = transactions.filter(t => 
    ((t.invoiceId?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    t.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()))
  )

  if (statusFilter !== 'all') {
    filteredTransactions = filteredTransactions.filter(t => t.status === statusFilter)
  }

  if (timeFilter !== 'all') {
    const now = dayjs()
    filteredTransactions = filteredTransactions.filter(t => {
      const tDate = dayjs(t.createdAt)
      if (timeFilter === 'today') return tDate.isSame(now, 'day')
      if (timeFilter === '7days') return tDate.isAfter(now.subtract(7, 'day'))
      if (timeFilter === '30days') return tDate.isAfter(now.subtract(30, 'day'))
      return true
    })
  }

  filteredTransactions.sort((a, b) => {
    if (sortOrder === 'asc') return a.amount - b.amount
    return b.amount - a.amount
  })

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
      resource="transactions" 
      fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin untuk melihat laporan keuangan.</div>}
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Receipt size={24} className="text-purple-500" />
              Transaksi & Pendapatan
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pantau seluruh riwayat pembayaran pelanggan dan arus kas sistem.</p>
          </div>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-purple-500/20 font-medium text-sm"
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </motion.div>

        {/* Summary Cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <TrendingUp size={64} className="text-purple-500" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Total Pendapatan (Kotor)</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.totalRevenue)}</h2>
          </div>

          <div className="bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle2 size={64} className="text-emerald-500" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Transaksi Lunas</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{summary.successCount} <span className="text-lg font-medium text-gray-400">struk</span></h2>
          </div>

          <div className="bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AlertCircle size={64} className="text-amber-500" />
            </div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Menunggu Pembayaran</p>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{summary.pendingCount} <span className="text-lg font-medium text-gray-400">tagihan</span></h2>
          </div>
        </motion.div>

        {/* Data Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-zinc-900/80 border border-gray-200 dark:border-white/10 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Riwayat Transaksi</h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <select
                  value={timeFilter}
                  onChange={e => setTimeFilter(e.target.value)}
                  className="w-full sm:w-auto pl-4 pr-10 py-2 rounded-xl border border-purple-200/50 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/10 text-purple-900 dark:text-purple-100 hover:bg-purple-100/50 dark:hover:bg-purple-500/20 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm appearance-none cursor-pointer font-medium"
                >
                  <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Semua Waktu</option>
                  <option value="today" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Hari Ini</option>
                  <option value="7days" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">7 Hari Terakhir</option>
                  <option value="30days" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">30 Hari Terakhir</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto pl-4 pr-10 py-2 rounded-xl border border-purple-200/50 dark:border-purple-500/30 bg-purple-50/50 dark:bg-purple-500/10 text-purple-900 dark:text-purple-100 hover:bg-purple-100/50 dark:hover:bg-purple-500/20 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm appearance-none cursor-pointer font-medium"
                >
                  <option value="all" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Semua Status</option>
                  <option value="SUCCESS" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Berhasil</option>
                  <option value="PENDING" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Menunggu</option>
                  <option value="FAILED" className="bg-white dark:bg-zinc-800 text-gray-900 dark:text-white">Gagal</option>
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none" />
              </div>

              <div className="relative w-full sm:w-64">
                <input 
                  type="text" 
                  placeholder="Cari Invoice atau Email..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-black/20 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500/50 outline-none transition-all text-sm"
                />
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <th className="p-4 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice & Waktu</th>
                  <th className="p-4 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pelanggan</th>
                  <th className="p-4 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Paket Pembelian</th>
                  <th className="p-4 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Metode</th>
                  <th 
                    className="p-4 whitespace-nowrap text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-purple-700 transition-colors"
                    onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  >
                    Nominal <ArrowUpDown size={12} className={sortOrder === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                  </th>
                  <th className="p-4 pr-6 whitespace-nowrap text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-gray-400">
                      Tidak ada data transaksi yang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((t) => {
                    const statusColors: Record<string, string> = {
                      'SUCCESS': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
                      'PENDING': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
                      'FAILED': 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20',
                      'REFUNDED': 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20'
                    }
                    const badgeClass = statusColors[t.status.toUpperCase()] || 'bg-gray-100 text-gray-700'

                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 whitespace-nowrap">
                          <div className="font-mono text-sm text-purple-600 dark:text-purple-400">{t.invoiceId || t.id.substring(0, 8)}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{dayjs(t.createdAt).format('DD MMM YYYY, HH:mm')}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{t.user.name || '-'}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{t.user.email}</div>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">{t.plan?.name || '-'}</div>
                          {t.plan && <div className="text-[10px] uppercase tracking-wider text-purple-500">{t.plan.type}</div>}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="text-xs font-medium uppercase bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 px-2 py-1 rounded-md">
                            {t.paymentMethod || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(t.amount)}</div>
                          <div className="text-[10px] text-gray-500 uppercase">{t.currency}</div>
                        </td>
                        <td className="p-4 pr-6 whitespace-nowrap text-right">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold border ${badgeClass}`}>
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </RequirePermission>
  )
}
