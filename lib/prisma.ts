// lib/prisma.ts  ← ONLY THIS FILE
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// THIS IS THE ONLY LINE THAT MATTERS
export default prisma;   // ← must be "prisma", not "prismaClient"