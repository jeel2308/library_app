import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { 
  prisma: PrismaClient | undefined 
}

function createPrismaClient() {
  const client = new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Add development-specific error handling
  if (process.env.NODE_ENV !== 'production') {
    // Removed unsupported event listeners for 'query' and 'error' to fix TypeScript errors
  }

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}