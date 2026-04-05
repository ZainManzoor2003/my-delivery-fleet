import { PrismaClient } from '../app/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = global as unknown as {
    prisma: PrismaClient
    pool: Pool
}

// Reuse the connection pool across requests
const pool = globalForPrisma.pool || new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

globalForPrisma.prisma = prisma
globalForPrisma.pool = pool

export default prisma;
