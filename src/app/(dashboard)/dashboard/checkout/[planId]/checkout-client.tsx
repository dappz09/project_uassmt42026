'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { CreditCard, CheckCircle2, AlertCircle } from 'lucide-react'

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
            <div className="mb-8 border-b border-gray-100 dark:border-white/5 pb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Checkout Pembayaran</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Selesaikan pembayaran untuk mengaktifkan paket Anda.</p>
            </div>

            <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-6 mb-8 border border-gray-100 dark:border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 dark:text-gray-400">Paket Pilihan</span>
                <span className="font-semibold text-gray-900 dark:text-white bg-purple-100 dark:bg-purple-900/30 text-purple-600 px-3 py-1 rounded-full text-sm">
                  {plan.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 dark:text-gray-400">Total Tagihan</span>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(plan.price)}
                </span>
              </div>
            </div>

            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-xl text-sm flex items-start gap-3 border border-blue-100 dark:border-blue-800/30">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Mode Simulasi Aktif</p>
                <p>Klik tombol di bawah untuk menyimulasikan pembayaran yang berhasil. Sistem akan otomatis mengubah status langganan Anda.</p>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses Pembayaran...
                </>
              ) : (
                <>
                  <CreditCard size={20} />
                  Simulasi Bayar Sekarang
                </>
              )}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
