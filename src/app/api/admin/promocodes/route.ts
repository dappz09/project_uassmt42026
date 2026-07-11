import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    const userPermissions = session.user.permissions || []
    
    if (userRole !== 'SuperAdmin' && !userPermissions.includes('view:promocodes') && !userPermissions.includes('*:*')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
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
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    const userPermissions = session.user.permissions || []
    
    if (userRole !== 'SuperAdmin' && !userPermissions.includes('view:promocodes') && !userPermissions.includes('*:*')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    let { code, discountPercent, discountAmount, maxUses, expiresAt, isActive } = body

    if (!code) {
      return NextResponse.json({ success: false, message: 'Kode promo wajib diisi' }, { status: 400 })
    }

    // Pastikan kode kapital dan tanpa spasi
    code = code.toUpperCase().replace(/\s+/g, '')

    // Cek apakah kode sudah ada
    const existing = await prisma.promoCode.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ success: false, message: 'Kode promo ini sudah digunakan' }, { status: 400 })
    }

    const newPromo = await prisma.promoCode.create({
      data: {
        code,
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ success: true, data: newPromo })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
