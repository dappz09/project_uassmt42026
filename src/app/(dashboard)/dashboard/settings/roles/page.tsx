'use client'
import { motion } from 'framer-motion'
import { Plus, Edit, Trash2, Eye, ShieldAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { RequirePermission } from '@/components/auth/require-permission'
import Link from 'next/link'
import { DataTable, Column } from '@/components/ui/data-table'

interface Role {
  id: string
  name: string
  description?: string
  _count?: {
    users: number
    permissions: number
  }
}

export default function RolesSettingsPage() {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)

  const fetchRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles')
      const json = await res.json().catch(() => null)
      if (res.ok && json?.success) {
        setRoles(json.data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (name === 'SuperAdmin') {
      alert('SuperAdmin tidak dapat dihapus!')
      return
    }
    if (!confirm(`Yakin ingin menghapus peran ${name}?`)) return
    try {
      const res = await fetch(`/api/admin/roles/${id}`, { method: 'DELETE' })
      if (res.ok) fetchRoles()
      else {
        const err = await res.json()
        alert(err.message || 'Gagal menghapus peran')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const columns: Column<Role>[] = [
    {
      id: 'action',
      label: 'Aksi',
      className: 'w-32',
      render: (role) => (
        <div className="flex gap-2">
          <RequirePermission action="show" resource="roles">
            <Link href={`/dashboard/settings/roles/${role.id}`} className="text-purple-500 hover:text-purple-600 dark:text-purple-400 dark:hover:text-purple-300 transition-colors flex items-center justify-center bg-purple-50 dark:bg-purple-500/10 w-8 h-8 rounded-lg" title="Detail Peran (Atur Hak Akses)">
              <Eye size={16} />
            </Link>
          </RequirePermission>
          <RequirePermission action="update" resource="roles">
            <button className="text-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center bg-blue-50 dark:bg-blue-500/10 w-8 h-8 rounded-lg" title="Edit Nama Peran"><Edit size={16} /></button>
          </RequirePermission>
          <RequirePermission action="delete" resource="roles">
            <button onClick={() => handleDelete(role.id, role.name)} className="text-red-500 hover:text-red-600 transition-colors flex items-center justify-center bg-red-50 dark:bg-red-500/10 w-8 h-8 rounded-lg" title="Hapus Peran"><Trash2 size={16} /></button>
          </RequirePermission>
        </div>
      )
    },
    {
      id: 'name',
      label: 'Nama Peran',
      exportValue: (role) => role.name,
      render: (role) => (
        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
          {role.name === 'SuperAdmin' && <ShieldAlert size={16} className="text-amber-500" />}
          {role.name}
        </div>
      )
    },
    {
      id: 'description',
      label: 'Deskripsi',
      exportValue: (role) => role.description || '-',
      render: (role) => (
        <span className="text-gray-500 dark:text-gray-400">{role.description || '-'}</span>
      )
    },
    {
      id: 'users',
      label: 'Jumlah Pengguna',
      exportValue: (role) => String(role._count?.users || 0),
      render: (role) => (
        <span className="px-2 py-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium inline-block text-center w-full max-w-[100px]">
          {role._count?.users || 0} Users
        </span>
      )
    },
    {
      id: 'permissions',
      label: 'Jumlah Izin',
      exportValue: (role) => role.name === 'SuperAdmin' ? 'All (∞)' : String(role._count?.permissions || 0),
      render: (role) => (
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-medium inline-block text-center w-full max-w-[120px]">
          {role.name === 'SuperAdmin' ? 'All (∞)' : `${role._count?.permissions || 0} Permissions`}
        </span>
      )
    }
  ]

  const globalFilterFn = (row: Role, query: string) => {
    const q = query.toLowerCase()
    return (
      row.name.toLowerCase().includes(q) ||
      (row.description || '').toLowerCase().includes(q)
    )
  }

  return (
    <div className="p-6 w-full">
      <RequirePermission 
        action="view" 
        resource="roles" 
        fallback={<div className="p-8 text-center text-red-500 font-medium">Akses Ditolak. Anda tidak memiliki izin melihat data peran.</div>}
      >
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
          <div className="mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Peran & Hak Akses</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Kelola daftar peran (Roles) dalam sistem.</p>
            </div>
            
            <RequirePermission action="create" resource="roles">
              <Link href="/dashboard/settings/roles/new" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl transition-all text-sm font-medium shadow-lg shadow-purple-500/20">
                <Plus size={16} />
                <span>Tambah Peran</span>
              </Link>
            </RequirePermission>
          </div>
          
          <DataTable 
            data={roles}
            columns={columns}
            loading={loading}
            searchPlaceholder="Cari peran atau deskripsi..."
            exportFilename="roles"
            emptyMessage="Tidak ada peran ditemukan"
            globalFilterFn={globalFilterFn}
          />
        </motion.div>
      </RequirePermission>
    </div>
  )
}
