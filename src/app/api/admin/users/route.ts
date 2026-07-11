import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    const hasAccess = session.user.role === 'SuperAdmin' || session.user.permissions.includes('view:users')
    if (!hasAccess) return errorResponse('Forbidden: Requires view:users permission', 403)

    const users = await prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' }
    })
    
    const safeUsers = users.map(u => {
      const { password, ...rest } = u
      return rest
    })
    
    return successResponse(safeUsers, 'Users retrieved successfully')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse('Unauthorized', 401)
    
    const hasAccess = session.user.role === 'SuperAdmin' || session.user.permissions.includes('create:users')
    if (!hasAccess) return errorResponse('Forbidden: Requires create:users permission', 403)

    const { name, email, password, roleId } = await req.json()
    
    if (password && password.length < 6) {
      return errorResponse('Kata sandi baru minimal 6 karakter', 400)
    }

    // Check Security Policies
    if (password) {
      const passwordStrengthSetting = await prisma.setting.findUnique({
        where: { key: 'SECURITY_PASSWORD_STRENGTH' }
      })
      
      if (passwordStrengthSetting?.value === 'true') {
        const isStrong = /^(?=.*[0-9])(?=.*[!@#$%^&*.,])[a-zA-Z0-9!@#$%^&*.,]{8,}$/.test(password)
        if (!isStrong) {
          return errorResponse('Sistem mewajibkan kata sandi kuat: Minimal 8 karakter, mengandung angka & simbol', 400)
        }
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: roleId || null
      }
    })
    
    const { password: _, ...safeUser } = user
    return successResponse(safeUser, 'User created successfully')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}
