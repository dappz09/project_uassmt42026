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

export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 })
    }

    // Ambil limit dari query param, default 100 log terakhir agar tidak memberatkan server
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '200')

    const logs = await prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
