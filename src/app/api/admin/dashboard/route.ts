import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import dayjs from 'dayjs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    
    // In real app, check if user is SuperAdmin or Manager
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { role: true }
    })
    if (user?.role?.name !== 'SuperAdmin' && user?.role?.name !== 'Manager') {
      return errorResponse('Forbidden', 403)
    }

    const now = dayjs()
    
    // 1. Total Users & Growth (This month vs Last month)
    const startOfThisMonth = now.startOf('month').toDate()
    const startOfLastMonth = now.subtract(1, 'month').startOf('month').toDate()
    
    const totalUsers = await prisma.user.count()
    const usersThisMonth = await prisma.user.count({ where: { createdAt: { gte: startOfThisMonth } } })
    const usersLastMonth = await prisma.user.count({ 
      where: { 
        createdAt: { gte: startOfLastMonth, lt: startOfThisMonth } 
      } 
    })
    
    let usersGrowth = 0
    if (usersLastMonth === 0 && usersThisMonth > 0) usersGrowth = 100
    else if (usersLastMonth > 0) {
      usersGrowth = Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
    }

    // 2. Total Notes & Growth (This week vs Last week)
    const startOfThisWeek = now.startOf('week').toDate()
    const startOfLastWeek = now.subtract(1, 'week').startOf('week').toDate()
    
    const totalNotes = await prisma.note.count()
    const notesThisWeek = await prisma.note.count({ where: { createdAt: { gte: startOfThisWeek } } })
    const notesLastWeek = await prisma.note.count({ 
      where: { 
        createdAt: { gte: startOfLastWeek, lt: startOfThisWeek } 
      } 
    })
    const notesGrowth = notesThisWeek - notesLastWeek // Raw count difference

    // 3. Total Pro Users & Growth (Today vs Yesterday)
    const startOfToday = now.startOf('day').toDate()
    const startOfYesterday = now.subtract(1, 'day').startOf('day').toDate()
    
    const totalPro = await prisma.subscription.count({ where: { plan: 'Pro' } })
    const proToday = await prisma.subscription.count({ 
      where: { plan: 'Pro', createdAt: { gte: startOfToday } } 
    })
    const proYesterday = await prisma.subscription.count({ 
      where: { plan: 'Pro', createdAt: { gte: startOfYesterday, lt: startOfToday } } 
    })
    const proGrowth = proToday - proYesterday // Raw count difference

    // 4. Chart Data (Last 7 Days - Users & Notes)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const dStart = now.subtract(i, 'day').startOf('day').toDate()
      const dEnd = now.subtract(i, 'day').endOf('day').toDate()
      
      const dailyUsers = await prisma.user.count({ where: { createdAt: { gte: dStart, lte: dEnd } } })
      const dailyNotes = await prisma.note.count({ where: { createdAt: { gte: dStart, lte: dEnd } } })
      
      chartData.push({
        date: dayjs(dStart).format('DD MMM'),
        users: dailyUsers,
        notes: dailyNotes
      })
    }

    // 5. Donut Data (Plan Distribution)
    const freeCount = await prisma.subscription.count({ where: { plan: 'Free' } })
    // If no subscriptions found, maybe users are implicitly Free. 
    // We'll just count explicit subscriptions for now, plus users without subscriptions as Free.
    const explicitFreeCount = freeCount
    const explicitPaidCount = await prisma.subscription.count({ where: { plan: { not: 'Free' } } })
    const usersWithoutSub = totalUsers - (explicitFreeCount + explicitPaidCount)
    
    const actualFreeCount = explicitFreeCount + usersWithoutSub
    
    const donutData = [
      { name: 'Free', value: actualFreeCount },
      { name: 'Pro/Paid', value: explicitPaidCount }
    ]

    // 6. Recent Activity (AuditLog)
    const recentActivityRaw = await prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true, image: true } }
      }
    })

    const recentActivity = recentActivityRaw.map(log => ({
      id: log.id,
      action: log.action,
      resource: log.resource,
      time: dayjs(log.createdAt).format('HH:mm - DD MMM YYYY'),
      userName: log.user?.name || log.user?.email || 'System'
    }))

    return successResponse({
      totalUsers,
      usersGrowth,
      totalNotes,
      notesGrowth,
      totalPro,
      proGrowth,
      serverStatus: 'Healthy',
      chartData,
      donutData,
      recentActivity
    }, 'Dashboard stats retrieved')
  } catch (error: any) {
    console.error('Dashboard API error:', error)
    return errorResponse('Internal server error', 500, error.message)
  }
}
