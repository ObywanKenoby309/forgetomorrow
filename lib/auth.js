import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { verifySessionFromReq } from '@/lib/session';

// Look up a user by email
export async function findUserByEmail(email) {
  if (!email) return null;
  return prisma.user.findUnique({ where: { email } });
}

// Validate password against passwordHash field
export async function validatePassword(user, plain) {
  if (!user?.passwordHash) return false;
  try {
    return await bcrypt.compare(plain, user.passwordHash);
  } catch {
    return false;
  }
}

// For API/routes: quickly get the session (or null)
export function getSession(req) {
  return verifySessionFromReq(req);
}
