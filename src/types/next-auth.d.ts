import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    orgId?: string;
    orgName?: string;
    orgSlug?: string;
    isDemo?: boolean;
    role?: string;
    memberships?: Array<{
      orgId: string;
      orgName: string;
      orgSlug: string;
      role: string;
      isDemo: boolean;
    }>;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      orgId: string;
      orgName: string;
      orgSlug: string;
      isDemo: boolean;
      role: string;
      memberships: Array<{
        orgId: string;
        orgName: string;
        orgSlug: string;
        role: string;
        isDemo: boolean;
      }>;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name?: string | null;
    orgId: string;
    orgName: string;
    orgSlug: string;
    isDemo: boolean;
    role: string;
    memberships: Array<{
      orgId: string;
      orgName: string;
      orgSlug: string;
      role: string;
      isDemo: boolean;
    }>;
  }
}
