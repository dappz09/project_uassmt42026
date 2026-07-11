import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

const isAdmin = async () => {
  const session = await auth()
  if (!session?.user?.email) return false
  
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { role: true }
  })
  
  return user?.role?.name === 'SuperAdmin' || user?.role?.name === 'Manager'
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { provider, name, apiKey } = body

    const updated = await prisma.aiModel.update({
      where: { id },
      data: {
        provider,
        name,
        apiKey
      }
    })

    return NextResponse.json({ success: true, message: 'Model AI berhasil diperbarui', data: updated })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Model AI tidak ditemukan' }, { status: 404 })
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
    
    // Opsional: Cek apakah model ini sedang dipakai oleh sebuah Plan
    const plansUsingModel = await prisma.plan.count({
      where: { aiModelId: id }
    })

    if (plansUsingModel > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Gagal menghapus. Model ini sedang digunakan oleh ${plansUsingModel} paket langganan.` 
      }, { status: 400 })
    }

    await prisma.aiModel.delete({
      where: { id }
    })

    return NextResponse.json({ success: true, message: 'Model AI berhasil dihapus' })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Model AI tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
