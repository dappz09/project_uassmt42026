'use client'

import { motion } from 'framer-motion'
import { History } from 'lucide-react'

export default function HistoryPage() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Riwayat Catatan</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lihat semua ringkasan YouTube yang pernah Anda buat sebelumnya.
          </p>
        </div>

        <div className="p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-xl backdrop-blur-xl min-h-[400px] flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
            <History size={32} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Belum Ada Riwayat</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md">
            Anda belum membuat ringkasan catatan apapun. Mulai konversi video YouTube pertama Anda sekarang!
          </p>
        </div>
      </motion.div>
    </div>
  )
}
