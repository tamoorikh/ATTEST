import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";

const RevokeSchema = z.object({
  reason: z.string().min(20, "Revocation reason must be at least 20 characters"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = RevokeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { reason } = parsed.data;

    // Find certificate by id or publicId
    const cert = await prisma.certificate.findFirst({
      where: {
        OR: [{ id }, { publicId: id }],
      },
    });

    if (!cert) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    if (cert.status === "REVOKED") {
      return NextResponse.json(
        { error: "Certificate is already revoked" },
        { status: 400 }
      );
    }

    // Identify revoking user
    let revoker = null;
    if (session?.user?.id) {
      revoker = await prisma.user.findUnique({ where: { id: session.user.id } });
    }
    if (!revoker) {
      revoker = await prisma.user.findFirst({ where: { email: "ca@attest.pk" } });
    }

    const now = new Date();
    const updatedCert = await prisma.certificate.update({
      where: { id: cert.id },
      data: {
        status: "REVOKED",
        revokedAt: now,
        revocationReason: reason.trim(),
        revokedById: revoker?.id || null,
      },
    });

    // Append audit event
    await appendAuditEvent({
      orgId: cert.orgId,
      actorId: revoker?.id || null,
      action: "CERTIFICATE_REVOKED",
      entityType: "Certificate",
      entityId: cert.id,
      metadata: {
        publicId: cert.publicId,
        reason: reason.trim(),
        revokedAt: now.toISOString(),
      },
    });

    // Notify org
    const orgMembers = await prisma.membership.findMany({
      where: { orgId: cert.orgId },
    });
    for (const m of orgMembers) {
      await prisma.notification.create({
        data: {
          orgId: cert.orgId,
          userId: m.userId,
          title: "Certificate Revoked by CA",
          message: `Certificate ${cert.publicId} has been revoked: "${reason.trim()}"`,
          type: "ERROR",
          link: `/portal/certificate`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      certificate: updatedCert,
    });
  } catch (error: unknown) {
    console.error("Error revoking certificate:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to revoke certificate" },
      { status: 500 }
    );
  }
}
