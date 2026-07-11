import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logActivity } from '@/lib/audit-logger'

const isAdmin = async () => {
  const session = await auth()
  if (!session?.user?.email) return false
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true }
  })
  
  return user?.role?.name === 'SuperAdmin' || user?.role?.name === 'Manager'
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const plans = await prisma.plan.findMany({
      orderBy: { price: 'asc' },
      include: {
        aiModel: true // Ambil detail AiModel yang terpasang di paket ini
      }
    })

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { name, type, price, interval, features, limitCount, aiModelId, isActive } = body

    if (!name) {
      return NextResponse.json({ success: false, message: 'Nama Paket wajib diisi' }, { status: 400 })
    }

    const item = await prisma.plan.create({
      data: {
        name,
        type: type || 'Free',
        price: parseFloat(price) || 0,
        interval: interval || 'month',
        features: features ? JSON.stringify(features) : null,
        limitCount: parseInt(limitCount) || 0,
        aiModelId: aiModelId || null,
        isActive: isActive !== undefined ? isActive : true
      },
      include: { aiModel: true }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'PLAN',
      details: { planName: name, price: item.price, interval: item.interval },
      req
    })

    return NextResponse.json({ success: true, message: 'Paket berhasil ditambahkan', data: item })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Nama Paket sudah digunakan!' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
