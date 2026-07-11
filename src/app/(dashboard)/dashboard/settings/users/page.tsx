'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, Filter } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import Link from 'next/link'
import { DataTable, Column } from '@/components/ui/data-table'

interface User {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  city?: string
  province?: string
  country?: string
  gender?: string
  isActive?: boolean
  role?: {
    id: string
    name: string
  }
}

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Custom Filter States
  const [roleFilter, setRoleFilter] = useState('All')
  const [cityFilter, setCityFilter] = useState('All')
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showCityMenu, setShowCityMenu] = useState(false)
  
  const roleMenuRef = useRef<HTMLDivElement>(null)
  const cityMenuRef = useRef<HTMLDivElement>(null)

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false)
      }
      if (cityMenuRef.current && !cityMenuRef.current.contains(event.target as Node)) {
        setShowCityMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [roleMenuRef, cityMenuRef])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/admin/users')
        const json = await res.json().catch(() => null)
        if (res.ok && json?.success) {
          setUsers(json.data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Unique values for filters
  const uniqueRoles = ['All', ...Array.from(new Set(users.map(u => u.role?.name || 'User')))]
  const uniqueCities = ['All', ...Array.from(new Set(users.filter(u => u.city).map(u => u.city as string)))]

  // Define table columns
  const columns: Column<User>[] = [
    {
      id: 'action',
      label: 'Aksi',
      className: 'w-24',
      render: (user) => (
        <div className="flex items-center gap-2">
          <RequirePermission action="read" resource="users">
            <Link href={`/dashboard/settings/users/${user.id}`} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Lihat Detail">
              <Eye size={16} />
            </Link>
          </RequirePermission>
          <RequirePermission action="update" resource="users">
            <button className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors" title="Edit">
              <Edit size={16} />
            </button>
          </RequirePermission>
          <RequirePermission action="delete" resource="users">
            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Hapus">
              <Trash2 size={16} />
            </button>
          </RequirePermission>
        </div>
      )
    },
    {
      id: 'name',
      label: 'Pengguna',
      exportValue: (user) => user.name || 'Pengguna Tanpa Nama',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="font-medium text-gray-900 dark:text-white">
            {user.name || 'Pengguna Tanpa Nama'}
          </div>
        </div>
      )
    },
    {
      id: 'email',
      label: 'Kontak (Email)',
      exportValue: (user) => user.email,
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
      )
    },
    {
      id: 'phone',
      label: 'Telepon',
      exportValue: (user) => user.phone || '-',
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300">{user.phone || '-'}</span>
      )
    },
    {
      id: 'gender',
      label: 'Gender',
      exportValue: (user) => user.gender || '-',
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300">{user.gender || '-'}</span>
      )
    },
    {
      id: 'address',
      label: 'Alamat',
      exportValue: (user) => user.address || '-',
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300 line-clamp-1 max-w-[150px]" title={user.address || ''}>
          {user.address || '-'}
        </span>
      )
    },
    {
      id: 'city',
      label: 'Kota',
      exportValue: (user) => user.city || '-',
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300">{user.city || '-'}</span>
      )
    },
    {
      id: 'province',
      label: 'Provinsi',
      exportValue: (user) => user.province || '-',
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300">{user.province || '-'}</span>
      )
    },
    {
      id: 'country',
      label: 'Negara',
      exportValue: (user) => user.country || '-',
      render: (user) => (
        <span className="text-gray-600 dark:text-gray-300">{user.country || '-'}</span>
      )
    },
    {
      id: 'status',
      label: 'Status',
      exportValue: (user) => user.isActive === false ? 'Nonaktif' : 'Aktif',
      render: (user) => (
        <span className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
          user.isActive === false 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/50' 
            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50'
        }`}>
          {user.isActive === false ? 'Nonaktif' : 'Aktif'}
        </span>
      )
    },
    {
      id: 'role',
      label: 'Peran',
      exportValue: (user) => user.role?.name || 'User',
      render: (user) => (
        <span className="px-2.5 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-medium border border-purple-200 dark:border-purple-800/50">
          {user.role?.name || 'User'}
        </span>
      )
    }
  ]

  // Global search & filter logic for DataTable
  const globalFilterFn = (row: User, searchQuery: string) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch = 
      (row.name || '').toLowerCase().includes(searchLower) ||
      (row.email || '').toLowerCase().includes(searchLower) ||
      (row.phone || '').toLowerCase().includes(searchLower) ||
      (row.address || '').toLowerCase().includes(searchLower) ||
      (row.city || '').toLowerCase().includes(searchLower) ||
      (row.province || '').toLowerCase().includes(searchLower) ||
      (row.country || '').toLowerCase().includes(searchLower)
      
    const matchesRole = roleFilter === 'All' ? true : (row.role?.name || 'User') === roleFilter
    
    return matchesSearch && matchesRole
  }

  // Pre-filter data for DataTable
  const preFilteredUsers = users.filter(user => {
    const matchesRole = roleFilter === 'All' ? true : (user.role?.name || 'User') === roleFilter
    const matchesCity = cityFilter === 'All' ? true : (user.city === cityFilter)
    return matchesRole && matchesCity
  })

  const filterToolbar = (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Role Filter Custom Dropdown */}
      <div className="relative w-full sm:w-48" ref={roleMenuRef}>
        <button 
          onClick={() => { setShowRoleMenu(!showRoleMenu); setShowCityMenu(false); }}
          className="flex justify-between items-center w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="truncate">{roleFilter === 'All' ? 'Semua Peran' : roleFilter}</span>
          </div>
        </button>
        <AnimatePresence>
          {showRoleMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                {uniqueRoles.map(role => (
                  <button
                    key={role}
                    onClick={() => { setRoleFilter(role); setShowRoleMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${roleFilter === role ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    {role === 'All' ? 'Semua Peran' : role}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* City Filter Custom Dropdown */}
      <div className="relative w-full sm:w-48" ref={cityMenuRef}>
        <button 
          onClick={() => { setShowCityMenu(!showCityMenu); setShowRoleMenu(false); }}
          className="flex justify-between items-center w-full px-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
        >
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <span className="truncate">{cityFilter === 'All' ? 'Semua Kota' : cityFilter}</span>
          </div>
        </button>
        <AnimatePresence>
          {showCityMenu && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-2 w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
            >
              <div className="p-2 space-y-1 max-h-60 overflow-y-auto">
                {uniqueCities.map(city => (
                  <button
                    key={city}
                    onClick={() => { setCityFilter(city); setShowCityMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${cityFilter === city ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}
                  >
                    {city === 'All' ? 'Semua Kota' : city}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )

  return (
    <RequirePermission action="read" resource="users">
      <div className="p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Manajemen Pengguna</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kelola pengguna, perbarui profil, dan tetapkan peran.</p>
            </div>
            <RequirePermission action="create" resource="users">
              <Link href="/dashboard/settings/users/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl transition-all text-sm font-medium shadow-lg shadow-purple-500/20 whitespace-nowrap">
                <Plus size={16} />
                <span>Tambah Pengguna</span>
              </Link>
            </RequirePermission>
          </div>

          <DataTable 
            data={preFilteredUsers}
            columns={columns}
            loading={loading}
            searchPlaceholder="Cari berdasarkan nama, email, alamat, atau kota..."
            exportFilename="users"
            emptyMessage="Tidak ada pengguna ditemukan"
            toolbarExtras={filterToolbar}
            globalFilterFn={globalFilterFn}
          />
          
        </motion.div>
      </div>
    </RequirePermission>
  )
}
