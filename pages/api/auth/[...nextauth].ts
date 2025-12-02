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
        if (!credentials?.email || !credentials?.password) {
          console.log("[nextauth] Missing email or password");
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (!user) {
          console.log("[nextauth] User not found:", normalizedEmail);
          return null;
        }

        if (!user.passwordHash) {
          console.log("[nextauth] No password hash for user:", normalizedEmail);
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          console.log("[nextauth] Invalid password for:", normalizedEmail);
          return null;
        }

        console.log("[nextauth] SUCCESSFUL LOGIN:", {
          email: user.email,
          role: user.role,
          plan: user.plan,
          emailVerified: user.emailVerified,
        });

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
      console.log("[DEBUG] Session callback fired:", { session, token });

      if (session.user) {
        session.user.id = token.sub!;
        (session.user as any).role = token.role as string;
        (session.user as any).plan = token.plan as string;
        (session.user as any).stripeCustomerId = token.stripeCustomerId as string | null;
        (session.user as any).accountKey = token.accountKey ?? null;
      }

      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
};

export default NextAuth(authOptions);