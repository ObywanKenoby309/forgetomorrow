// lib/prisma.js
import { PrismaClient } from '@prisma/client';

// Avoid creating many clients in dev (Next.js hot reload)
let prisma;
if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) global.prisma = new PrismaClient();
  prisma = global.prisma;
}

export { prisma };
