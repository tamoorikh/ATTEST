"use client";

import React, { useEffect, useState } from "react";

interface SummaryStripProps {
  balancePaise?: number; // e.g. 163650000 -> PKR 1,636,500
  matchedCount?: number;
  totalTransactions?: number;
  openQuestionsCount?: number;
  certificateStatus?: string; // e.g. "Pending", "With CA", "Valid"
  className?: string;
}

export function SummaryStrip({
  balancePaise = 163650000,
  matchedCount = 7,
  totalTransactions = 8,
  openQuestionsCount = 2,
  certificateStatus,
  className = "",
}: SummaryStripProps) {
  const targetBalance = Math.round(balancePaise / 100);
  const targetMatchPct = totalTransactions > 0 ? Math.round((matchedCount / totalTransactions) * 100) : 0;

  const [currentBalance, setCurrentBalance] = useState(0);
  const [currentMatchPct, setCurrentMatchPct] = useState(0);

  useEffect(() => {
    // Check prefers-reduced-motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setCurrentBalance(targetBalance);
      setCurrentMatchPct(targetMatchPct);
      return;
    }

    const startTime = performance.now();
    const duration = 1200;

    let animFrame: number;
    const tick = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);

      setCurrentBalance(Math.round(targetBalance * ease));
      setCurrentMatchPct(Math.round(targetMatchPct * ease));

      if (p < 1) {
        animFrame = requestAnimationFrame(tick);
      }
    };

    animFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrame);
  }, [targetBalance, targetMatchPct]);

  const certDisplay = certificateStatus || (openQuestionsCount === 0 ? "With CA" : "Pending");
  const certSubtitle =
    certDisplay === "Valid"
      ? "publicly verifiable ✓"
      : openQuestionsCount === 0
      ? "all checks passed ✓"
      : "signing waits on your answers";

  return (
    <div
      className={`bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] p-1.5 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rise d1 ${className}`}
    >
      {/* Stat 1: Money in bank */}
      <div className="p-5 sm:px-6 hover:bg-[#FCFBF8] transition-colors rounded-xl">
        <div className="text-[11px] font-semibold text-[#A8A296] mb-1">
          Money in bank (verified)
        </div>
        <div className="font-heading text-2xl font-extrabold tracking-[-0.02em] font-mono tabular-nums text-[#17161A]">
          PKR {currentBalance.toLocaleString("en-US")}
        </div>
        <div className="text-xs text-[#6E6A61] mt-0.5">
          statement arithmetic ✓
        </div>
      </div>

      {/* Stat 2: Records that match */}
      <div className="p-5 sm:px-6 border-t sm:border-t-0 sm:border-l border-[#F1EFE9] hover:bg-[#FCFBF8] transition-colors rounded-xl">
        <div className="text-[11px] font-semibold text-[#A8A296] mb-1">
          Records that match
        </div>
        <div className="font-heading text-2xl font-extrabold tracking-[-0.02em] font-mono tabular-nums text-[#17161A]">
          {currentMatchPct}%
        </div>
        <div className="text-xs text-[#6E6A61] mt-0.5">
          {matchedCount === totalTransactions && totalTransactions > 0
            ? `${totalTransactions} of ${totalTransactions} — everything matches`
            : `${matchedCount} of ${totalTransactions} checked`}
        </div>
      </div>

      {/* Stat 3: Questions for you */}
      <div className="p-5 sm:px-6 border-t lg:border-t-0 lg:border-l border-[#F1EFE9] hover:bg-[#FCFBF8] transition-colors rounded-xl">
        <div className="text-[11px] font-semibold text-[#A8A296] mb-1">
          Questions for you
        </div>
        <div className="font-heading text-2xl font-extrabold tracking-[-0.02em] font-mono tabular-nums text-[#17161A]">
          {openQuestionsCount}
        </div>
        <div className="text-xs text-[#6E6A61] mt-0.5">
          {openQuestionsCount === 0 ? "all answered ✓" : "each takes ~2 minutes"}
        </div>
      </div>

      {/* Stat 4: Certificate */}
      <div className="p-5 sm:px-6 border-t sm:border-t-0 sm:border-l border-[#F1EFE9] hover:bg-[#FCFBF8] transition-colors rounded-xl">
        <div className="text-[11px] font-semibold text-[#A8A296] mb-1">
          Certificate
        </div>
        <div className="font-heading text-2xl font-extrabold tracking-[-0.02em] text-[#17161A]">
          {certDisplay}
        </div>
        <div className="text-xs text-[#6E6A61] mt-0.5">
          {certSubtitle}
        </div>
      </div>
    </div>
  );
}

export default SummaryStrip;
