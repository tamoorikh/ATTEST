import React from "react";

export type VerdictState = "amber" | "green" | "red";

interface VerdictCardProps {
  state: VerdictState;
  count: number;
  period?: string;
  title?: string;
  description?: string;
  ctaText?: string;
  onCtaClick?: () => void;
  className?: string;
}

export function VerdictCard({
  state,
  count,
  period = "April 2026",
  title,
  description,
  ctaText,
  onCtaClick,
  className = "",
}: VerdictCardProps) {
  const isGreen = state === "green" || count === 0;
  const isRed = state === "red";

  // Arc stroke color and dash offset
  const strokeColor = isGreen ? "#188A54" : isRed ? "#C0362C" : "#B45309";
  const dashOffset = isGreen ? 24 : isRed ? 180 : 80;

  // Default copy
  const defaultTitle = isGreen
    ? "Your numbers are ready for signing"
    : isRed
    ? `Action required — ${count} critical discrepancy detected`
    : `Almost there — ${count} thing${count > 1 ? "s" : ""} need${count > 1 ? "" : "s"} your attention`;

  const defaultDescription = isGreen
    ? "Everything matches and every question is answered. Your file has gone to your chartered accountant for the final signature — any bank will verify it in seconds."
    : isRed
    ? `The deterministic engine identified ${count} critical exception in statement reconciliation that must be cleared before a certificate can be signed.`
    : `Your bank statement and your books have been checked — and they agree. ${count} money question${
        count > 1 ? "s are" : " is"
      } waiting for your answer. Once they're cleared, your chartered accountant can sign your certificate.`;

  const defaultCta = isGreen
    ? "Nothing left for you — your CA takes it from here ✓"
    : isRed
    ? "Review critical issues below →"
    : "Next step: answer the questions below — about 5 minutes →";

  const displayTitle = title || defaultTitle;
  const displayDesc = description || defaultDescription;
  const displayCta = ctaText || defaultCta;

  const badgeBg = isGreen ? "bg-[#E7F5EE] text-[#188A54]" : isRed ? "bg-[#FBECEA] text-[#C0362C]" : "bg-[#FCF2E2] text-[#B45309]";
  const titleColor = isGreen ? "text-[#188A54]" : isRed ? "text-[#C0362C]" : "text-[#8A5A0B]";

  return (
    <div
      className={`bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[22px] p-7 sm:p-8 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] flex flex-col md:flex-row gap-6 md:gap-7 items-start md:items-center rise ${className}`}
    >
      {/* Animated SVG Ring */}
      <div className="relative w-[106px] h-[106px] shrink-0 grid place-items-center">
        <svg width="106" height="106" className="absolute inset-0 -rotate-90">
          <circle
            cx="53"
            cy="53"
            r="46"
            fill="none"
            stroke="#F1EFE9"
            strokeWidth="9"
          />
          <circle
            cx="53"
            cy="53"
            r="46"
            fill="none"
            stroke={strokeColor}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="289"
            strokeDashoffset={dashOffset}
            style={{
              transition: "stroke-dashoffset 1.4s cubic-bezier(.22,.75,.2,1), stroke 0.4s ease",
            }}
          />
        </svg>
        <div
          className={`w-[60px] h-[60px] rounded-full grid place-items-center text-2xl font-extrabold transition-all duration-400 z-10 ${badgeBg}`}
        >
          {isGreen ? "✓" : count}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 min-w-[260px]">
        <div className="text-[11px] font-bold tracking-[1.4px] uppercase text-[#A8A296]">
          Your verification status &middot; {period}
        </div>
        <h2 className={`text-xl sm:text-[22px] font-extrabold tracking-tight mt-1 mb-1.5 ${titleColor}`}>
          {displayTitle}
        </h2>
        <p className="text-[14.5px] text-[#6E6A61] max-w-[560px] leading-relaxed">
          {displayDesc}
        </p>
        <div className="mt-3.5">
          <button
            type="button"
            onClick={onCtaClick}
            className={`inline-flex items-center gap-2 font-semibold text-[13.5px] px-4 py-2 rounded-xl transition-all ${
              isGreen
                ? "bg-[#E7F5EE] text-[#188A54] border border-[#CBE6D8] cursor-default"
                : "bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] hover:-translate-y-0.5 cursor-pointer"
            }`}
          >
            <span>{displayCta}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default VerdictCard;
