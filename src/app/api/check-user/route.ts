import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    
    console.log('\n🔍 CHECKING USER:', email)
    
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) {
      console.log('❌ USER NOT FOUND')
      return NextResponse.json({ 
        exists: false,
        message: 'User tidak ada di database' 
      })
    }
    
    console.log('✅ USER FOUND:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   Has Password:', !!user.password)
    console.log('   Role ID:', user.roleId)
    console.log('   Created:', user.createdAt)
    
    return NextResponse.json({ 
      exists: true,
      user: {
        email: user.email,
        name: user.name,
        hasPassword: !!user.password,
        roleId: user.roleId,
      }
    })
    
  } catch (error) {
    console.error('❌ ERROR:', error)
    return NextResponse.json({ 
      error: 'Database error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}