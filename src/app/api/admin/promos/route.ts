import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { logActivity } from '@/lib/audit-logger'

export const dynamic = 'force-dynamic'

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

    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: promos })
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
    const { code, discountPercent, discountAmount, maxUses, expiresAt, isActive } = body

    if (!code) {
      return NextResponse.json({ success: false, message: 'Kode Promo wajib diisi' }, { status: 400 })
    }

    // Pastikan kode unik
    const existing = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    })
    
    if (existing) {
      return NextResponse.json({ success: false, message: 'Kode Promo sudah digunakan' }, { status: 400 })
    }

    const item = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'PROMO',
      details: { code: item.code }
    })

    return NextResponse.json({ success: true, data: item })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
