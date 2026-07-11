import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('view:permissions') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    // Get all permissions in the system
    const allPermissions = await prisma.permission.findMany()

    // Get permissions for this specific role
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId: params.id },
      include: { permission: true }
    })

    const assignedPermissionIds = rolePermissions.map(rp => rp.permissionId)

    // We can return the list of all permissions, and indicate which ones are assigned
    return successResponse({
      allPermissions,
      assignedPermissionIds
    })
  } catch (error) {
    return errorResponse('Gagal mengambil data hak akses', 500)
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)

    // Authorization
    const hasPermission = session.user.role === 'SuperAdmin' || session.user.permissions?.includes('update:roles') || session.user.permissions?.includes('*:*')
    if (!hasPermission) return errorResponse('Forbidden', 403)

    // Prevent editing SuperAdmin permissions
    const roleToEdit = await prisma.role.findUnique({ where: { id: params.id } })
    if (roleToEdit?.name === 'SuperAdmin') {
      return errorResponse('Hak akses SuperAdmin tidak dapat diubah (Otomatis Full Access)', 400)
    }

    const body = await req.json()
    const { permissionIds } = body // Array of permission IDs that should be ACTIVE

    if (!Array.isArray(permissionIds)) {
      return errorResponse('Format data tidak valid', 400)
    }

    // Use a transaction to delete all existing role permissions and insert new ones
    await prisma.$transaction(async (tx) => {
      // 1. Delete existing
      await tx.rolePermission.deleteMany({
        where: { roleId: params.id }
      })

      // 2. Insert new ones
      if (permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionIds.map((permId: string) => ({
            roleId: params.id,
            permissionId: permId
          }))
        })
      }
    })

    return successResponse(null, 'Hak akses berhasil disimpan')
  } catch (error) {
    return errorResponse('Gagal menyimpan hak akses', 500)
  }
}
