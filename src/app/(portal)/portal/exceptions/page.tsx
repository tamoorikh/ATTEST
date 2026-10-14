import React from "react";
import { AlertOctagon, FileCheck, MessageSquare, Paperclip, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

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
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const exceptions = org?.exceptions || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            Exception Resolution Desk
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Resolve deterministic engine exceptions with verifiable evidence for CA sign-off.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
          <AlertOctagon className="w-4 h-4 text-amber-600" />
          <span>{exceptions.length} Open Exceptions</span>
        </div>
      </div>

      <div className="space-y-6">
        {exceptions.map((exc) => (
          <div
            key={exc.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:border-gray-300 transition-all"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 bg-[#FAF9F7] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    exc.severity === "CRITICAL"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
                >
                  {exc.severity} SEVERITY
                </span>
                <span className="font-mono text-xs text-gray-500 font-semibold">{exc.type}</span>
                <span className="text-gray-300">&bull;</span>
                <span className="font-mono text-xs font-bold text-[#0B1220]">
                  {formatPaise(exc.amountPaise)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3 h-3" />
                  {exc.status}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#0B1220]">{exc.title}</h3>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{exc.explanation}</p>
              </div>

              {/* Suggested Resolution Box */}
              {exc.suggestedResolution && (
                <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 text-xs">
                  <div className="font-semibold text-blue-900 flex items-center gap-1.5 mb-1">
                    <FileCheck className="w-3.5 h-3.5 text-[#2456E6]" />
                    Engine Suggested Resolution
                  </div>
                  <div className="text-blue-800 leading-relaxed">{exc.suggestedResolution}</div>
                </div>
              )}

              {/* Evidence Section */}
              <div className="pt-2">
                <div className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
                  <Paperclip className="w-3.5 h-3.5 text-gray-400" />
                  Attached Corroborating Evidence ({exc.evidence.length})
                </div>

                {exc.evidence.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {exc.evidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-2.5 rounded-lg border border-gray-200 bg-gray-50 flex items-start justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#0B1220]">{ev.filename}</div>
                          <div className="font-mono text-[10px] text-gray-500 truncate max-w-xs mt-0.5">
                            SHA: {ev.sha256.substring(0, 24)}...
                          </div>
                          {ev.notes && <div className="text-[11px] text-gray-600 mt-1">{ev.notes}</div>}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-gray-600 border border-gray-200 font-mono">
                          Validated
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic bg-gray-50 p-2.5 rounded-lg border border-dashed border-gray-200">
                    No evidence attached yet. Upload documentation to support resolution.
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <span className="text-[11px] text-gray-400 font-mono">
                  Linked Bank Tx: {exc.bankTx?.ref || exc.bankTxId || "None"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Add Evidence
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded-lg bg-[#0B1220] text-white text-xs font-medium hover:bg-black transition-colors"
                  >
                    Submit for CA Review
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
