import { createHash } from "crypto";
import { prisma } from "./prisma";

export interface CreateAuditInput {
  orgId: string;
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown> | null;
}

export function computeAuditHash(
  prevHash: string,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  createdAtIso: string
): string {
  const payload = `${prevHash}|${actorId}|${action}|${entityType}|${entityId}|${createdAtIso}`;
  return createHash("sha256").update(payload).digest("hex");
}

export async function appendAuditEvent(input: CreateAuditInput) {
  const { orgId, actorId = null, action, entityType, entityId, metadata } = input;

  // Retrieve the latest event in this organization's audit chain
  const lastEvent = await prisma.auditEvent.findFirst({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: { hash: true },
  });

  const prevHash = lastEvent?.hash || "GENESIS";
  const now = new Date();
  const nowIso = now.toISOString();

  const hash = computeAuditHash(
    prevHash,
    actorId || "SYSTEM",
    action,
    entityType,
    entityId,
    nowIso
  );

  return await prisma.auditEvent.create({
    data: {
      orgId,
      actorId,
      action,
      entityType,
      entityId,
      metadataJson: metadata ? JSON.stringify(metadata) : null,
      prevHash,
      hash,
      createdAt: now,
    },
  });
}

/**
 * Verifies the cryptographic integrity of an organization's audit chain.
 * Recomputes SHA-256 hashes and verifies unbroken links from GENESIS.
 */
export async function verifyAuditChain(orgId: string): Promise<boolean> {
  const events = await prisma.auditEvent.findMany({
    where: { orgId },
    orderBy: { createdAt: "asc" },
  });

  if (events.length === 0) return true;

  let expectedPrevHash = "GENESIS";
  for (const ev of events) {
    if (ev.prevHash !== expectedPrevHash) {
      return false;
    }
    const computed = computeAuditHash(
      ev.prevHash,
      ev.actorId || "SYSTEM",
      ev.action,
      ev.entityType,
      ev.entityId,
      ev.createdAt.toISOString()
    );
    if (computed !== ev.hash) {
      return false;
    }
    expectedPrevHash = ev.hash;
  }

  return true;
}
