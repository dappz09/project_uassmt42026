import 'next-auth'

declare module 'next-auth' {
  interface User {
    role?: string
    permissions?: string[]
  }
  interface Session {
    user: User & {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    role?: string
    permissions?: string[]
  }
}