import { prisma } from '@/lib/prisma'

export async function checkUserLimit(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  })

  // Jika tidak punya subscription aktif, anggap saja Free plan
  const planType = (user?.subscription?.status === 'active' && user?.subscription?.plan) 
    ? user.subscription.plan 
    : 'Free'

  // Cari config paket ini di database
  const activePlan = await prisma.plan.findFirst({
    where: { type: planType, isActive: true }
  })

  // Jika paket tidak ditemukan, anggap limit habis
  if (!activePlan) return false

  const limit = activePlan.limitCount
  if (limit === 0) return true // 0 berarti unlimited/tanpa batas

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const count = await prisma.usageRecord.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })

  return count < limit
}

export async function getRemainingLimit(userId: string): Promise<number | 'unlimited'> {
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

  if (!activePlan) return 0

  const limit = activePlan.limitCount
  if (limit === 0) return 'unlimited'

  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const count = await prisma.usageRecord.count({
    where: { userId, createdAt: { gte: startOfMonth } },
  })

  return Math.max(0, limit - count)
}

export async function consumeLimit(userId: string, amount: number, action: string = 'summarize'): Promise<void> {
  if (amount <= 0) return
  
  const records = Array.from({ length: amount }).map(() => ({
    userId,
    action
  }))

  await prisma.usageRecord.createMany({
    data: records
  })
}
