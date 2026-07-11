'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Plan {
  id: string
  name: string
  type: string
  price: number
  interval: string
  features: string | null
}

export default function PricingClient({ plans, isLoggedIn }: { plans: Plan[], isLoggedIn: boolean }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleUpgrade = async (planId: string) => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }

    setLoadingId(planId)
    // Note: Here we pass the planId to checkout, currently it's hardcoded to /api/stripe/checkout
    const res = await fetch('/api/stripe/checkout', { method: 'POST', body: JSON.stringify({ planId }) })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setLoadingId(null)
    }
  }

  const formatCurrency = (amount: number) => {
    if (amount === 0) return 'Gratis'
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Pilih Paket Anda</h1>
          <p className="text-gray-600">Upgrade untuk akses tanpa batas</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const isPro = plan.price > 0
            const featuresList = plan.features ? plan.features.split('\n') : []

            return (
              <div 
                key={plan.id}
                className={`p-8 rounded-xl flex flex-col relative ${
                  isPro 
                    ? 'bg-white shadow-lg border-2 border-blue-500' 
                    : 'bg-white shadow-sm border'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                    POPULER
                  </div>
                )}

                <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
                <p className="text-gray-500 mb-6">{plan.type} Plan</p>
                
                <div className="mb-6 flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{formatCurrency(plan.price)}</span>
                  {plan.price > 0 && <span className="text-gray-500">/{plan.interval}</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {featuresList.length > 0 ? featuresList.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">✓</span>
                      <span>{feat}</span>
                    </li>
                  )) : (
                    <li className="text-gray-400 italic text-sm">Tidak ada fitur spesifik dicantumkan.</li>
                  )}
                </ul>

                <Button 
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={loadingId === plan.id}
                  variant={isPro ? "default" : "outline"}
                  className={`w-full ${isPro ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  {loadingId === plan.id ? 'Memproses...' : (isPro ? 'Upgrade Sekarang' : 'Pilih Paket Ini')}
                </Button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
