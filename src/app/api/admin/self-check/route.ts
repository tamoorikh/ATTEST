import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { storage } from "@/lib/storage";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Enforce administrative access (PlatformAdmin, CA-reviewer, or secret query token for automated infra checks)
    const url = new URL(req.url);
    const authHeader = req.headers.get("authorization");
    const checkToken = url.searchParams.get("token");
    const validToken = process.env.ADMIN_CHECK_TOKEN;

    const isTokenAuthed = validToken && (checkToken === validToken || authHeader === `Bearer ${validToken}`);
    const isRoleAuthed = session?.user?.role === "PlatformAdmin" || session?.user?.role === "CA-reviewer";

    if (!isTokenAuthed && !isRoleAuthed) {
      return NextResponse.json(
        { error: "Forbidden: Pre-launch self-check requires administrative privileges." },
        { status: 403 }
      );
    }

    const startDb = Date.now();
    let dbStatus = "ok";
    let dbMessage = "";
    let userCount = 0;
    let orgCount = 0;
    let demoOrgCount = 0;

    try {
      userCount = await prisma.user.count();
      orgCount = await prisma.organization.count();
      demoOrgCount = await prisma.organization.count({ where: { isDemo: true } });
      dbMessage = `Connected (${Date.now() - startDb}ms). Users: ${userCount}, Orgs: ${orgCount}, Demo Orgs: ${demoOrgCount}`;
    } catch (err: any) {
      dbStatus = "error";
      dbMessage = `Database connection failed: ${err.message}`;
    }

    const storageHealth = await storage.checkHealth();

    const envChecks = {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      NEXTAUTH_SECRET: Boolean(process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length >= 32),
      NEXTAUTH_URL: Boolean(process.env.NEXTAUTH_URL),
      DEMO_MODE: process.env.DEMO_MODE ?? "false",
      SEED_DEMO_DATA: process.env.SEED_DEMO_DATA ?? "false",
      STORAGE_PROVIDER: process.env.STORAGE_PROVIDER ?? (process.env.SUPABASE_URL ? "supabase" : "local"),
      SUPABASE_URL_PRESENT: Boolean(process.env.SUPABASE_URL),
      SUPABASE_SERVICE_ROLE_KEY_PRESENT: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    };

    const isReady =
      dbStatus === "ok" &&
      storageHealth.status === "ok" &&
      envChecks.DATABASE_URL &&
      envChecks.NEXTAUTH_SECRET;

    return NextResponse.json({
      status: isReady ? "READY" : "NOT_READY",
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        details: dbMessage,
        isCleanProduction: demoOrgCount === 0,
      },
      storage: storageHealth,
      env: envChecks,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to perform self-check", details: err.message },
      { status: 500 }
    );
  }
}
