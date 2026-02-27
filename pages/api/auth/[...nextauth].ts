// pages/api/auth/[...nextauth].ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { NextApiRequest, NextApiResponse } from "next";

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
            avatarUrl: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
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
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/auth/signin`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        token.stripeCustomerId = (user as any).stripeCustomerId ?? null;
        token.accountKey = (user as any).accountKey ?? null;
        token.isPlatformAdmin = !!(user as any).isPlatformAdmin;
        token.avatarUrl = (user as any).avatarUrl ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub!;
        (session.user as any).role = (token as any).role;
        (session.user as any).plan = (token as any).plan;
        (session.user as any).stripeCustomerId = (token as any).stripeCustomerId ?? null;
        (session.user as any).accountKey = (token as any).accountKey ?? null;
        (session.user as any).isPlatformAdmin = !!(token as any).isPlatformAdmin;
        (session.user as any).avatarUrl = (token as any).avatarUrl ?? null;
        session.user.image = ((token as any).avatarUrl ?? session.user.image ?? null) as any;
      }
      return session;
    },
  },
};

// ✅ MIN FIX: Some clients trigger an OPTIONS preflight to the credentials callback.
// NextAuth will otherwise respond 405, and some environments abort before POST.
// This keeps behavior identical for normal requests while preventing the 405.
export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await (NextAuth as any)(req, res, authOptions);
}