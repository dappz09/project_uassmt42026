import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const userId = formData.get('userId') as string
    const action = formData.get('action') as string

    if (!userId || !action) {
      return NextResponse.json({ message: 'userId dan action wajib diisi' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    })

    if (!user) {
      return NextResponse.json({ message: 'User tidak ditemukan' }, { status: 404 })
    }

    switch (action) {
      case 'set-pro':
        if (!user.subscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: 'Pro',
              status: 'active'
            }
          })
        } else {
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: { plan: 'Pro', status: 'active' }
          })
        }
        break

      case 'set-free':
        if (!user.subscription) {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: 'Free',
              status: 'active'
            }
          })
        } else {
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: { plan: 'Free', status: 'active' }
          })
        }
        break

      case 'ban':
        if (user.subscription) {
          await prisma.subscription.update({
            where: { id: user.subscription.id },
            data: { status: 'banned' }
          })
        } else {
          await prisma.subscription.create({
            data: {
              userId: user.id,
              plan: 'Free',
              status: 'banned'
            }
          })
        }
        break

      default:
        return NextResponse.json({ message: 'Aksi tidak valid' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Aksi berhasil' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ message: 'Terjadi kesalahan' }, { status: 500 })
  }
}