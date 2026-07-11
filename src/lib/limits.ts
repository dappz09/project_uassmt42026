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
  today.setHours(0, 0, 0, 0)

  const count = await prisma.usageRecord.count({
    where: { userId, createdAt: { gte: today } },
  })

  return count < limit
}
