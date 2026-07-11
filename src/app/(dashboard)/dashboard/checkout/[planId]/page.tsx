import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import CheckoutClient from './checkout-client'

export default async function CheckoutPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = await params
  
  const plan = await prisma.plan.findUnique({
    where: { id: planId }
  })

  if (!plan) return notFound()

  const formattedPlan = {
    id: plan.id,
    name: plan.name,
    type: plan.type,
    price: plan.price,
    interval: plan.interval,
    features: plan.features
  }

  return <CheckoutClient plan={formattedPlan} />
}
