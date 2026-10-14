import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluatePreIssuanceGates } from "@/lib/gates";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "2026-04";
    const conclusion = searchParams.get("conclusion") || "";

    let orgId = session?.user?.orgId;
    if (!orgId) {
      const demoOrg = await prisma.organization.findFirst({
        where: { isDemo: true },
      });
      orgId = demoOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const evaluation = await evaluatePreIssuanceGates(orgId, period, conclusion);
    return NextResponse.json(evaluation);
  } catch (error: unknown) {
    console.error("Error evaluating pre-issuance gates:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
