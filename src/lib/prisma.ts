import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (prop === 'then') return undefined // handle async/await checks safely
    
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient()
    }
    return Reflect.get(globalForPrisma.prisma, prop)
  }
})

if (process.env.NODE_ENV !== 'production') {
  // In development, the proxy itself doesn't need to be reassigned, 
  // because it writes to globalForPrisma.prisma on first use.
  // But we can ensure it's not recreated if already exists
}