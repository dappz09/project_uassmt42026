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

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const catalog = await prisma.aiCatalog.findUnique({
      where: { id }
    })

    if (!catalog) {
      return NextResponse.json({ success: false, message: 'Katalog tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: catalog })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { providerName, providerValue, models, isActive } = body

    const updated = await prisma.aiCatalog.update({
      where: { id },
      data: {
        providerName,
        providerValue,
        models,
        isActive
      }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'UPDATE',
      resource: 'AI_CATALOG',
      details: { id, providerName, providerValue, models, isActive },
      req
    })

    return NextResponse.json({ success: true, message: 'Katalog berhasil diperbarui', data: updated })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Katalog tidak ditemukan' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Provider Value (Kode) sudah ada!' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params

    // Opsional: Cek jika provider ini sedang dipakai oleh sebuah kunci di AiModel
    const catalogItem = await prisma.aiCatalog.findUnique({ where: { id } })
    if (catalogItem) {
      const usingProvider = await prisma.aiModel.count({
        where: { provider: catalogItem.providerValue }
      })
      if (usingProvider > 0) {
        return NextResponse.json({ 
          success: false, 
          message: `Gagal. Provider ini sedang digunakan di ${usingProvider} konfigurasi Kunci AI.` 
        }, { status: 400 })
      }
    }

    await prisma.aiCatalog.delete({
      where: { id }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'DELETE',
      resource: 'AI_CATALOG',
      details: { id, deletedProvider: catalogItem?.providerName },
      req
    })

    return NextResponse.json({ success: true, message: 'Katalog berhasil dihapus' })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Katalog tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
