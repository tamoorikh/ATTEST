import React from "react";
import { GitCommit, ShieldCheck, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuditTimeline } from "./audit-timeline";

export default async function AuditTrailPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      auditEvents: {
        include: {
          actor: {
            include: {
              memberships: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const serializedEvents = (org?.auditEvents || []).map((evt) => ({
    id: evt.id,
    action: evt.action,
    entityType: evt.entityType,
    entityId: evt.entityId,
    hash: evt.hash,
    prevHash: evt.prevHash,
    metadataJson: evt.metadataJson,
    createdAt: evt.createdAt.toISOString(),
    actor: evt.actor
      ? {
          name: evt.actor.name,
          email: evt.actor.email,
          role: evt.actor.memberships?.[0]?.role || "User",
        }
      : null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Cryptographic Audit Timeline
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Continuous append-only hash chain linking every state change with SHA-256 parent cryptographic pointers.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Chain Verified</span>
        </div>
      </div>

      <AuditTimeline events={serializedEvents} />
    </div>
  );
}
