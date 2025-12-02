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

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name || user.email,
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

  // ─────────────────────── THIS IS THE FIX ───────────────────────
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.plan = (user as any).plan;
        token.stripeCustomerId = (user as any).stripeCustomerId ?? null;
        token.accountKey = (user as any).accountKey ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role;
        (session.user as any).plan = token.plan;
        (session.user as any).stripeCustomerId = token.stripeCustomerId;
        (session.user as any).accountKey = token.accountKey ?? null;
      }
      return session;
    },

    // ←←← THIS ONE KILLS THE LOOP ←←←
    async redirect({ url, baseUrl }) {
      // If the URL is relative or same domain → allow it
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (url.startsWith(baseUrl)) return url;
      // Otherwise redirect to dashboard after login
      return `${baseUrl}/seeker-dashboard`;
    },
  },

  // ←←← THIS ONE FIXES COOKIE DOMAIN ISSUES ←←←
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true, // forces HTTPS cookies in prod
      },
    },
  },
  // ─────────────────────────────────────────────────────────────
};

export default NextAuth(authOptions);