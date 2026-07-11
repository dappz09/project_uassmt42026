import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    
    const settings = await prisma.setting.findMany()
    return successResponse(settings, 'Settings retrieved')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)
    
    const { key, value, description, isPublic } = await req.json()
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, description, isPublic },
      create: { key, value, description, isPublic }
    })
    
    return successResponse(setting, 'Setting saved')
  } catch (error: any) {
    return errorResponse('Internal server error', 500, error.message)
  }
}
