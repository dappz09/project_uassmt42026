'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Zap } from 'lucide-react'

export function UserPlanBadge() {
  const [plan, setPlan] = useState<string>('Free')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.plan) {
          setPlan(data.data.plan)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading || plan === 'Free') return null

  const isPro = plan.toLowerCase().includes('pro')

  return (
    <div className={`ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider flex items-center gap-1 ${
      isPro 
        ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-sm shadow-purple-500/20' 
        : 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20'
    }`}>
      {isPro ? <Zap size={10} className="fill-current" /> : <Sparkles size={10} />}
      {plan.toUpperCase()}
    </div>
  )
}
