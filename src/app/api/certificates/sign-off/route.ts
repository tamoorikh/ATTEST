import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";
import { evaluatePreIssuanceGates } from "@/lib/gates";
import {
  generatePublicId,
  canonicalizeJson,
  computePayloadHash,
  signPayloadHash,
  ATTEST_SCOPE_LANGUAGE,
  CanonicalCertificatePayload,
} from "@/lib/certificate";

const SignOffSchema = z.object({
  period: z.string().min(4),
  caConclusion: z.string().min(50, "Conclusion note must be at least 50 characters"),
  confirmScope: z.boolean().refine((val) => val === true, "Must confirm scope acknowledgement"),
  orgId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const parsed = SignOffSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { period, caConclusion } = parsed.data;

    let orgId = parsed.data.orgId || session?.user?.orgId;
    if (!orgId) {
      const demoOrg = await prisma.organization.findFirst({
        where: { isDemo: true },
      });
      orgId = demoOrg?.id;
    }

    if (!orgId) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Identify CA user
    let caUser = null;
    if (session?.user?.id) {
      caUser = await prisma.user.findUnique({ where: { id: session.user.id } });
    }
    if (!caUser) {
      caUser = await prisma.user.findFirst({
        where: { email: "ca@attest.pk" },
      });
    }

    if (!caUser) {
      return NextResponse.json({ error: "Licensed CA signatory not found" }, { status: 403 });
    }

    // Enforce pre-issuance gates
    const evaluation = await evaluatePreIssuanceGates(orgId, period, caConclusion);
    if (!evaluation.canIssue) {
      return NextResponse.json(
        {
          error: "Pre-issuance gates blocked issuance",
          gates: evaluation.gates,
          blockedReasons: evaluation.gates.filter((g) => g.status === "BLOCKED").map((g) => g.reason),
        },
        { status: 400 }
      );
    }

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      include: { companyProfile: true },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization record not found" }, { status: 404 });
    }

    // Check for prior issued certificate for supersession
    const priorCert = await prisma.certificate.findFirst({
      where: {
        orgId,
        periodStart: { gte: new Date(`${period}-01`) },
        periodEnd: { lte: new Date(`${period}-31T23:59:59.999Z`) },
        status: "ISSUED",
      },
      orderBy: { createdAt: "desc" },
    });

    const publicId = generatePublicId(2026);
    const now = new Date();
    const nowIso = now.toISOString();

    const canonicalPayloadData: CanonicalCertificatePayload = {
      publicId,
      organization: {
        name: org.name,
        taxId: org.companyProfile?.taxId || null,
        registrationNumber: org.companyProfile?.registrationNumber || null,
        jurisdiction: org.companyProfile?.jurisdiction || "PK",
      },
      level: evaluation.level === 3 ? "LEVEL_3" : evaluation.level === 2 ? "LEVEL_2" : "LEVEL_1",
      levelAchieved: evaluation.level,
      levelDescription: evaluation.levelSummary,
      period: {
        start: `${period}-01`,
        end: `${period}-30`,
        code: period,
      },
      coveragePercent: evaluation.coveragePercent,
      procedures: evaluation.procedures,
      disclosedLimitations: evaluation.disclosedLimitations.map(
        (l) => `${l.title} (${l.severity}): ${l.clientTreatment || "Documented"} [CA: ${l.caTreatment || "Recorded"}]`
      ),
      scope: ATTEST_SCOPE_LANGUAGE,
      caConclusion: caConclusion.trim(),
      signatory: {
        name: caUser.name || "Ayesha Siddiqui, FCA",
        email: caUser.email,
        credentialLine: "Chartered Accountant (ICAP-49102) • Senior Assurance Partner",
      },
      issuedAt: nowIso,
      signatureMode: "DEVELOPMENT",
    };

    const canonicalPayload = canonicalizeJson(canonicalPayloadData);
    const payloadHash = computePayloadHash(canonicalPayload);
    const signature = signPayloadHash(payloadHash);

    // Save Certificate in DB
    const newCert = await prisma.$transaction(async (tx) => {
      const created = await tx.certificate.create({
        data: {
          orgId,
          publicId,
          level: canonicalPayloadData.level,
          periodStart: new Date(`${period}-01`),
          periodEnd: new Date(`${period}-30T23:59:59.999Z`),
          status: "ISSUED",
          scopeJson: JSON.stringify({
            scope: ATTEST_SCOPE_LANGUAGE,
            standards: ["IFRS for SMEs", "Attest Deterministic Verification Rules R1–R4"],
          }),
          coverageJson: JSON.stringify({
            coveragePercent: evaluation.coveragePercent,
            procedures: evaluation.procedures,
          }),
          signedById: caUser.id,
          payloadHash,
          signature,
          signatureMode: "DEVELOPMENT",
          canonicalPayload,
          caConclusion: caConclusion.trim(),
          disclosedLimitations: JSON.stringify(evaluation.disclosedLimitations),
          levelAchieved: evaluation.level,
          coveragePercent: evaluation.coveragePercent,
          proceduresJson: JSON.stringify(evaluation.procedures),
          issuedAt: now,
          version: priorCert ? priorCert.version + 1 : 1,
        },
      });

      // If superseding a prior certificate
      if (priorCert) {
        await tx.certificate.update({
          where: { id: priorCert.id },
          data: {
            status: "SUPERSEDED",
            supersededById: created.id,
          },
        });
      }

      return created;
    });

    // Audit logs
    if (priorCert) {
      await appendAuditEvent({
        orgId,
        actorId: caUser.id,
        action: "CERTIFICATE_SUPERSEDED",
        entityType: "Certificate",
        entityId: priorCert.id,
        metadata: {
          priorPublicId: priorCert.publicId,
          supersededByPublicId: newCert.publicId,
        },
      });
    }

    await appendAuditEvent({
      orgId,
      actorId: caUser.id,
      action: "CERTIFICATE_ISSUED",
      entityType: "Certificate",
      entityId: newCert.id,
      metadata: {
        publicId: newCert.publicId,
        level: newCert.level,
        payloadHash: newCert.payloadHash,
        version: newCert.version,
      },
    });

    // Notify organization members
    const orgMembers = await prisma.membership.findMany({
      where: { orgId },
      include: { user: true },
    });

    for (const m of orgMembers) {
      await prisma.notification.create({
        data: {
          orgId,
          userId: m.userId,
          title: "Continuous Assurance Certificate Issued",
          message: `Certificate ${newCert.publicId} has been signed and issued by ${caUser.name}.`,
          type: "SUCCESS",
          link: `/portal/certificate`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      certificate: newCert,
      publicUrl: `/verify/${newCert.publicId}`,
    });
  } catch (error: unknown) {
    console.error("Error issuing certificate:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to issue certificate" },
      { status: 500 }
    );
  }
}
