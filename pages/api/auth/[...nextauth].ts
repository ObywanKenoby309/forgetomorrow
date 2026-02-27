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
          avatarUrl: user.avatarUrl ?? null,
        };
      },
    }),
  ],

  // 🔒 HARDENED: sane SaaS session policy (reduces "zombie sessions")
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours absolute
    updateAge: 60 * 60,   // refresh at most once per hour
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
    // ✅ FIXED: token is not available in redirect callback — role routing
    // is handled by getServerSideProps in signin.tsx instead.
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      return `${baseUrl}/auth/signin`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.plan = user.plan;
        token.stripeCustomerId = user.stripeCustomerId ?? null;
        token.accountKey = user.accountKey ?? null;
        token.isPlatformAdmin = !!user.isPlatformAdmin;
        token.avatarUrl = user.avatarUrl ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.plan = token.plan;
        session.user.stripeCustomerId = token.stripeCustomerId ?? null;
        session.user.accountKey = token.accountKey ?? null;
        session.user.isPlatformAdmin = !!token.isPlatformAdmin;
        session.user.avatarUrl = token.avatarUrl ?? null;
        session.user.image = token.avatarUrl ?? session.user.image ?? null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);