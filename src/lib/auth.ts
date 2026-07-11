import NextAuth from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          console.log('🔍 Looking for user:', credentials.email)
          
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
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

          console.log('👤 User found:', !!user, 'Has password:', !!user?.password)

          if (!user || !user.password) {
            console.log('❌ User not found or no password')
            return null
          }

          console.log('🔐 Comparing password...')
          const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password)
          console.log('✅ Password valid:', isPasswordValid)

          if (!isPasswordValid) {
            return null
          }

          console.log('🎉 Login successful for:', user.email)

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role?.name || 'User',
            permissions: user.role?.permissions?.map((p: { permission: { action: string; resource: string } }) => `${p.permission.action}:${p.permission.resource}`) || [],
          }
        } catch (error) {
          console.error('❌ Auth error:', error)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string
        token.role = user.role as string
        token.permissions = user.permissions as string[]
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.permissions = token.permissions as string[]
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
})