"use client";

import React, { useState } from "react";
import { Info } from "lucide-react";

interface PriorityScoreChipProps {
  score: number;
  severity: string;
  amountPaise: number;
  daysWaiting: number;
}

export function PriorityScoreChip({
  score,
  severity,
  amountPaise,
  daysWaiting,
}: PriorityScoreChipProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine chip color based on score
  const colorClass =
    score >= 80
      ? "bg-red-50 text-red-700 border-red-200"
      : score >= 50
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-blue-50 text-blue-700 border-blue-200";

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border cursor-help transition-all ${colorClass}`}
      >
        <span>P-{score}</span>
        <Info className="w-3 h-3 opacity-60" />
      </div>

      {showTooltip && (
        <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#0F172A] text-white rounded-xl shadow-xl text-[11px] font-sans leading-tight pointer-events-none">
          <div className="font-bold text-white mb-1 flex items-center justify-between">
            <span>Priority Score: {score}/100</span>
            <span className="font-mono text-[10px] text-blue-300">Weighted Risk</span>
          </div>
          <div className="space-y-1 text-slate-300 text-[10.5px]">
            <div className="flex justify-between">
              <span>Severity impact ({severity}):</span>
              <span className="font-mono text-white">40% weight</span>
            </div>
            <div className="flex justify-between">
              <span>Materiality (value at risk):</span>
              <span className="font-mono text-white">40% weight</span>
            </div>
            <div className="flex justify-between">
              <span>Age factor ({daysWaiting}d waiting):</span>
              <span className="font-mono text-white">20% weight</span>
            </div>
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-700 text-[10px] text-slate-400 italic">
            Formula: Severity (40) + Value Impact (40) + Age (20)
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#0F172A]" />
        </div>
      )}
    </div>
  );
}
