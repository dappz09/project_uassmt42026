import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    
    console.log('\n=== DEBUG USER LOGIN ===')
    console.log('Email:', email)
    console.log('Password provided:', !!password)
    
    // Cek user di database
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        role: { 
          include: { 
            permissions: { 
              include: { 
                permission: true 
              } 
            } 
          } 
        } 
      },
    })
    
    if (!user) {
      console.log('❌ User tidak ditemukan di database')
      return NextResponse.json({ 
        error: 'User tidak ditemukan',
        suggestion: 'Jalankan npm run seed untuk membuat admin account'
      }, { status: 404 })
    }
    
    console.log('✅ User ditemukan!')
    console.log('User ID:', user.id)
    console.log('User Name:', user.name)
    console.log('Has password:', !!user.password)
    console.log('Role ID:', user.roleId)
    console.log('Role:', user.role?.name || 'No role')
    
    if (!user.password) {
      console.log('❌ User tidak memiliki password')
      return NextResponse.json({ 
        error: 'User tidak memiliki password',
        user: { id: user.id, email: user.email, hasPassword: false }
      }, { status: 400 })
    }
    
    // Cek password
    console.log('🔐 Membandingkan password...')
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('✅ Password valid:', isPasswordValid)
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        error: 'Password salah',
        suggestion: 'Cek password dan coba lagi'
      }, { status: 401 })
    }
    
    console.log('🎉 Login berhasil!\n')
    
    return NextResponse.json({ 
      success: true,
      message: 'Login berhasil',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role?.name || 'User',
        permissions: user.role?.permissions?.map((p: { permission: { action: string; resource: string } }) => 
          `${p.permission.action}:${p.permission.resource}`
        ) || []
      }
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    return NextResponse.json({ 
      error: 'Terjadi kesalahan',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}