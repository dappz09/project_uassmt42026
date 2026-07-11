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

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const id = params.id
    const body = await req.json()
    const { name, providerName, apiKey, publicApiKey, webhookUrl, isProduction, isActive, instructions, activeChannels } = body

    const oldGateway = await prisma.paymentGateway.findUnique({ where: { id } })

    const updated = await prisma.paymentGateway.update({
      where: { id },
      data: {
        name,
        providerName,
        apiKey: apiKey !== undefined ? (apiKey || null) : undefined,
        publicApiKey: publicApiKey !== undefined ? (publicApiKey || null) : undefined,
        webhookUrl: webhookUrl !== undefined ? (webhookUrl || null) : undefined,
        isProduction,
        isActive,
        instructions: instructions !== undefined ? (instructions || null) : undefined,
        activeChannels: activeChannels !== undefined ? (activeChannels ? JSON.stringify(activeChannels) : null) : undefined
      }
    })

    const session = await auth()
    
    // Log API Key change critically
    let details: any = { gatewayName: name || oldGateway?.name }
    if (oldGateway?.isProduction !== updated.isProduction) {
      details.modeChanged = { from: oldGateway?.isProduction ? 'Live' : 'Sandbox', to: updated.isProduction ? 'Live' : 'Sandbox' }
    }
    if (apiKey !== undefined && oldGateway?.apiKey !== apiKey) {
      details.apiKeyUpdated = true // Don't save the actual key in log, just a boolean flag
    }

    await logActivity({
      userId: session?.user?.id,
      action: 'UPDATE',
      resource: 'PAYMENT_GATEWAY',
      details,
      req
    })

    return NextResponse.json({ success: true, message: 'Metode Pembayaran berhasil diperbarui', data: updated })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Metode tidak ditemukan' }, { status: 404 })
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Nama Metode Pembayaran sudah digunakan!' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    const id = params.id

    const gateway = await prisma.paymentGateway.findUnique({ where: { id } })

    await prisma.paymentGateway.delete({
      where: { id }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'DELETE',
      resource: 'PAYMENT_GATEWAY',
      details: { deletedGateway: gateway?.name, provider: gateway?.providerName },
      req
    })

    return NextResponse.json({ success: true, message: 'Metode Pembayaran berhasil dihapus' })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Metode tidak ditemukan' }, { status: 404 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
