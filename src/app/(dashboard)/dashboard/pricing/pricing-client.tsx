'use client'
import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  interval: string
  features: string | null
}

export default function PricingClient({ plans }: { plans: Plan[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    setLoadingId(planId)
    // Simulasi checkout atau direct routing ke payment form
    toast.success('Diarahkan ke pembayaran...')
    setTimeout(() => {
      router.push(`/dashboard/checkout/${planId}`)
    }, 1000)
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full py-10">
        <div className="text-center mb-16">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Pilih Paket Terbaik Untuk Anda</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Tingkatkan produktivitas belajar Anda dengan kuota tanpa batas dan fitur canggih AI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isPro = plan.price > 0
            let featuresList: string[] = []
            if (plan.features) {
              try {
                // Parse JSON from database
                const parsed = JSON.parse(plan.features)
                featuresList = Array.isArray(parsed) ? parsed : plan.features.split('\n')
              } catch (e) {
                featuresList = plan.features.split('\n')
              }
            }

            return (
              <div 
                key={plan.id}
                className={`p-8 rounded-3xl flex flex-col relative ${
                  isPro 
                    ? 'border-2 border-purple-500/50 bg-white dark:bg-zinc-900 shadow-[0_0_40px_rgba(168,85,247,0.2)] dark:shadow-[0_0_40px_rgba(168,85,247,0.15)]' 
                    : 'border border-gray-200 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl'
                }`}
              >
                {isPro && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg flex items-center gap-1">
                    <Zap size={14} className="fill-current"/> Paling Populer
                  </div>
                )}

                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{plan.type} Plan</p>
                
                <div className="mb-6 flex items-baseline flex-wrap gap-2">
                  <span className="text-3xl lg:text-4xl xl:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">{formatCurrency(plan.price)}</span>
                  {plan.price > 0 && <span className="text-gray-500 font-medium whitespace-nowrap">/ {plan.interval}</span>}
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {featuresList.length > 0 ? featuresList.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-gray-700 dark:text-gray-300 text-sm">
                      <Check size={18} className={`shrink-0 mt-0.5 ${isPro ? 'text-purple-500' : 'text-emerald-500'}`}/> 
                      <span>{feat}</span>
                    </li>
                  )) : (
                    <li className="text-gray-400 italic text-sm">Tidak ada fitur spesifik dicantumkan.</li>
                  )}
                </ul>

                <button 
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingId === plan.id}
                  className={`w-full py-3 rounded-xl font-semibold transition-all ${
                    isPro 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/30 hover:scale-[1.02]' 
                      : 'border-2 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {loadingId === plan.id ? 'Memproses...' : (isPro ? 'Upgrade Sekarang' : 'Pilih Paket Ini')}
                </button>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}
