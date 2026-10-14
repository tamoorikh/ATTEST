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
          comments: {
            include: { author: true },
          },
        },
        orderBy: { severity: "asc" },
      },
    },
  });

  const exceptions = org?.exceptions || [];
  const openCount = exceptions.filter((e) => e.status === "OPEN").length;

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
      <ExceptionDesk exceptions={exceptions as any} />
    </div>
  );
}
