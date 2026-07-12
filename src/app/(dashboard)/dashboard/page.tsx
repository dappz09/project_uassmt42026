'use client'

import { motion } from 'framer-motion'
import { Users, FileText, Activity, Zap, ArrowUpRight, ArrowDownRight, MoreHorizontal, Wand2, History, CreditCard } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

// Dashboard stats interface
interface DashboardStats {
  totalUsers: number
  usersGrowth: number
  totalNotes: number
  notesGrowth: number
  totalPro: number
  proGrowth: number
  serverStatus: string
  chartData: Array<{ date: string; users: number; notes: number }>
  donutData: Array<{ name: string; value: number }>
  recentActivity: Array<{
    id: string
    action: string
    resource: string
    time: string
    userName: string
  }>
}

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b']

function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(async res => {
        const json = await res.json().catch(() => null)
        if (!res.ok || !json?.success) {
          throw new Error(json?.message || 'Gagal mengambil data')
        }
        return json.data
      })
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Fetch error:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="p-6 w-full max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan aktivitas sistem dan metrik platform NoteTube.</p>
        </div>

        {/* Stats Widgets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Widget: Total Pengguna */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Pengguna</h3>
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : stats?.totalUsers?.toLocaleString() || 0}
            </p>
            {stats && (
              <div className="flex items-center mt-2 gap-1">
                {stats.usersGrowth >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-500" />
                )}
                <span className={`text-xs font-medium ${stats.usersGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.usersGrowth > 0 ? '+' : ''}{stats.usersGrowth}% bulan ini
                </span>
              </div>
            )}
          </div>

          {/* Widget: Catatan Dibuat */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Catatan</h3>
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <FileText size={18} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : stats?.totalNotes?.toLocaleString() || 0}
            </p>
            {stats && (
              <div className="flex items-center mt-2 gap-1">
                {stats.notesGrowth >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-500" />
                )}
                <span className={`text-xs font-medium ${stats.notesGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.notesGrowth > 0 ? '+' : ''}{stats.notesGrowth} minggu ini
                </span>
              </div>
            )}
          </div>

          {/* Widget: Pengguna Pro */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pengguna Pro</h3>
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Zap size={18} className="fill-current" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? '...' : stats?.totalPro?.toLocaleString() || 0}
            </p>
            {stats && (
              <div className="flex items-center mt-2 gap-1">
                {stats.proGrowth >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-500" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-500" />
                )}
                <span className={`text-xs font-medium ${stats.proGrowth >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stats.proGrowth > 0 ? '+' : ''}{stats.proGrowth} hari ini
                </span>
              </div>
            )}
          </div>

          {/* Widget: Server Status */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Server Status</h3>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Activity size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {loading ? '...' : stats?.serverStatus || 'Normal'}
                </p>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Uptime 99.9%</p>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* User Growth Line Chart */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm lg:col-span-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Pertumbuhan Pengguna Baru (7 Hari)</h3>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Memuat grafik...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      name="Pengguna Baru" 
                      stroke="#8b5cf6" 
                      strokeWidth={3}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Plan Distribution Donut Chart */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Distribusi Paket</h3>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Memuat grafik...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.donutData || []}
                      cx="50%"
                      cy="45%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(stats?.donutData || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Notes Activity Bar Chart */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Aktivitas Pembuatan Catatan (7 Hari)</h3>
            <div className="h-[300px] w-full">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Memuat grafik...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" className="dark:opacity-20" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }}
                    />
                    <Bar dataKey="notes" name="Catatan Dibuat" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Recent Activity List */}
          <div className="p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-zinc-900 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aktivitas Terbaru</h3>
              <button className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400">Lihat Semua</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Memuat aktivitas...</div>
              ) : stats?.recentActivity && stats.recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivity.map((activity, idx) => (
                    <div key={activity.id || idx} className="flex gap-4 items-start pb-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500 flex-shrink-0">
                        {activity.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          <span className="font-semibold">{activity.userName}</span> melakukan <span className="font-medium text-purple-600 dark:text-purple-400">{activity.action}</span> pada <span className="font-medium">{activity.resource}</span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-zinc-800/50 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700">
                  <MoreHorizontal className="text-gray-400 mb-2" size={24} />
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada aktivitas signifikan yang terekam hari ini.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  )
}

import { useRouter } from 'next/navigation'

export default function DashboardOverviewPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const role = session?.user?.role || 'User'
  
  useEffect(() => {
    if (role === 'User') {
      router.push('/dashboard/create')
    }
  }, [role, router])

  if (role === 'User') {
    return (
      <div className="p-6 flex justify-center items-center h-64 w-full">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <AdminDashboard />
}