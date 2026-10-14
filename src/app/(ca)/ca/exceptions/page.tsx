import React from "react";
import { Scale, FileCheck, CheckCircle2, AlertTriangle, Paperclip } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

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
        <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
          CA Independent Exception Assessment
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Review exceptions, examine client-provided documentation, and attach formal CA audit notes.
        </p>
      </div>

      <div className="space-y-6">
        {exceptions.map((exc) => (
          <div
            key={exc.id}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-800">
                  {exc.type}
                </span>
                <span className="text-sm font-bold text-[#0B1220]">{exc.title}</span>
              </div>
              <div className="font-mono text-sm font-bold text-gray-900">
                {formatPaise(exc.amountPaise)}
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">{exc.explanation}</p>

            <div className="bg-[#FAF9F7] p-3 rounded-lg border border-gray-200 text-xs">
              <span className="font-semibold text-gray-700 block mb-1">Audit Resolution Standard</span>
              <span className="text-gray-600">{exc.suggestedResolution}</span>
            </div>

            {/* Evidence Review */}
            <div>
              <div className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-gray-500" />
                Submitted Evidence Files ({exc.evidence.length})
              </div>
              {exc.evidence.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {exc.evidence.map((ev) => (
                    <div key={ev.id} className="p-3 rounded-lg border border-gray-200 bg-white text-xs">
                      <div className="font-semibold text-[#0B1220]">{ev.filename}</div>
                      <div className="font-mono text-[10px] text-gray-400 mt-0.5 truncate">
                        SHA-256: {ev.sha256}
                      </div>
                      {ev.notes && <div className="text-[11px] text-gray-600 mt-1">{ev.notes}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No evidence uploaded by client yet.</div>
              )}
            </div>

            {/* CA Action */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-amber-700 font-medium">Status: {exc.status}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Request Clarification
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
                >
                  Approve Resolution
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
