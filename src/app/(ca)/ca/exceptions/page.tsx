import React from "react";
import { Scale, FileCheck, CheckCircle2, AlertTriangle, Paperclip, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyButton } from "@/components/ui/CopyButton";

export default async function CAExceptionsReviewPage() {
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
      },
    },
  });

  const exceptions = org?.exceptions || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
          CA Independent Exception Assessment
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Review discrepancies, inspect client-provided supporting evidence, and evaluate audit resolutions.
        </p>
      </div>

      <div className="space-y-6">
        {exceptions.map((exc) => {
          const borderColor =
            exc.severity === "CRITICAL"
              ? "border-l-red-500"
              : exc.severity === "HIGH"
              ? "border-l-amber-500"
              : "border-l-blue-500";

          return (
            <div
              key={exc.id}
              className={`bg-white border border-[#E6E9EF] border-l-4 ${borderColor} rounded-xl overflow-hidden shadow-sm p-6 space-y-4`}
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E9EF] pb-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <StatusPill rawValue={exc.severity} type="severity" />
                  <span className="text-base font-bold text-[#0F172A]">{exc.title}</span>
                  <span className="text-xs text-[#64748B] font-mono">
                    ({formatEnumLabel(exc.type)})
                  </span>
                </div>
                <div className="font-mono text-base font-bold text-[#0F172A] tabular-nums">
                  {formatPaise(exc.amountPaise)}
                </div>
              </div>

              {/* Explanation & Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#F7F8FA] p-3.5 rounded-xl border border-[#E6E9EF] space-y-1">
                  <span className="font-semibold text-[#0F172A] block uppercase text-[10px] tracking-wider">
                    Discrepancy Findings
                  </span>
                  <p className="text-[#64748B] leading-relaxed">{exc.explanation}</p>
                </div>

                <div className="bg-[#F7F8FA] p-3.5 rounded-xl border border-[#E6E9EF] space-y-1">
                  <span className="font-semibold text-[#0F172A] block uppercase text-[10px] tracking-wider">
                    Audit Resolution Standard
                  </span>
                  <p className="text-[#64748B] leading-relaxed">{exc.suggestedResolution}</p>
                </div>
              </div>

              {/* Evidence Review */}
              <div>
                <div className="text-xs font-semibold text-[#0F172A] mb-2 flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-[#64748B]" />
                  Submitted Evidence Documents ({exc.evidence.length})
                </div>
                {exc.evidence.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {exc.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg border border-[#E6E9EF] bg-white text-xs space-y-1"
                      >
                        <div className="font-semibold text-[#0F172A]">{ev.filename}</div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                          <span>SHA-256:</span>
                          <span className="font-mono font-medium text-[#2563EB]">
                            {formatShortHash(ev.sha256, 8)}
                          </span>
                          <CopyButton value={ev.sha256} label="Copy evidence hash" />
                        </div>
                        {ev.notes && (
                          <div className="text-[11px] text-[#64748B] italic">{ev.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-[#64748B] italic bg-[#F7F8FA] p-3 rounded-lg border border-[#E6E9EF]">
                    No evidence submitted by client for this item yet.
                  </div>
                )}
              </div>

              {/* CA Action Footer */}
              <div className="pt-3 border-t border-[#E6E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] font-medium">Workflow Status:</span>
                  <StatusPill rawValue={exc.status} type="status" />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg border border-[#E6E9EF] text-xs font-semibold text-[#0F172A] hover:bg-[#F7F8FA] transition-colors"
                  >
                    Request Clarification
                  </button>
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    Approve Resolution
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
