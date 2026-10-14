"use client";

import React, { useState } from "react";
import { AlertTriangle, RotateCcw, XCircle, CheckCircle2 } from "lucide-react";

export function DemoBanner({
  orgName = "Meridian Textiles (Pvt) Ltd",
  allowReset = true,
}: {
  orgName?: string;
  allowReset?: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/demo/reset", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset demo data");
      setShowModal(false);
      window.location.reload();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setResetting(false);
    }
  }

  return (
    <>
      <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center justify-between max-w-7xl mx-auto w-full gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1 font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] shrink-0">
              <AlertTriangle className="w-3 h-3" />
              DEMONSTRATION DATA
            </span>
            <span className="font-medium truncate">
              {orgName} is currently operating in simulation mode. Not for real-world financial or lending reliance.
            </span>
          </div>

          {allowReset && (
            <button
              type="button"
              id="btnResetDemoData"
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-200/80 hover:bg-amber-300 text-amber-950 font-semibold text-[11px] transition-colors shrink-0"
              title="Reset demonstration data to baseline"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl text-xs">
            <div className="border-b border-[#E6E9EF] pb-3">
              <h3 className="text-base font-bold text-amber-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Reset Demonstration Data?
              </h3>
              <p className="text-[#64748B] text-xs mt-1">
                Idempotently restore Meridian Textiles (Pvt) Ltd to initial state.
              </p>
            </div>

            <p className="text-[#0F172A] leading-relaxed">
              This action will wipe all recent adjustments, exceptions, resolved statuses, and issued certificates, and re-seed the baseline rescaled demo dataset with clean audit hash chaining.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 text-red-900 border border-red-200 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E9EF]">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-[#64748B] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btnConfirmResetDemo"
                disabled={resetting}
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
              >
                {resetting ? "Resetting..." : "Confirm & Reseed"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
