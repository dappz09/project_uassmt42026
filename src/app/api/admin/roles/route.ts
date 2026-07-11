import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('view:roles') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: { users: true, permissions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse(roles)
  } catch (error) {
    return errorResponse('Gagal mengambil data peran', 500)
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('create:roles') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    const body = await req.json()
    const { name, description } = body

    if (!name) {
      return errorResponse('Nama peran wajib diisi', 400)
    }

    // Check if role exists
    const existing = await prisma.role.findUnique({ where: { name } })
    if (existing) {
      return errorResponse('Peran dengan nama tersebut sudah ada', 400)
    }

    const role = await prisma.role.create({
      data: {
        name,
        description
      }
    })

    return successResponse(role, 'Peran berhasil dibuat')
  } catch (error) {
    return errorResponse('Gagal membuat peran', 500)
  }
}
