import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    // Periksa izin 'view:transactions'
    const userRole = session.user.role
    const userPermissions = session.user.permissions || []
    
    if (userRole !== 'SuperAdmin' && !userPermissions.includes('view:transactions') && !userPermissions.includes('*:*')) {
      return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 })
    }

    // Ambil semua transaksi dengan relasi user dan plan
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        plan: { select: { id: true, name: true, type: true } }
      }
    })

    // Hitung ringkasan (Summary)
    let totalRevenue = 0
    let successCount = 0
    let pendingCount = 0

    transactions.forEach(t => {
      if (t.status === 'SUCCESS') {
        totalRevenue += t.amount
        successCount++
      } else if (t.status === 'PENDING') {
        pendingCount++
      }
    })

    return NextResponse.json({ 
      success: true, 
      data: {
        transactions,
        summary: {
          totalRevenue,
          successCount,
          pendingCount,
          totalTransactions: transactions.length
        }
      }
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 })
  }
}
