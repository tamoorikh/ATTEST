"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";

const PIPELINE_STEPS = [
  { id: 1, name: "Normalize", desc: "Integer paisa arithmetic" },
  { id: 2, name: "Validate", desc: "R1–R4 continuity rules" },
  { id: 3, name: "Classify", desc: "Deterministic category heuristics" },
  { id: 4, name: "Match", desc: "1:1, 1:many, and partial reconciliation" },
  { id: 5, name: "Three-Way", desc: "Bank ↔ Ledger ↔ Invoices trace" },
  { id: 6, name: "Exceptions", desc: "Explainable variance generation" },
];

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

    // Step animation interval
    const stepInterval = setInterval(() => {
      setActiveStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 400);

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
      setActiveStep(6);
      setResult(data.result);
      router.refresh();
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-[#E6E9EF] p-5 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#0F172A]">
              Deterministic Verification Engine
            </h2>
            <StatusPill status="AUTO_MATCHED" label="Deterministic IP" size="xs" variant="blue" />
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Reconciles bank statements against general ledger entries and sales tax invoices with explainable audit trails.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            disabled={isRunning}
            className="text-xs font-mono font-medium border border-[#E6E9EF] rounded-lg px-3 py-2 bg-[#F7F8FA] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            <option value="2026-04">April 2026 (Active Period)</option>
            <option value="2026-03">March 2026</option>
            <option value="2026-05">May 2026</option>
          </select>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Verification</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 6-Step Pipeline Progress Bar (Visible while running or active) */}
      {isRunning && (
        <div className="pt-2 pb-1 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-[#0F172A]">
            <span className="flex items-center gap-1.5 text-[#2563EB]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Executing step {activeStep} of 6: {PIPELINE_STEPS[activeStep - 1]?.name}</span>
            </span>
            <span className="font-mono text-[#64748B]">
              {Math.round((activeStep / 6) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {PIPELINE_STEPS.map((step) => {
              const isDone = activeStep > step.id;
              const isCurrent = activeStep === step.id;
              return (
                <div
                  key={step.id}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    isDone
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : isCurrent
                      ? "bg-blue-50 border-[#2563EB] text-[#2563EB] ring-1 ring-[#2563EB]"
                      : "bg-[#F7F8FA] border-[#E6E9EF] text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold">
                      {step.id}. {step.name}
                    </span>
                    {isDone ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3 h-3 animate-spin text-[#2563EB]" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <p className="text-[9.5px] mt-0.5 leading-tight opacity-80 truncate">
                    {step.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Post-Run Result Card */}
      {result && !isRunning && (
        <div className="mt-3 p-4 bg-[#F7F8FA] border border-[#E6E9EF] rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E9EF] pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
              <span className="text-xs font-bold text-[#0F172A]">
                Run #{result.runId.slice(-6).toUpperCase()} Executed
              </span>
              <StatusPill
                status="COMPREHENSIVE"
                label={`Level ${result.verificationLevel.levelAchieved} Achieved`}
                variant="green"
                size="xs"
              />
            </div>
            <span className="text-xs text-[#64748B] italic">
              {result.diffSummary}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3 rounded-lg border border-[#E6E9EF]">
              <span className="text-[#64748B] block text-[11px] font-medium">Reconciliation Coverage</span>
              <span className="text-xl font-extrabold text-[#0F172A] font-mono tabular-nums">
                {result.stats.coveragePercent}%
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E6E9EF]">
              <span className="text-[#64748B] block text-[11px] font-medium">Matched Transactions</span>
              <span className="text-xl font-extrabold text-[#16A34A] font-mono tabular-nums">
                {result.stats.matchedCount} / {result.stats.totalBankTransactions}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E6E9EF]">
              <span className="text-[#64748B] block text-[11px] font-medium">Unmatched Items</span>
              <span className="text-xl font-extrabold text-[#D97706] font-mono tabular-nums">
                {result.stats.unmatchedBankCount} bank &bull; {result.stats.unmatchedLedgerCount} ledger
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-[#E6E9EF]">
              <span className="text-[#64748B] block text-[11px] font-medium">Surfaced Exceptions</span>
              <span className="text-xl font-extrabold text-[#DC2626] font-mono tabular-nums">
                {result.stats.exceptionsCount} Total
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
            <p className="text-[#64748B] text-[11px]">
              <strong className="text-[#0F172A]">Level Status: </strong>
              {result.verificationLevel.levelReason} {result.verificationLevel.nextSteps}
            </p>
            <button
              onClick={() => router.push("/portal/exceptions")}
              className="inline-flex items-center gap-1 text-[#2563EB] hover:underline font-semibold text-xs shrink-0"
            >
              Resolve Exceptions <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
