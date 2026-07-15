'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CreditCard, CheckCircle2, AlertCircle, Clock } from 'lucide-react'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  interval: string
  features: string | null
}

export default function CheckoutClient({ plan }: { plan: Plan }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handlePayment = async () => {
    setLoading(true)
    
    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.id, planType: plan.type })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || 'Gagal memproses pembayaran')
      }

      setSuccess(true)
      toast.success('Pembayaran Berhasil! Paket Anda telah diperbarui.')
      
      // Redirect back to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh() // force refresh to update layout data
      }, 2000)

    } catch (err: any) {
      toast.error(err.message)
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-6 w-full max-w-3xl mx-auto h-full flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-xl"
      >
        {success ? (
          <div className="text-center py-12">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle2 size={48} />
            </motion.div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Pembayaran Berhasil!</h2>
            <p className="text-gray-500 dark:text-gray-400">Terima kasih, akun Anda kini telah diupgrade ke paket <strong className="text-gray-900 dark:text-white">{plan.name}</strong>.</p>
            <p className="text-sm text-gray-400 mt-2">Mengarahkan kembali ke dashboard...</p>
          </div>
        ) : (
          <>
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-full flex items-center justify-center mb-6"
              >
                <Clock size={48} />
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Coming Soon!</h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-8">
                Fitur pembayaran otomatis saat ini sedang dalam tahap pengembangan dan akan segera hadir. Terima kasih atas ketertarikan Anda pada paket <strong className="text-gray-900 dark:text-white">{plan.name}</strong>.
              </p>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 rounded-xl font-medium text-white bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 transition shadow-lg"
              >
                Kembali ke Dashboard
              </button>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
