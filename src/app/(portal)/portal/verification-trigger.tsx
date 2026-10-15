"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { PipelineSteps } from "@/components/ui/PipelineSteps";
import { StatusPill } from "@/components/ui/StatusPill";

export function VerificationTrigger() {
  const router = useRouter();
  const [period, setPeriod] = useState("2026-04");
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setActiveStep(1);

    // Step animation interval: sequentially progress through the 6 stages
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 450);

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

      clearInterval(stepInterval);
      setActiveStep(7); // complete
      setResult(data.result);
      router.refresh();
    } catch (err: unknown) {
      clearInterval(stepInterval);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  const hasExceptions = result?.stats ? result.stats.exceptionsCount > 0 : true;

  return (
    <div className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] rise d1 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-[42px] h-[42px] rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5.5v13l11-6.5-11-6.5z" />
            </svg>
          </div>
          <div>
            <div className="font-bold text-[15px] text-[#17161A]">
              The checking machine
            </div>
            <div className="text-[12.5px] text-[#6E6A61]">
              Runs quietly every day — compares your bank, your books and your invoices
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={isRunning}
            className="px-3.5 py-2 rounded-xl border border-[#E9E6DF] font-semibold text-[13px] bg-white text-[#17161A] focus:outline-none focus:border-[#4F46E5]"
          >
            <option value="2026-04">April 2026</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-05">May 2026</option>
          </select>

          <button
            type="button"
            id="runBtn"
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-1.5 font-semibold text-[13.5px] px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer"
          >
            <span>{isRunning ? "Checking numbers…" : result ? "Check again ↺" : "Check my numbers ▸"}</span>
          </button>
        </div>
      </div>

      {/* 6-Stage Progress Pipeline */}
      {(isRunning || activeStep > 0) && (
        <div className="border-t border-dashed border-[#E9E6DF] pt-3.5">
          <PipelineSteps activeStep={activeStep} />

          {/* Plain Language Result Message */}
          {!isRunning && result && (
            <div
              className={`mt-3.5 p-3 sm:px-4 rounded-xl text-[13px] font-semibold border ${
                hasExceptions
                  ? "bg-[#FCF2E2] text-[#B45309] border-[#F0DDBB]"
                  : "bg-[#E7F5EE] text-[#188A54] border-[#CBE6D8]"
              }`}
            >
              {hasExceptions
                ? `✓ Check complete — your numbers are healthy. ${result.stats.exceptionsCount} question${
                    result.stats.exceptionsCount > 1 ? "s" : ""
                  } waiting for you below.`
                : "✓ Check complete — everything matches. Nothing for you to do."}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FBECEA] border border-[#F2CBC8] rounded-xl text-xs text-[#C0362C] font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Post-Run Result Card */}
      {result && !isRunning && (
        <div className="mt-3 p-4 bg-[#FAF9F6] border border-[#F1EFE9] rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F1EFE9] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-[#17161A] font-mono">
                Run #{result.runId.slice(-6).toUpperCase()}
              </span>
              <StatusPill
                status="COMPREHENSIVE"
                label={`Level ${result.verificationLevel.levelAchieved} Achieved`}
                variant="green"
                size="xs"
              />
            </div>
            <span className="text-xs text-[#6E6A61] italic">
              {result.diffSummary}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-[#E9E6DF]">
              <span className="text-[#6E6A61] block text-[11px] font-medium">Reconciliation Coverage</span>
              <span className="text-xl font-extrabold text-[#17161A] font-mono tabular-nums">
                {result.stats.coveragePercent}%
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E9E6DF]">
              <span className="text-[#6E6A61] block text-[11px] font-medium">Matched Transactions</span>
              <span className="text-xl font-extrabold text-[#188A54] font-mono tabular-nums">
                {result.stats.matchedCount} / {result.stats.totalBankTransactions}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E9E6DF]">
              <span className="text-[#6E6A61] block text-[11px] font-medium">Unmatched Items</span>
              <span className="text-xl font-extrabold text-[#B45309] font-mono tabular-nums">
                {result.stats.unmatchedBankCount} bank &bull; {result.stats.unmatchedLedgerCount} ledger
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E9E6DF]">
              <span className="text-[#6E6A61] block text-[11px] font-medium">Surfaced Exceptions</span>
              <span className="text-xl font-extrabold text-[#C0362C] font-mono tabular-nums">
                {result.stats.exceptionsCount} Total
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <p className="text-[#6E6A61] text-[11px]">
              <strong className="text-[#17161A]">Level Status: </strong>
              {result.verificationLevel.levelReason} {result.verificationLevel.nextSteps}
            </p>
            <button
              type="button"
              onClick={() => router.push("/portal/exceptions")}
              className="inline-flex items-center gap-1 text-[#4F46E5] hover:underline font-semibold text-xs shrink-0 cursor-pointer"
            >
              <span>Resolve Exceptions</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
