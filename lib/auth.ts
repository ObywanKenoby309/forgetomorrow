// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import GithubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma'; // Import PrismaClient from lib/prisma.ts

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret'; // Fallback if undefined

// Interface for JWT payload
interface JwtPayload {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  plan: string;
  iat?: number;
  exp?: number;
}

// ——— NEXTAUTH CONFIG ———
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user || !user.passwordHash) return null;
        const match = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!match) return null;
        if (!user.emailVerified) return null;
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID || '',
      clientSecret: process.env.GITHUB_SECRET || '',
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin', // Align with original pages/api/auth/[...nextauth].js
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.plan = token.plan;
      return session;
    },
  },
};

// ——— JWT HELPERS ———
export function verifyJwt(token: string): JwtPayload | null {
  try {
    return verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function readSessionCookie(cookie: string | undefined): JwtPayload | null {
  if (!cookie) return null;
  // Extract token from cookie (handles multiple cookie formats)
  const tokenMatch = cookie.match(/(?:^|; )next-auth\.session-token=([^;]+)/);
  if (!tokenMatch) return null;
  return verifyJwt(tokenMatch[1]);
}