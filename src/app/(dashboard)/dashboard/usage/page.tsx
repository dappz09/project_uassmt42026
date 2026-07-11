'use client'

import { motion } from 'framer-motion'
import { BarChart3, Zap } from 'lucide-react'
import Link from 'next/link'

export default function UsagePage() {
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">Penggunaan Limit</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pantau kuota ringkasan AI Anda bulan ini.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 shadow-xl backdrop-blur-xl">
             <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
               <BarChart3 size={20}/> Kuota Tersedia
             </h3>
             <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
               5 <span className="text-lg font-normal text-gray-500 dark:text-gray-400">/ 10 Video</span>
             </div>
             <div className="w-full bg-gray-200 dark:bg-zinc-800 rounded-full h-2.5 mb-4">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2.5 rounded-full w-1/2"></div>
             </div>
             <p className="text-sm text-gray-500 dark:text-gray-400">Direset dalam 14 hari</p>
          </div>

          <div className="p-8 rounded-2xl border border-purple-500/20 bg-purple-50 dark:bg-purple-500/10 shadow-xl backdrop-blur-xl flex flex-col items-center justify-center text-center">
            <Zap className="text-purple-600 dark:text-purple-400 mb-3" size={32} />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Butuh Lebih Banyak?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upgrade ke Pro untuk kuota tanpa batas dan fitur eksklusif lainnya.
            </p>
            <Link href="/dashboard/pricing" className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
              Upgrade Sekarang
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
