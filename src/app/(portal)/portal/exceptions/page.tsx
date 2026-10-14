import React from "react";
import { AlertTriangle, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ExceptionDesk } from "./exception-desk";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function ExceptionsPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      exceptions: {
        include: {
          bankTx: true,
          ledgerEntry: true,
          evidence: true,
          reviewNotes: {
            include: { author: true },
            orderBy: { createdAt: "desc" },
          },
          comments: {
            include: { author: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      sourceDocuments: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const exceptions = org?.exceptions || [];
  const vaultDocuments = org?.sourceDocuments || [];
  const openCount = exceptions.filter((e) => e.status === "OPEN" || e.status === "MORE_INFO_REQUESTED").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
            Exception Resolution Desk
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Resolve deterministic engine variances with corroborating evidence for licensed CA sign-off.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusPill
            status="OPEN"
            label={`${openCount} Actionable Exceptions`}
            size="md"
            variant="amber"
          />
        </div>
      </div>

      {/* Exception Cards Desk */}
      <ExceptionDesk
        exceptions={exceptions as any}
        vaultDocuments={vaultDocuments as any}
      />
    </div>
  );
}
