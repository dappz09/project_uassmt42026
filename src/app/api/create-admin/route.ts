import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ message: 'Semua field wajib diisi' }, { status: 400 })
    }

    // Check if admin role exists
    let adminRole = await prisma.role.findUnique({ where: { name: 'SuperAdmin' } })
    
    if (!adminRole) {
      adminRole = await prisma.role.create({
        data: {
          name: 'SuperAdmin',
          description: 'Administrator with full access',
        },
      })
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        roleId: adminRole.id,
      },
      create: {
        email,
        password: hashedPassword,
        name,
        roleId: adminRole.id,
      },
    })

    // Create/update subscription
    await prisma.subscription.upsert({
      where: { userId: admin.id },
      update: { plan: 'Enterprise' },
      create: {
        userId: admin.id,
        plan: 'Enterprise',
        status: 'active',
      },
    })

    return NextResponse.json({ 
      message: 'Admin account created successfully',
      email: admin.email,
      role: 'SuperAdmin'
    }, { status: 200 })
  } catch (error) {
    console.error('Create admin error:', error)
    return NextResponse.json({ 
      message: 'Terjadi kesalahan',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}