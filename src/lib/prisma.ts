import { PrismaClient } from '@/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 uses driver adapters instead of the built-in TCP connector.
// DATABASE_URL should point to the Supabase pooler (port 6543) at runtime.
function makeClient() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return new PrismaClient({ adapter: new PrismaPg({ connectionString: '' }) })
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? makeClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
