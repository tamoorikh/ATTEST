import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { executeOrchestratorForPeriod } from "@/engine/orchestrator";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const period = body.period || "2026-04";

    // Retrieve active user's organization membership
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { org: true },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "No organization membership found" },
        { status: 403 }
      );
    }

    const orgId = membership.orgId;

    // Execute Orchestrator
    const result = await executeOrchestratorForPeriod({
      orgId,
      period,
      actorId: session.user.id,
      prismaClient: prisma,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    console.error("Reconciliation run error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute reconciliation run" },
      { status: 500 }
    );
  }
}
