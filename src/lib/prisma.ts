import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  try {
    return new PrismaClient()
  } catch (error) {
    // If Prisma fails to initialize (e.g., during Next.js static build),
    // we return a Proxy that throws the error only when accessed at runtime.
    return new Proxy({} as PrismaClient, {
      get(target, prop) {
        if (prop === 'then') return undefined
        throw error
      }
    })
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma  
