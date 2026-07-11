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

export async function PUT(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await props.params
    const body = await req.json()
    const { name, type, price, interval, features, limitCount, aiModelId, isActive } = body

    const oldPlan = await prisma.plan.findUnique({ where: { id } })

    const updated = await prisma.plan.update({
      where: { id },
      data: {
        name,
        type,
        price: price !== undefined ? (parseFloat(price) || 0) : undefined,
        interval,
        features: features !== undefined ? (features ? JSON.stringify(features) : null) : undefined,
        limitCount: limitCount !== undefined ? (parseInt(limitCount) || 0) : undefined,
        aiModelId: aiModelId !== undefined ? (aiModelId || null) : undefined,
        isActive
      },
      include: { aiModel: true }
    })

    const session = await auth()
    
    // Simpan detail log apa yang berubah (misal harga berubah)
    let details: any = { planName: name || oldPlan?.name }
    if (oldPlan?.price !== updated.price) {
      details.priceChanged = { from: oldPlan?.price, to: updated.price }
    }
    if (oldPlan?.aiModelId !== updated.aiModelId) {
      details.aiModelChanged = true
    }

    await logActivity({
      userId: session?.user?.id,
      action: 'UPDATE',
      resource: 'PLAN',
      details,
      req
    })

    return NextResponse.json({ success: true, message: 'Paket berhasil diperbarui', data: updated })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Paket tidak ditemukan' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Nama Paket sudah digunakan!' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error', error: error?.message, stack: error?.stack }, { status: 500 })
  }
}

export async function DELETE(req: Request, props: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await props.params

    // Opsional: Cek jika paket sedang disubscribe (Jika kita punya relasi users -> plan)
    const plan = await prisma.plan.findUnique({ 
      where: { id },
      include: {
        _count: {
          // Asumsi ada relasi subscription dari User ke Plan nantinya
        }
      }
    })

    await prisma.plan.delete({
      where: { id }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'DELETE',
      resource: 'PLAN',
      details: { deletedPlan: plan?.name, price: plan?.price },
      req
    })

    return NextResponse.json({ success: true, message: 'Paket berhasil dihapus' })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Paket tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
