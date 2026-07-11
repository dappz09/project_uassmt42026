import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

// Get current user profile
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        phone: true,
        address: true,
        city: true,
        province: true,
        country: true,
        gender: true,
        isActive: true,
        createdAt: true,
        subscription: true
      }
    })

    if (!user) {
      return errorResponse('Pengguna tidak ditemukan', 404)
    }

    const plan = (user.subscription?.status === 'active' && user.subscription?.plan)
      ? user.subscription.plan
      : 'Free'

    return successResponse({ ...user, plan })
  } catch (error) {
    return errorResponse('Gagal mengambil data profil', 500)
  }
}

// Update current user profile
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const body = await req.json()
    const { name, email, phone, address, city, province, country, gender } = body

    if (!name || !email) {
      return errorResponse('Nama dan email wajib diisi', 400)
    }

    // Check if email is being changed and if it's already taken by another user
    if (email !== session.user.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } })
      if (existingUser && existingUser.id !== session.user.id) {
        return errorResponse('Email sudah digunakan oleh pengguna lain', 400)
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        email,
        phone,
        address,
        city,
        province,
        country,
        gender
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        city: true,
        province: true,
        country: true,
        gender: true,
        isActive: true,
        image: true,
        role: true
      }
    })

    return successResponse(updatedUser, 'Profil berhasil diperbarui')
  } catch (error) {
    return errorResponse('Gagal memperbarui profil', 500)
  }
}
