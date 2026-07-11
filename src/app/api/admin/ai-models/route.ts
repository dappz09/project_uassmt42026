import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Memeriksa apakah user adalah admin
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

    const aiModels = await prisma.aiModel.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: aiModels })
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
    const { provider, name, apiKey } = body

    if (!provider || !name || !apiKey) {
      return NextResponse.json({ success: false, message: 'Provider, name, dan API key wajib diisi' }, { status: 400 })
    }

    const aiModel = await prisma.aiModel.create({
      data: {
        provider,
        name,
        apiKey
      }
    })

    return NextResponse.json({ success: true, message: 'Model AI berhasil ditambahkan', data: aiModel })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
