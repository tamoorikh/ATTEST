import React from "react";
import { Tag } from "./Tag";
import { ChevronRight } from "lucide-react";

export interface ExceptionRowProps {
  id: string;
  title: string;
  description: string;
  amountFormatted: string; // e.g. "PKR 118,500"
  severity?: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO" | string;
  tagText?: string;
  done?: boolean;
  extraMeta?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ExceptionRow({
  id,
  title,
  description,
  amountFormatted,
  severity = "HIGH",
  tagText,
  done = false,
  extraMeta,
  onClick,
  className = "",
}: ExceptionRowProps) {
  const isCritical = severity === "CRITICAL";
  const isHigh = severity === "HIGH";

  // Icon chip styles
  const ticoClass = done
    ? "bg-[#E7F5EE] text-[#188A54]"
    : isCritical
    ? "bg-[#FBECEA] text-[#C0362C]"
    : "bg-[#FCF2E2] text-[#B45309]";

  // Severity tag variant
  const tagVariant = done ? "ok" : isCritical ? "crit" : isHigh ? "warn" : "info";
  const defaultTagText = done
    ? "ANSWERED"
    : isCritical
    ? "IMPORTANT"
    : isHigh
    ? "WORTH CHECKING"
    : "REVIEW";
  const displayTagText = tagText || defaultTagText;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`flex gap-3.5 sm:gap-4 p-4 sm:px-6 border-b border-[#F1EFE9] last:border-b-0 items-start sm:items-center transition-colors cursor-pointer hover:bg-[#FCFBF8] ${
        done ? "opacity-55" : ""
      } ${className}`}
    >
      {/* Severity Icon Chip (Inline SVG only, zero emoji) */}
      <div
        className={`w-10 h-10 rounded-xl shrink-0 grid place-items-center font-extrabold text-sm ${ticoClass}`}
      >
        {done ? (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <span className="text-base font-bold leading-none">!</span>
        )}
      </div>

      {/* Main Body */}
      <div className="flex-1 min-w-0">
        <div
          className={`font-bold text-[14.5px] text-[#17161A] truncate ${
            done ? "line-through text-[#6E6A61]" : ""
          }`}
        >
          {title}
        </div>
        <div className="text-[12.5px] text-[#6E6A61] mt-0.5 line-clamp-1 leading-normal">
          {description}
        </div>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Tag variant={tagVariant}>{displayTagText}</Tag>
          <Tag variant="mut" mono>{id}</Tag>
          {extraMeta}
        </div>
      </div>

      {/* Amount in Monospace */}
      <div className="font-mono font-semibold text-[13.5px] text-[#17161A] whitespace-nowrap tabular-nums text-right pl-2">
        {amountFormatted}
      </div>

      {/* Chevron or Done Badge */}
      <div className="shrink-0 flex items-center pl-1">
        {done ? (
          <Tag variant="ok">DONE</Tag>
        ) : (
          <ChevronRight className="w-5 h-5 text-[#A8A296]" />
        )}
      </div>
    </div>
  );
}

export default ExceptionRow;
