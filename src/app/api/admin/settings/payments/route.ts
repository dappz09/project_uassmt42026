import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

// Get Payment Methods Settings
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('view:settings') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    let setting = await prisma.setting.findUnique({
      where: { key: 'payment_methods' }
    })

    if (!setting) {
      // Create default
      const defaultMethods = [
        { id: 'stripe', name: 'Credit Card (Stripe)', active: false, icon: 'credit-card' },
        { id: 'paypal', name: 'PayPal', active: false, icon: 'paypal' },
        { id: 'bank_transfer', name: 'Bank Transfer (Manual)', active: true, icon: 'building' }
      ]
      setting = await prisma.setting.create({
        data: {
          key: 'payment_methods',
          value: JSON.stringify(defaultMethods),
          description: 'Konfigurasi Metode Pembayaran'
        }
      })
    }

    return successResponse(JSON.parse(setting.value))
  } catch (error) {
    return errorResponse('Gagal mengambil metode pembayaran', 500)
  }
}

// Update Payment Methods Settings
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('update:settings') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    const body = await req.json()
    const { methods } = body

    if (!Array.isArray(methods)) {
      return errorResponse('Format data tidak valid', 400)
    }

    const setting = await prisma.setting.upsert({
      where: { key: 'payment_methods' },
      update: {
        value: JSON.stringify(methods)
      },
      create: {
        key: 'payment_methods',
        value: JSON.stringify(methods),
        description: 'Konfigurasi Metode Pembayaran'
      }
    })

    return successResponse(JSON.parse(setting.value), 'Metode pembayaran berhasil disimpan')
  } catch (error) {
    return errorResponse('Gagal menyimpan metode pembayaran', 500)
  }
}
