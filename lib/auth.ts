// lib/auth.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcrypt';
import { sign, verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        // Optional: MFA code (sent in 2nd step)
        totpCode: { label: 'MFA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user || !user.passwordHash) return null;

        const match = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!match) return null;

        if (!user.emailVerified) return null;

        // If MFA enabled, require TOTP code
        if (user.mfaEnabled) {
          if (!credentials.totpCode) {
            throw new Error('MFA_REQUIRED');
          }
          const { authenticator } = await import('otplib');
          const isValid = authenticator.check(credentials.totpCode, user.mfaSecret!);
          if (!isValid) throw new Error('INVALID_MFA_CODE');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          plan: user.plan,
          mfaEnabled: user.mfaEnabled,
        };
      },
    }),
  ],
  secret: JWT_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
        token.mfaEnabled = user.mfaEnabled;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.role) session.user.role = token.role as string;
      if (token?.plan) session.user.plan = token.plan as string;
      if (token?.mfaEnabled !== undefined) {
        session.user.mfaEnabled = token.mfaEnabled as boolean;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Optional: Log login
      console.log('User signed in:', user.email);
    },
  },
};

// Optional helpers
export function verifyJwt(token: string): any {
  try {
    return verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}