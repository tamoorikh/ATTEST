import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resetDemoData } from "@/lib/demoReset";
import { appendAuditEvent } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const isDemoMode = process.env.DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";

    // Only PlatformAdmin (or Owner in active DEMO_MODE) can reset demo data
    const isAllowed = userRole === "PlatformAdmin" || (isDemoMode && userRole === "Owner");
    if (!isAllowed) {
      return NextResponse.json(
        { error: "Forbidden: Demo reset is only permitted for PlatformAdmin or Demo Owner." },
        { status: 403 }
      );
    }

    const resetResult = await resetDemoData();

    await appendAuditEvent({
      orgId: resetResult.orgId,
      actorId: resetResult.adminId,
      action: "DEMO_DATA_RESET",
      entityType: "Organization",
      entityId: resetResult.orgId,
      metadata: {
        resetBy: session?.user?.email || "PlatformAdmin",
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Demonstration dataset idempotently wiped and re-seeded to initial state.",
      details: resetResult,
    });
  } catch (error: unknown) {
    console.error("Error resetting demo data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to reset demo data" },
      { status: 500 }
    );
  }
}
