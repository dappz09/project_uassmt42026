import { prisma } from '@/lib/prisma'
import { LandingClient } from './landing-client'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  })

  // Format to match the client interface
  const formattedPlans = plans.map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    price: p.price,
    interval: p.interval,
    features: p.features
  }))

  return <LandingClient plans={formattedPlans} />
}