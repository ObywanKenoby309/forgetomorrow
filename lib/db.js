// lib/db.js
import { PrismaClient } from '@prisma/client';

let prisma;
if (globalThis.prisma) {
  prisma = globalThis.prisma;
} else {
  prisma = new PrismaClient();
  if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma;
}

export default prisma;