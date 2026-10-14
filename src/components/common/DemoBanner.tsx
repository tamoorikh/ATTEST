import React from "react";
import { AlertTriangle } from "lucide-react";

export function DemoBanner({ orgName = "Meridian Textiles (Pvt) Ltd" }: { orgName?: string }) {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 text-xs text-amber-900 flex items-center justify-between">
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <span className="inline-flex items-center gap-1 font-semibold tracking-wide uppercase px-2 py-0.5 rounded bg-amber-500 text-white text-[10px]">
          <AlertTriangle className="w-3 h-3" />
          DEMONSTRATION DATA
        </span>
        <span className="font-medium">
          {orgName} is currently operating in simulation mode. Not for real-world financial or lending reliance.
        </span>
      </div>
    </div>
  );
}
