import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import bcrypt from 'bcryptjs'

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return errorResponse('Unauthorized', 401)

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return errorResponse('Kata sandi saat ini dan kata sandi baru wajib diisi', 400)
    }

    if (newPassword.length < 6) {
      return errorResponse('Kata sandi baru minimal 6 karakter', 400)
    }

    // Check Security Policies
    const passwordStrengthSetting = await prisma.setting.findUnique({
      where: { key: 'SECURITY_PASSWORD_STRENGTH' }
    })
    
    if (passwordStrengthSetting?.value === 'true') {
      // Must contain at least 8 chars, 1 number, and 1 special char
      const isStrong = /^(?=.*[0-9])(?=.*[!@#$%^&*.,])[a-zA-Z0-9!@#$%^&*.,]{8,}$/.test(newPassword)
      if (!isStrong) {
        return errorResponse('Sistem mewajibkan kata sandi kuat: Minimal 8 karakter, mengandung angka & simbol', 400)
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return errorResponse('Pengguna tidak ditemukan', 404)
    }

    // Verify current password
    if (!user.password) {
      return errorResponse('Akun ini tidak memiliki kata sandi (login via OAuth)', 400)
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return errorResponse('Kata sandi saat ini salah', 400)
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        password: hashedPassword
      }
    })

    return successResponse(null, 'Kata sandi berhasil diperbarui')
  } catch (error) {
    return errorResponse('Gagal memperbarui kata sandi', 500)
  }
}
