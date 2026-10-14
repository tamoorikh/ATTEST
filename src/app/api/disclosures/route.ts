import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
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

    const requests = await prisma.disclosureRequest.findMany({
      where: { orgId },
      include: {
        certificate: true,
        decidedBy: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error: unknown) {
    console.error("Error fetching disclosure requests:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load requests" },
      { status: 500 }
    );
  }
}
