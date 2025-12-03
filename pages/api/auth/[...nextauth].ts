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

  // ─────────────────────── CALLBACKS (WITH REDIRECT FIX) ───────────────────────
  callbacks: {
    // ✅ Make sure we always land in a safe place after auth
    async redirect({ url, baseUrl }) {
      // Allow relative URLs (e.g. "/seeker-dashboard")
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // Allow same-origin absolute URLs
      if (url.startsWith(baseUrl)) return url;

      // Fallback: always send to seeker dashboard
      return `${baseUrl}/seeker-dashboard`;
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
        (session.user as any).stripeCustomerId = (token as any)
          .stripeCustomerId;
        (session.user as any).accountKey =
          ((token as any).accountKey as string | null) ?? null;
      }
      return session;
    },
  },

  // ───────────────────── COOKIE CONFIG (FOR VERCEL / HTTPS) ────────────────────
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // required for secure cookies on Vercel prod
      },
    },
  },
  // ─────────────────────────────────────────────────────────────────────────────
};

export default NextAuth(authOptions);
