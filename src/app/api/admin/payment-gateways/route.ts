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

    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: gateways })
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
    const { name, providerName, apiKey, publicApiKey, webhookUrl, isProduction, isActive, instructions, activeChannels } = body

    if (!name || !providerName) {
      return NextResponse.json({ success: false, message: 'Nama dan Provider wajib diisi' }, { status: 400 })
    }

    const item = await prisma.paymentGateway.create({
      data: {
        name,
        providerName,
        apiKey: apiKey || null,
        publicApiKey: publicApiKey || null,
        webhookUrl: webhookUrl || null,
        isProduction: isProduction || false,
        isActive: isActive !== undefined ? isActive : true,
        instructions: instructions || null,
        activeChannels: activeChannels ? JSON.stringify(activeChannels) : null
      }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'PAYMENT_GATEWAY',
      details: { 
        name, 
        providerName, 
        isProduction,
        hasApiKey: !!apiKey,
        activeChannels
      },
      req
    })

    return NextResponse.json({ success: true, message: 'Metode Pembayaran berhasil ditambahkan', data: item })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Nama Metode Pembayaran sudah digunakan!' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
