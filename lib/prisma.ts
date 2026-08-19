import { PrismaClient } from "@prisma/client";

// Padrão recomendado pelo Prisma pro Next.js dev (hot-reload cria vários
// módulos e, sem isso, cada reload abriria uma nova conexão com o banco).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
