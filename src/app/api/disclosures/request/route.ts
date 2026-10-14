import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rateLimit";
import { appendAuditEvent } from "@/lib/audit";

const RequestDisclosureSchema = z.object({
  certificatePublicId: z.string().min(5),
  requesterName: z.string().min(2, "Name is required"),
  requesterOrg: z.string().optional(),
  requesterEmail: z.string().email("Valid email required"),
  purpose: z.string().min(10, "Purpose description must be at least 10 characters"),
  categories: z.array(z.string()).min(1, "Select at least one category"),
  period: z.string().default("2026-04"),
});

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const rl = checkRateLimit(`disclosure-req:${ip}`, 10, 60000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = RequestDisclosureSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const {
      certificatePublicId,
      requesterName,
      requesterOrg,
      requesterEmail,
      purpose,
      categories,
      period,
    } = parsed.data;

    const cert = await prisma.certificate.findUnique({
      where: { publicId: certificatePublicId },
    });

    if (!cert) {
      return NextResponse.json(
        { error: "Certificate not found" },
        { status: 404 }
      );
    }

    const disclosure = await prisma.disclosureRequest.create({
      data: {
        orgId: cert.orgId,
        certificateId: cert.id,
        requesterName: requesterName.trim(),
        requesterOrg: requesterOrg?.trim() || null,
        requesterEmail: requesterEmail.trim().toLowerCase(),
        purpose: purpose.trim(),
        categoriesJson: JSON.stringify(categories),
        period,
        status: "PENDING",
      },
    });

    // Audit event
    await appendAuditEvent({
      orgId: cert.orgId,
      action: "DISCLOSURE_REQUESTED",
      entityType: "DisclosureRequest",
      entityId: disclosure.id,
      metadata: {
        certificatePublicId,
        requesterEmail,
        categories,
        period,
      },
    });

    // Notify client owners
    const owners = await prisma.membership.findMany({
      where: { orgId: cert.orgId, role: { in: ["Owner", "FinanceManager"] } },
    });

    for (const m of owners) {
      await prisma.notification.create({
        data: {
          orgId: cert.orgId,
          userId: m.userId,
          title: "New Supporting Evidence Request",
          message: `${requesterName} (${requesterOrg || "External Requester"}) requested supporting evidence for period ${period}.`,
          type: "INFO",
          link: "/portal/sharing",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your request has been submitted for review by the organization owner.",
      requestId: disclosure.id,
    });
  } catch (error: unknown) {
    console.error("Error creating disclosure request:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit request" },
      { status: 500 }
    );
  }
}
