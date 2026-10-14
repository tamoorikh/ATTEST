"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Loader2, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from "lucide-react";

export function VerificationTrigger() {
  const router = useRouter();
  const [period, setPeriod] = useState("2026-04");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/reconciliation/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to execute reconciliation");
      }

      setResult(data.result);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#0B1220] flex items-center gap-2">
            <Play className="w-4 h-4 text-[#2456E6]" />
            Deterministic Reconciliation Engine
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Execute 1:1, 1:many, and 3-way continuous matching with explainable audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={isRunning}
            className="text-xs font-mono border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
          >
            <option value="2026-04">April 2026 (Active Period)</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-05">May 2026</option>
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2456E6] hover:bg-[#1D44B8] text-white text-xs font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Executing Engine...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                Run verification
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-semibold text-gray-900">
                Run #{result.runId.slice(-6).toUpperCase()} Completed
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#2456E6] border border-blue-200">
                Level {result.verificationLevel.levelAchieved} Achieved
              </span>
            </div>
            <span className="text-xs text-gray-500 italic">
              {result.diffSummary}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block text-[11px]">Coverage</span>
              <span className="text-base font-bold text-gray-900 font-mono">
                {result.stats.coveragePercent}%
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block text-[11px]">Matched Tx</span>
              <span className="text-base font-bold text-emerald-600 font-mono">
                {result.stats.matchedCount} / {result.stats.totalBankTransactions}
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block text-[11px]">Unmatched</span>
              <span className="text-base font-bold text-amber-600 font-mono">
                {result.stats.unmatchedBankCount} bank &bull; {result.stats.unmatchedLedgerCount} ledger
              </span>
            </div>

            <div className="bg-white p-2.5 rounded border border-gray-200">
              <span className="text-gray-500 block text-[11px]">Exceptions</span>
              <span className="text-base font-bold text-rose-600 font-mono">
                {result.stats.exceptionsCount} Total
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <p className="text-gray-600 text-[11px]">
              <strong className="text-gray-900">Next Step: </strong>
              {result.verificationLevel.nextSteps}
            </p>
            <button
              onClick={() => router.push("/portal/exceptions")}
              className="inline-flex items-center gap-1 text-[#2456E6] hover:underline font-medium text-xs self-start sm:self-auto"
            >
              Review Exceptions <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
