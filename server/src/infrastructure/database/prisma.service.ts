import { PrismaClient } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import dotenv from 'dotenv';

/**
 * Singleton Prisma Client instance with MariaDB adapter (compatible with MySQL)
 */
class PrismaService {
  private static instance: PrismaClient | null = null;

  static getInstance(): PrismaClient {
    const env = process.env.NODE_ENV || 'development';
    dotenv.config({
      path: `.env.${env}`,
    });
    if (!PrismaService.instance) {
      const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
      PrismaService.instance = new PrismaClient({ adapter });
    }
    return PrismaService.instance;
  }

  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      await PrismaService.instance.$disconnect();
      PrismaService.instance = null;
    }
  }
}

export const prisma = PrismaService.getInstance();
export { PrismaService };

// infrastructure/prisma/prisma.client.ts

// import { PrismaClient } from '@/generated/prisma'
// import { PrismaMySQL } from '@prisma/adapter-mysql'
// import mysql from 'mysql2/promise'

// /**
//  * Create MySQL connection pool
//  * Prisma 7.x REQUIRE adapter + pool
//  */
// const pool = mysql.createPool({
//   uri: process.env.DATABASE_URL,
//   connectionLimit: 10,        // tuỳ chỉnh
//   enableKeepAlive: true,
//   keepAliveInitialDelay: 0,
// })

// /**
//  * Prisma Client instance
//  * - NO singleton class
//  * - Pool already handles connection reuse
//  */
// export const prisma = new PrismaClient({
//   adapter: new PrismaMySQL(pool),
// })

// /**
//  * Graceful shutdown (optional)
//  */
// export async function disconnectPrisma(): Promise<void> {
//   await prisma.$disconnect()
// }
