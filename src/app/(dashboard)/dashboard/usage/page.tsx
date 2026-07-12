import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { UsageClient } from './usage-client'

export const metadata = {
  title: 'Penggunaan Limit - NoteTube',
}

export default async function UsagePage() {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect('/login')
  }
  
  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  })

  const planType = (user?.subscription?.status === 'active' && user?.subscription?.plan) 
    ? user.subscription.plan 
    : 'Free'

  const activePlan = await prisma.plan.findFirst({
    where: { type: planType, isActive: true }
  })

  // Default limit 10 jika plan tidak ditemukan
  const limit = activePlan ? activePlan.limitCount : 10

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
  const daysUntilReset = Math.ceil((nextMonth.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const count = await prisma.usageRecord.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })

  return <UsageClient count={count} limit={limit} planType={planType} daysUntilReset={daysUntilReset} />
}

