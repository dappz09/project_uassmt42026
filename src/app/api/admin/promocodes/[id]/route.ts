import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params
    const body = await req.json()
    let { code, discountPercent, discountAmount, maxUses, expiresAt, isActive } = body

    if (!code) {
      return NextResponse.json({ success: false, message: 'Kode promo wajib diisi' }, { status: 400 })
    }

    code = code.toUpperCase().replace(/\s+/g, '')

    // Cek apakah kode sudah digunakan oleh entitas lain
    const existing = await prisma.promoCode.findFirst({ where: { code, id: { not: id } } })
    if (existing) {
      return NextResponse.json({ success: false, message: 'Kode promo ini sudah digunakan' }, { status: 400 })
    }

    const updated = await prisma.promoCode.update({
      where: { id },
      data: {
        code,
        discountPercent: discountPercent ? parseFloat(discountPercent) : null,
        discountAmount: discountAmount ? parseFloat(discountAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    await prisma.promoCode.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Kode Promo berhasil dihapus' })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
