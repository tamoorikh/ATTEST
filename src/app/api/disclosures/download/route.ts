import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Download token is required" }, { status: 400 });
    }

    const disclosure = await prisma.disclosureRequest.findFirst({
      where: { downloadToken: token },
      include: {
        certificate: true,
        org: true,
      },
    });

    if (!disclosure) {
      return NextResponse.json(
        { error: "Invalid or nonexistent evidence pack download link" },
        { status: 404 }
      );
    }

    if (disclosure.status !== "APPROVED") {
      return NextResponse.json(
        { error: "request not granted" },
        { status: 403 }
      );
    }

    const now = new Date();
    if (disclosure.downloadTokenExpiresAt && disclosure.downloadTokenExpiresAt < now) {
      await appendAuditEvent({
        orgId: disclosure.orgId,
        action: "DISCLOSURE_LINK_EXPIRED",
        entityType: "DisclosureRequest",
        entityId: disclosure.id,
        metadata: {
          expiredAt: disclosure.downloadTokenExpiresAt.toISOString(),
          attemptedAt: now.toISOString(),
        },
      });

      return NextResponse.json(
        { error: "This evidence pack download link has expired." },
        { status: 410 }
      );
    }

    // Scoped package: ONLY files matching approved categories and period
    const approvedCats: string[] = JSON.parse(
      disclosure.approvedCategoriesJson || disclosure.categoriesJson || "[]"
    );

    const documents = await prisma.sourceDocument.findMany({
      where: {
        orgId: disclosure.orgId,
        period: disclosure.period,
        type: { in: approvedCats },
      },
      select: {
        id: true,
        filename: true,
        type: true,
        period: true,
        sha256: true,
        size: true,
        mime: true,
        tier: true,
        parseStatus: true,
        createdAt: true,
      },
    });

    // Increment download count
    await prisma.disclosureRequest.update({
      where: { id: disclosure.id },
      data: {
        downloadCount: { increment: 1 },
      },
    });

    await appendAuditEvent({
      orgId: disclosure.orgId,
      action: "DISCLOSURE_LINK_ACCESSED",
      entityType: "DisclosureRequest",
      entityId: disclosure.id,
      metadata: {
        downloadCount: disclosure.downloadCount + 1,
        requesterEmail: disclosure.requesterEmail,
        documentsIncluded: documents.length,
      },
    });

    const responsePayload = {
      packageId: `EVID-PACK-${disclosure.id.substring(0, 8).toUpperCase()}`,
      certificateId: disclosure.certificate.publicId,
      organization: disclosure.org.name,
      period: disclosure.period,
      requester: {
        name: disclosure.requesterName,
        org: disclosure.requesterOrg,
        email: disclosure.requesterEmail,
        purpose: disclosure.purpose,
      },
      approvedCategories: approvedCats,
      manifest: documents.map((doc) => ({
        id: doc.id,
        filename: doc.filename,
        category: doc.type,
        sizeBytes: doc.size,
        sha256Hash: doc.sha256,
        verificationTier: doc.tier,
      })),
      issuedAt: disclosure.decidedAt?.toISOString() || now.toISOString(),
      expiresAt: disclosure.downloadTokenExpiresAt?.toISOString(),
      disclaimer:
        "Confidential evidence pack disclosed under client explicit consent. For authorized recipient reliance only. Document hashes certify upload integrity.",
    };

    return new NextResponse(JSON.stringify(responsePayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="evidence-pack-${disclosure.period}-${disclosure.certificate.publicId}.json"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error serving evidence pack download:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}
