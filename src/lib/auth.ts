import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

import { checkRateLimit } from "./rateLimit";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // default 24 hours session expiry
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" },
        isQuickLogin: { label: "IsQuickLogin", type: "text" },
      },
      async authorize(credentials, req) {
        // 1. IP-based Rate Limiting (5 attempts / min / IP with lockout message)
        let ip = "127.0.0.1";
        if (req?.headers) {
          const forwarded = req.headers["x-forwarded-for"];
          ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || (req.headers["x-real-ip"] as string) || "127.0.0.1";
        }
        const rl = checkRateLimit(`auth-login:${ip}`, 5, 60000);
        if (!rl.allowed) {
          throw new Error("Too many login attempts from this IP address. Account access is temporarily locked. Please wait 1 minute before trying again.");
        }

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = credentials.email.toLowerCase().trim();

        // 2. DEMO_MODE Enforced Gating: quick-login / demo accounts require DEMO_MODE
        const isDemoRequested = credentials.isQuickLogin === "true" || email === "demo@attest.pk" || email === "ca@attest.pk";
        const isDemoAllowed = process.env.DEMO_MODE === "true";
        if (isDemoRequested && !isDemoAllowed) {
          throw new Error("Demo persona quick-login is disabled when DEMO_MODE is false.");
        }

        const user = await prisma.user.findUnique({
          where: { email },
          include: {
            memberships: {
              include: {
                org: true,
              },
            },
          },
        });

        if (!user || !user.passwordHash) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        const memberships = user.memberships.map((m) => ({
          orgId: m.orgId,
          orgName: m.org.name,
          orgSlug: m.org.slug,
          role: m.role,
          isDemo: m.org.isDemo,
        }));

        const primaryMembership = memberships[0];

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          orgId: primaryMembership?.orgId || "",
          orgName: primaryMembership?.orgName || "",
          orgSlug: primaryMembership?.orgSlug || "",
          isDemo: primaryMembership?.isDemo || false,
          role: primaryMembership?.role || "Accountant",
          memberships,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email!;
        token.name = user.name;
        token.orgId = user.orgId || "";
        token.orgName = user.orgName || "";
        token.orgSlug = user.orgSlug || "";
        token.isDemo = user.isDemo || false;
        token.role = user.role || "Accountant";
        token.memberships = user.memberships || [];
      }

      // Allow client-side update of active organization if user switches
      if (trigger === "update" && session?.orgId) {
        const target = token.memberships?.find((m) => m.orgId === session.orgId);
        if (target) {
          token.orgId = target.orgId;
          token.orgName = target.orgName;
          token.orgSlug = target.orgSlug;
          token.isDemo = target.isDemo;
          token.role = target.role;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string | null | undefined;
        session.user.orgId = token.orgId as string;
        session.user.orgName = token.orgName as string;
        session.user.orgSlug = token.orgSlug as string;
        session.user.isDemo = token.isDemo as boolean;
        session.user.role = token.role as string;
        session.user.memberships = (token.memberships as any) || [];
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
