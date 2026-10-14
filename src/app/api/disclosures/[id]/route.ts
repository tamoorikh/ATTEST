import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";

const DecideSchema = z.object({
  action: z.enum(["APPROVE", "REJECT"]),
  approvedCategories: z.array(z.string()).optional(),
  rejectionReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = DecideSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { action, approvedCategories, rejectionReason } = parsed.data;

    const disclosure = await prisma.disclosureRequest.findUnique({
      where: { id },
      include: { certificate: true },
    });

    if (!disclosure) {
      return NextResponse.json({ error: "Disclosure request not found" }, { status: 404 });
    }

    let decider = null;
    if (session?.user?.id) {
      decider = await prisma.user.findUnique({ where: { id: session.user.id } });
    }
    if (!decider) {
      decider = await prisma.user.findFirst({ where: { email: "demo@attest.pk" } });
    }

    const now = new Date();

    if (action === "APPROVE") {
      const requestedCats = JSON.parse(disclosure.categoriesJson || "[]");
      const catsToApprove = approvedCategories && approvedCategories.length > 0 ? approvedCategories : requestedCats;
      const downloadToken = crypto.randomBytes(24).toString("hex");
      const downloadTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const updated = await prisma.disclosureRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedCategoriesJson: JSON.stringify(catsToApprove),
          downloadToken,
          downloadTokenExpiresAt,
          decidedAt: now,
          decidedById: decider?.id || null,
        },
      });

      await appendAuditEvent({
        orgId: disclosure.orgId,
        actorId: decider?.id || null,
        action: "DISCLOSURE_APPROVED",
        entityType: "DisclosureRequest",
        entityId: disclosure.id,
        metadata: {
          approvedCategories: catsToApprove,
          requesterEmail: disclosure.requesterEmail,
        },
      });

      await appendAuditEvent({
        orgId: disclosure.orgId,
        actorId: decider?.id || null,
        action: "DISCLOSURE_LINK_GENERATED",
        entityType: "DisclosureRequest",
        entityId: disclosure.id,
        metadata: {
          downloadToken,
          expiresAt: downloadTokenExpiresAt.toISOString(),
        },
      });

      return NextResponse.json({
        success: true,
        disclosure: updated,
        downloadUrl: `/api/disclosures/download?token=${downloadToken}`,
      });
    } else {
      const reason = rejectionReason || "Request declined by organization owner";
      const updated = await prisma.disclosureRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          rejectionReason: reason,
          decidedAt: now,
          decidedById: decider?.id || null,
        },
      });

      await appendAuditEvent({
        orgId: disclosure.orgId,
        actorId: decider?.id || null,
        action: "DISCLOSURE_REJECTED",
        entityType: "DisclosureRequest",
        entityId: disclosure.id,
        metadata: {
          reason,
          requesterEmail: disclosure.requesterEmail,
        },
      });

      return NextResponse.json({
        success: true,
        disclosure: updated,
      });
    }
  } catch (error: unknown) {
    console.error("Error updating disclosure request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update request" },
      { status: 500 }
    );
  }
}
