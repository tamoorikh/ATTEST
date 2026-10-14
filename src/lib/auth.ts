import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
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
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password");
        }

        const email = credentials.email.toLowerCase().trim();
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
