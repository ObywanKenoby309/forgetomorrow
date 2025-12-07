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
    // 🔑 Redirect behavior: sanitize URL and route via /auth/signin for role-based dashboards
    async redirect({ url, baseUrl }) {
      // Helper to strip CR/LF and trim whitespace from any URL we use in a Location header
      const clean = (value: string) => value.replace(/[\r\n]/g, "").trim();

      const cleanBase = clean(baseUrl);
      const rawUrl = url || cleanBase;
      const cleanUrl = clean(rawUrl);

      // If NextAuth wants to send us to the bare base URL,
      // route through /auth/signin so getServerSideProps can
      // push the user to the correct dashboard by role/plan.
      if (cleanUrl === cleanBase || cleanUrl === `${cleanBase}/`) {
        return `${cleanBase}/auth/signin`;
      }

      // Allow relative URLs (/seeker-dashboard, /recruiter/dashboard, /auth/signin, etc.)
      if (cleanUrl.startsWith("/")) {
        return `${cleanBase}${cleanUrl}`;
      }

      // Allow same-origin absolute URLs (e.g. https://forgetomorrow.com/auth/signin)
      if (cleanUrl.startsWith(cleanBase)) {
        return cleanUrl;
      }

      // Fallback: if something weird happens, go to sign-in router instead of marketing home
      return `${cleanBase}/auth/signin`;
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        (token as any).stripeCustomerId =
          (user as any).stripeCustomerId ?? null;
        (token as any).accountKey = (user as any).accountKey ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).stripeCustomerId =
          (token as any).stripeCustomerId;
        (session.user as any).accountKey =
          ((token as any).accountKey as string | null) ?? null;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
