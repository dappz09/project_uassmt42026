import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import PricingClient from './pricing-client'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const session = await auth()
  
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })
  
  const formattedPlans = plans.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    price: p.price,
    interval: p.interval,
    features: p.features
  }))

  return <PricingClient plans={formattedPlans} isLoggedIn={!!session?.user} />
}