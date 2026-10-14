import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { appendAuditEvent } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.companyProfile.findUnique({
    where: { orgId: session.user.orgId },
    include: {
      org: {
        include: {
          bankAccounts: true,
          sourceDocuments: true,
        },
      },
    },
  });

  return NextResponse.json({ profile });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    step,
    legalName,
    registrationNumber,
    taxId,
    city,
    address,
    jurisdiction,
    sourcesDeclared,
    authorized,
  } = body;

  const orgId = session.user.orgId;

  const updated = await prisma.companyProfile.upsert({
    where: { orgId },
    create: {
      orgId,
      legalName: legalName || session.user.orgName,
      registrationNumber,
      taxId,
      city,
      address,
      jurisdiction: jurisdiction || "PK",
      onboardingStep: step || 1,
      sourcesDeclared: sourcesDeclared ? JSON.stringify(sourcesDeclared) : null,
      authorizedAt: authorized ? new Date() : null,
    },
    update: {
      ...(legalName && { legalName }),
      ...(registrationNumber !== undefined && { registrationNumber }),
      ...(taxId !== undefined && { taxId }),
      ...(city !== undefined && { city }),
      ...(address !== undefined && { address }),
      ...(jurisdiction && { jurisdiction }),
      ...(step !== undefined && { onboardingStep: step }),
      ...(sourcesDeclared !== undefined && { sourcesDeclared: JSON.stringify(sourcesDeclared) }),
      ...(authorized ? { authorizedAt: new Date() } : {}),
    },
  });

  // Log audit event on authorization
  if (authorized) {
    await appendAuditEvent({
      orgId,
      actorId: session.user.id,
      action: "ONBOARDING_AUTHORIZED",
      entityType: "CompanyProfile",
      entityId: updated.id,
      metadata: { step, authorizedAt: updated.authorizedAt },
    });
  }

  return NextResponse.json({ profile: updated });
}
