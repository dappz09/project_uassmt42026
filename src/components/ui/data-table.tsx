'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Download, Columns, Check } from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

export interface Column<T> {
  id: string
  label: string
  // For rendering in the UI
  render: (row: T) => React.ReactNode
  // For exporting to CSV (optional, fallback to stringifying the whole object if not provided, though typically we skip export if not provided)
  exportValue?: (row: T) => string
  // Custom class for TH and TD
  className?: string
}

interface DataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  searchPlaceholder?: string
  exportFilename?: string
  loading?: boolean
  emptyMessage?: string
  emptySubMessage?: string
  // Any extra toolbar elements (e.g. custom filters like role dropdown)
  toolbarExtras?: React.ReactNode
  // Global search function over all rows
  globalFilterFn?: (row: T, searchQuery: string) => boolean
}

export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  searchPlaceholder = 'Cari...',
  exportFilename = 'export_data',
  loading = false,
  emptyMessage = 'Tidak ada data ditemukan',
  emptySubMessage = 'Coba sesuaikan filter atau kata kunci pencarian Anda.',
  toolbarExtras,
  globalFilterFn
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showColumnsMenu, setShowColumnsMenu] = useState(false)
  const columnsMenuRef = useRef<HTMLDivElement>(null)

  // Initialize visible columns to true for all defined columns
  const initialVisibility = columns.reduce((acc, col) => {
    acc[col.id] = true
    return acc
  }, {} as Record<string, boolean>)

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(initialVisibility)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(event.target as Node)) {
        setShowColumnsMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [columnsMenuRef])

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Filter Data
  const filteredData = data.filter(row => {
    if (!searchQuery) return true
    if (globalFilterFn) {
      return globalFilterFn(row, searchQuery)
    }
    // Default naive search: check if any stringified property matches (not ideal for objects, but a fallback)
    return JSON.stringify(row).toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Export CSV
  const handleExportCSV = () => {
    const activeColumns = columns.filter(col => visibleColumns[col.id] && col.exportValue)
    if (activeColumns.length === 0) {
      toast.error('Tidak ada kolom yang dapat diekspor')
      return
    }

    const headers = activeColumns.map(col => col.label)
    const rows = filteredData.map(row => {
      return activeColumns.map(col => {
        let val = ''
        if (col.exportValue) {
          val = col.exportValue(row).replace(/"/g, '""') // escape double quotes
        }
        return `"${val}"`
      }).join(',')
    })

    const csvContent = [headers.join(','), ...rows].join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${exportFilename}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Data berhasil diekspor ke CSV')
  }

  return (
    <div className="w-full">
      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-6">
        
        {/* Left Side: Search & Extras */}
        <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all"
            />
          </div>
          {toolbarExtras}
        </div>

        {/* Right Side: Export & Columns */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          
          <div className="relative" ref={columnsMenuRef}>
            <button 
              onClick={() => setShowColumnsMenu(!showColumnsMenu)}
              className="flex items-center gap-2 bg-white dark:bg-black/20 hover:bg-gray-50 dark:hover:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 px-4 py-2.5 rounded-xl transition-all shadow-sm text-sm font-medium"
            >
              <Columns size={16} /> Kolom
            </button>
            
            <AnimatePresence>
              {showColumnsMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
                >
                  <div className="p-2 space-y-1">
                    {columns.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className="flex items-center gap-3 w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${visibleColumns[col.id] ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-600'}`}>
                          {visibleColumns[col.id] && <Check size={12} className="text-white" />}
                        </div>
                        {col.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm font-medium"
          >
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50/50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
              <tr>
                {columns.map(col => visibleColumns[col.id] && (
                  <th key={col.id} scope="col" className={`px-6 py-4 font-semibold ${col.className || ''}`}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mb-4" />
                      <p>Memuat data...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-base font-medium text-gray-900 dark:text-white">{emptyMessage}</p>
                      <p className="text-sm mt-1">{emptySubMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredData.map(row => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    {columns.map(col => visibleColumns[col.id] && (
                      <td key={col.id} className={`px-6 py-4 ${col.className || ''}`}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
