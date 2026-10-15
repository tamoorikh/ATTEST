import React from "react";
import { formatEnumLabel } from "@/lib/labels";

export type SemanticColor = "green" | "amber" | "red" | "blue" | "gray";

interface StatusPillProps {
  status?: string | null | undefined;
  rawValue?: string | null | undefined;
  type?: string;
  label?: string;
  variant?: SemanticColor | "auto";
  size?: "xs" | "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function getVariantFromStatus(status: string | null | undefined): SemanticColor {
  if (!status) return "gray";
  const s = status.toUpperCase();

  // Green / Success
  if (
    s === "RESOLVED" ||
    s === "WAIVED" ||
    s === "MATCHED" ||
    s === "AUTO_MATCHED" ||
    s === "CONFIRMED" ||
    s === "THREE_WAY_MATCHED" ||
    s === "PARSED" ||
    s === "STANDARD_ASSURANCE" ||
    s === "COMPREHENSIVE" ||
    s === "PASS" ||
    s === "COMPLETED" ||
    s === "ISSUED" ||
    s === "LEVEL_2" ||
    s === "LEVEL_3" ||
    s === "VALID"
  ) {
    return "green";
  }

  // Red / Critical
  if (
    s === "CRITICAL" ||
    s === "FAILED" ||
    s === "STATEMENT_BALANCE_MISMATCH" ||
    s === "CONSECUTIVE_CONTINUITY_BREAK" ||
    s === "BALANCE_DISCREPANCY" ||
    s === "FAIL" ||
    s === "ERROR" ||
    s === "REVOKED" ||
    s === "SIGNATURE_INVALID"
  ) {
    return "red";
  }

  // Amber / Warning / Action Required
  if (
    s === "OPEN" ||
    s === "HIGH" ||
    s === "AMBIGUOUS" ||
    s === "PARTIAL" ||
    s === "NEEDS_OCR" ||
    s === "PENDING" ||
    s === "PENDING_REVIEW" ||
    s === "IN_REVIEW" ||
    s === "DUPLICATE_PAYMENT" ||
    s === "UNRECORDED_CREDIT" ||
    s === "UNRECORDED_SALE" ||
    s === "PAYMENT_WITHOUT_INVOICE" ||
    s === "LEDGER_WITHOUT_BANK" ||
    s === "MISSING_INVOICE" ||
    s === "EXCEPTION" ||
    s === "SUPERSEDED" ||
    s === "CLIENT_SUBMITTED" ||
    s === "MORE_INFO_REQUESTED"
  ) {
    return "amber";
  }

  // Blue / Info
  if (
    s === "MEDIUM" ||
    s === "LOW" ||
    s === "INFO" ||
    s === "BANK_STATEMENT" ||
    s === "LEDGER" ||
    s === "INVOICE_REGISTER" ||
    s === "PRIMARY" ||
    s === "SECONDARY" ||
    s === "LEVEL_1" ||
    s === "STATEMENTS_ONLY"
  ) {
    return "blue";
  }

  return "gray";
}

export function StatusPill({
  status,
  rawValue,
  type,
  label,
  variant = "auto",
  size = "sm",
  className = "",
  dot = true,
}: StatusPillProps) {
  const effectiveStatus = status ?? rawValue;
  const chosenVariant: SemanticColor =
    variant === "auto" ? getVariantFromStatus(effectiveStatus) : variant;
  const displayLabel = label || formatEnumLabel(effectiveStatus);

  const variantStyles: Record<SemanticColor, string> = {
    green: "bg-[#E7F5EE] text-[#188A54] border-[#CBE6D8]",
    amber: "bg-[#FCF2E2] text-[#B45309] border-[#F0DDBB]",
    red: "bg-[#FBECEA] text-[#C0362C] border-[#F2CBC8]",
    blue: "bg-[#EEEDFB] text-[#4F46E5] border-[#DCD9F8]",
    gray: "bg-[#F1EFE9] text-[#6E6A61] border-[#E9E6DF]",
  };

  const dotStyles: Record<SemanticColor, string> = {
    green: "bg-[#188A54]",
    amber: "bg-[#B45309]",
    red: "bg-[#C0362C]",
    blue: "bg-[#4F46E5]",
    gray: "bg-[#6E6A61]",
  };

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[10.5px] font-semibold leading-none",
    sm: "px-2.5 py-0.5 text-[11px] font-bold leading-relaxed",
    md: "px-3 py-1 text-xs font-bold",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[chosenVariant]} ${sizeStyles} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles[chosenVariant]}`} />}
      <span className="whitespace-nowrap">{displayLabel}</span>
    </span>
  );
}

export default StatusPill;
