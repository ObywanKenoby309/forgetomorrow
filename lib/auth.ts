// lib/auth.ts â€” FINAL VERSION â€” NO MORE 400s EVER
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

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
          where: { email: credentials.email.toLowerCase() },
        });
        if (!user?.passwordHash || !user.emailVerified) return null;
        const match = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!match) return null;
        return { id: user.id.toString(), email: user.email, role: user.role, plan: user.plan };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/signin' },
  useSecureCookies: false,
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: { httpOnly: true, sameSite: 'lax', path: '/', secure: false },
    },
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
      if (token?.role) session.user.role = token.role as string;
      if (token?.plan) session.user.plan = token.plan as string;
      return session;
    },
    async redirect() {
      return '/roadmap'; // â† HARDCODED. NO MORE 400s. EVER.
    },
  },
};

export default authOptions;
