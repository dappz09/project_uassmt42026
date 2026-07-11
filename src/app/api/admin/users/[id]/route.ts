import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    const hasAccess = session.user.role === 'SuperAdmin' || session.user.permissions.includes('read:users')
    if (!hasAccess) return errorResponse('Forbidden: Requires read:users permission', 403)

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: { 
        role: true,
        subscription: true
      }
    })

    if (!user) return errorResponse('User not found', 404)
    
    const { password, ...safeUser } = user
    return successResponse(safeUser, 'User retrieved successfully')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    const hasAccess = session.user.role === 'SuperAdmin' || session.user.permissions.includes('update:users')
    if (!hasAccess) return errorResponse('Forbidden: Requires update:users permission', 403)

    const data = await req.json()
    
    // Validate role if provided
    if (data.roleId) {
      const roleExists = await prisma.role.findUnique({ where: { id: data.roleId } })
      if (!roleExists) return errorResponse('Invalid role ID', 400)
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city,
        province: data.province,
        country: data.country,
        gender: data.gender,
        isActive: data.isActive,
        roleId: data.roleId
      },
      include: { role: true, subscription: true }
    })
    
    const { password, ...safeUser } = updatedUser
    return successResponse(safeUser, 'User updated successfully')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    const hasAccess = session.user.role === 'SuperAdmin' || session.user.permissions.includes('delete:users')
    if (!hasAccess) return errorResponse('Forbidden: Requires delete:users permission', 403)

    await prisma.user.delete({
      where: { id: params.id }
    })
    
    return successResponse(null, 'User deleted successfully')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}
