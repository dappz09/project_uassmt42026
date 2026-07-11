import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('show:roles') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    const role = await prisma.role.findUnique({
      where: { id: params.id },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    })

    if (!role) {
      return errorResponse('Peran tidak ditemukan', 404)
    }

    return successResponse(role)
  } catch (error) {
    return errorResponse('Gagal mengambil data peran', 500)
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('update:roles') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    const body = await req.json()
    const { name, description } = body

    const role = await prisma.role.update({
      where: { id: params.id },
      data: {
        name,
        description
      }
    })

    return successResponse(role, 'Peran berhasil diperbarui')
  } catch (error) {
    return errorResponse('Gagal memperbarui peran', 500)
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('delete:roles') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    // Prevent deleting SuperAdmin
    const roleToDelete = await prisma.role.findUnique({ where: { id: params.id } })
    if (roleToDelete?.name === 'SuperAdmin') {
      return errorResponse('Tidak dapat menghapus peran SuperAdmin', 400)
    }

    await prisma.role.delete({
      where: { id: params.id }
    })

    return successResponse(null, 'Peran berhasil dihapus')
  } catch (error) {
    return errorResponse('Gagal menghapus peran', 500)
  }
}
