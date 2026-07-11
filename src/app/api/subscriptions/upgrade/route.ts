import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { planId, planType } = await req.json()

    if (!planId || !planType) {
      return NextResponse.json({ success: false, message: 'Plan ID and Type are required' }, { status: 400 })
    }

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { userId: session.user.id },
      update: {
        plan: planType,
        status: 'active',
      },
      create: {
        userId: session.user.id,
        plan: planType,
        status: 'active',
      }
    })

    // Catat log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'UPGRADE_PLAN',
        resource: 'SUBSCRIPTION',
        details: JSON.stringify({ planId, planType })
      }
    })

    return NextResponse.json({ success: true, message: 'Subscription updated' })
  } catch (error: any) {
    console.error('Subscription upgrade error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
