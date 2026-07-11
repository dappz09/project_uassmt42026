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

    const catalog = await prisma.aiCatalog.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: catalog })
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
    const { providerName, providerValue, models } = body

    if (!providerName || !providerValue || !models) {
      return NextResponse.json({ success: false, message: 'Semua kolom wajib diisi' }, { status: 400 })
    }

    const item = await prisma.aiCatalog.create({
      data: {
        providerName,
        providerValue,
        models
      }
    })

    const session = await auth()
    await logActivity({
      userId: session?.user?.id,
      action: 'CREATE',
      resource: 'AI_CATALOG',
      details: { providerName, providerValue, models },
      req
    })

    return NextResponse.json({ success: true, message: 'Katalog AI berhasil ditambahkan', data: item })
  } catch (error: any) {
    console.error('API Error:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, message: 'Provider Value (Kode) sudah ada!' }, { status: 400 })
    }
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
