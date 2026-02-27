// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();

        // ✅ MIN CHANGE: select avatarUrl so it’s guaranteed present without any-casting
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            role: true,
            plan: true,
            stripeCustomerId: true,
            accountKey: true,
            passwordHash: true,
            avatarUrl: true, // ✅
          },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        // ✅ staff-role gate for Forge employees (impersonation, internal tools)
        const staff = await prisma.userStaffRole.findFirst({
          where: {
            userId: user.id,
            role: "PLATFORM_ADMIN",
          },
          select: { id: true },
        });

        const isPlatformAdmin = !!staff;

        return {
          id: user.id,
          email: user.email,
          name:
            user.name ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
            user.email,
          role: user.role,
          plan: user.plan,
          stripeCustomerId: user.stripeCustomerId,
          accountKey: user.accountKey ?? null,
          isPlatformAdmin,

          // ✅ MIN ADD: include avatar in the session payload (instant in UI)
          avatarUrl: user.avatarUrl ?? null,
        };
      },
    }),
  ],

  // 🔒 HARDENED: sane SaaS session policy (reduces "zombie sessions")
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours absolute
    updateAge: 60 * 60, // refresh at most once per hour
  },

  jwt: {
    maxAge: 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async redirect({ url, baseUrl, token }) {
  if (url === `${baseUrl}/auth/signin` || url === '/auth/signin') {
    const role = String((token as any)?.role || '').toUpperCase();
    if (role === 'RECRUITER') return `${baseUrl}/recruiter/dashboard`;
    if (role === 'COACH') return `${baseUrl}/coaching-dashboard`;
    if (role === 'ADMIN') return `${baseUrl}/admin`;
    return `${baseUrl}/seeker-dashboard`;
  }
  if (url.startsWith('/')) return `${baseUrl}${url}`;
  if (url.startsWith(baseUrl)) return url;
  return `${baseUrl}/auth/signin`;
},

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        (token as any).stripeCustomerId = (user as any).stripeCustomerId ?? null;
        (token as any).accountKey = (user as any).accountKey ?? null;
        (token as any).isPlatformAdmin = !!(user as any).isPlatformAdmin;

        // ✅ MIN ADD
        (token as any).avatarUrl = (user as any).avatarUrl ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).stripeCustomerId =
          (token as any).stripeCustomerId ?? null;
        (session.user as any).accountKey =
          ((token as any).accountKey as string | null) ?? null;
        (session.user as any).isPlatformAdmin = !!(token as any).isPlatformAdmin;

        // ✅ MIN ADD: expose avatarUrl on session.user
        (session.user as any).avatarUrl = (token as any).avatarUrl ?? null;

        // ✅ Optional safety: also mirror into `image` so any NextAuth-native usage works
        (session.user as any).image =
          (token as any).avatarUrl ?? (session.user as any).image ?? null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);