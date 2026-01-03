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
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
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
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async redirect({ url, baseUrl }) {
      const clean = (value: string) => value.replace(/[\r\n]/g, "").trim();

      const cleanBase = clean(baseUrl);
      const rawUrl = url || cleanBase;
      const cleanUrl = clean(rawUrl);

      if (cleanUrl === cleanBase || cleanUrl === `${cleanBase}/`) {
        return `${cleanBase}/auth/signin`;
      }

      if (cleanUrl.startsWith("/")) {
        return `${cleanBase}${cleanUrl}`;
      }

      if (cleanUrl.startsWith(cleanBase)) {
        return cleanUrl;
      }

      return `${cleanBase}/auth/signin`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        (token as any).stripeCustomerId = (user as any).stripeCustomerId ?? null;
        (token as any).accountKey = (user as any).accountKey ?? null;
        (token as any).isPlatformAdmin = !!(user as any).isPlatformAdmin;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).stripeCustomerId = (token as any).stripeCustomerId;
        (session.user as any).accountKey =
          ((token as any).accountKey as string | null) ?? null;
        (session.user as any).isPlatformAdmin = !!(token as any).isPlatformAdmin;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
