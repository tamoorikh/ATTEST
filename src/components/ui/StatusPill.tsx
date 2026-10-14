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
    s === "LEVEL_2"
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
    s === "ERROR"
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
    s === "EXCEPTION"
  ) {
    return "amber";
  }

  // Blue / Info
  if (
    s === "MEDIUM" ||
    s === "LOW" ||
    s === "BANK_STATEMENT" ||
    s === "LEDGER" ||
    s === "INVOICE_REGISTER" ||
    s === "PRIMARY" ||
    s === "SECONDARY"
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
    green: "bg-emerald-50 text-[#16A34A] border-emerald-200/70",
    amber: "bg-amber-50 text-[#D97706] border-amber-200/70",
    red: "bg-red-50 text-[#DC2626] border-red-200/70",
    blue: "bg-blue-50 text-[#2563EB] border-blue-200/70",
    gray: "bg-slate-100 text-[#64748B] border-slate-200",
  };

  const dotStyles: Record<SemanticColor, string> = {
    green: "bg-[#16A34A]",
    amber: "bg-[#D97706]",
    red: "bg-[#DC2626]",
    blue: "bg-[#2563EB]",
    gray: "bg-[#64748B]",
  };

  const sizeStyles = {
    xs: "px-2 py-0.5 text-[10.5px] font-medium leading-none",
    sm: "px-2.5 py-0.5 text-xs font-semibold leading-relaxed",
    md: "px-3 py-1 text-[13px] font-semibold",
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
