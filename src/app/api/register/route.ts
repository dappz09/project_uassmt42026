import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!name || !email || !password) {
      return errorResponse('Semua field wajib diisi', 400)
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return errorResponse('Email sudah terdaftar', 400)
    }

    const userRole = await prisma.role.findUnique({ where: { name: 'User' } })
    if (!userRole) {
      return errorResponse('Role User tidak ditemukan', 500)
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: await bcrypt.hash(password, 10),
        roleId: userRole.id,
      },
    })

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'Free',
        status: 'active',
      },
    })

    return successResponse(null, 'Registrasi berhasil', 201)
  } catch (error: any) {
    return errorResponse('Terjadi kesalahan', 500, error.message)
  }
}