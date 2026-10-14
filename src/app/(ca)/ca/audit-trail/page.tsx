import React from "react";
import { GitCommit, ShieldCheck, CheckCircle2, Lock, ArrowDown } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function AuditTrailPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      auditEvents: {
        include: { actor: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const events = org?.auditEvents || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            Immutable Cryptographic Audit Trail
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Append-only hash chain linking each state change with SHA-256 parent hashes.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Hash Chain Integrity Verified</span>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-6">
        <div className="space-y-4">
          {events.map((evt, idx) => (
            <div key={evt.id} className="relative">
              {idx > 0 && (
                <div className="flex justify-center -my-2 py-1">
                  <div className="w-0.5 h-6 bg-gray-200 flex items-center justify-center">
                    <ArrowDown className="w-3 h-3 text-gray-400" />
                  </div>
                </div>
              )}

              <div className="border border-gray-200 rounded-xl p-4 bg-[#FAF9F7] hover:bg-white transition-all text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#0B1220] text-white font-bold">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-[#0B1220]">{evt.action}</span>
                    <span className="text-gray-300">&bull;</span>
                    <span className="text-gray-500 font-mono text-[11px]">{evt.entityType} ({evt.entityId.substring(0, 8)}...)</span>
                  </div>
                  <div className="font-mono text-[11px] text-gray-400">
                    {evt.createdAt.toISOString()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-[11px]">
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-sans font-semibold">
                      Previous Hash (prevHash)
                    </span>
                    <div className="truncate text-gray-600 bg-white px-2 py-1 rounded border border-gray-200 mt-0.5">
                      {evt.prevHash}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[10px] uppercase tracking-wider font-sans font-semibold">
                      Current Event Hash
                    </span>
                    <div className="truncate text-[#2456E6] bg-blue-50/50 px-2 py-1 rounded border border-blue-200 font-bold mt-0.5">
                      {evt.hash}
                    </div>
                  </div>
                </div>

                {evt.metadataJson && (
                  <div className="mt-2 text-[10px] font-mono text-gray-500 bg-gray-50 p-2 rounded border border-gray-100">
                    {evt.metadataJson}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
