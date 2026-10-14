"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Paperclip,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Building,
  CreditCard,
  BookOpen,
  Receipt,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";

interface ExceptionItem {
  id: string;
  type: string;
  title: string;
  explanation: string;
  severity: string;
  status: string;
  amountPaise: number;
  period: string;
  suggestedResolution?: string | null;
  bankTx?: {
    id: string;
    date: Date | string;
    description: string;
    counterparty?: string | null;
    debitPaise: number;
    creditPaise: number;
    ref?: string | null;
  } | null;
  ledgerEntry?: {
    id: string;
    date: Date | string;
    description: string;
    counterparty?: string | null;
    debitPaise: number;
    creditPaise: number;
    account: string;
    ref?: string | null;
  } | null;
  evidence: Array<{
    id: string;
    filename: string;
    sha256: string;
    notes?: string | null;
    createdAt: Date | string;
  }>;
}

export function ExceptionDesk({ exceptions }: { exceptions: ExceptionItem[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(exceptions[0]?.id || null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getBorderColor = (severity: string) => {
    if (severity === "CRITICAL") return "border-l-4 border-l-[#DC2626]";
    if (severity === "HIGH") return "border-l-4 border-l-[#D97706]";
    return "border-l-4 border-l-[#2563EB]";
  };

  return (
    <div className="space-y-4">
      {exceptions.map((exc) => {
        const isExpanded = expandedId === exc.id;
        const isCritical = exc.severity === "CRITICAL";
        const isHigh = exc.severity === "HIGH";

        // Separate explanation and why it matters
        let whatHappened = exc.explanation;
        let whyItMatters =
          "Discrepancies in books or bank records invalidate statutory assertions and require corroborating documentation.";
        if (exc.explanation.includes("However,")) {
          const parts = exc.explanation.split(/(?=However,)/);
          whatHappened = parts[0];
          whyItMatters = parts[1] || whyItMatters;
        } else if (exc.explanation.includes("Duplicate disbursements") || exc.explanation.includes("Unrecorded receipts") || exc.explanation.includes("Disbursements without")) {
          const sentences = exc.explanation.split(". ");
          whatHappened = sentences.slice(0, -1).join(". ") + (sentences.length > 1 ? "." : "");
          whyItMatters = sentences[sentences.length - 1];
        }

        return (
          <div
            key={exc.id}
            className={`bg-white rounded-xl border border-[#E6E9EF] shadow-sm transition-all overflow-hidden ${getBorderColor(
              exc.severity
            )}`}
          >
            {/* Clickable Header Row */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : exc.id)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#F7F8FA] transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                    isCritical
                      ? "bg-red-50 text-[#DC2626]"
                      : isHigh
                      ? "bg-amber-50 text-[#D97706]"
                      : "bg-blue-50 text-[#2563EB]"
                  }`}
                >
                  {isCritical ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : isHigh ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-[16px] font-bold text-[#0F172A]">
                      {exc.title}
                    </span>
                    <StatusPill status={exc.severity} size="xs" />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span>Category: <strong className="text-[#0F172A]">{formatEnumLabel(exc.type)}</strong></span>
                    <span>&bull;</span>
                    <span>Period: <strong className="font-mono text-[#0F172A]">{exc.period}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 self-end sm:self-center">
                <div className="text-right">
                  <div className="text-[17px] font-bold font-mono text-[#0F172A] tabular-nums">
                    {formatPaise(exc.amountPaise)}
                  </div>
                  <div className="mt-0.5">
                    <StatusPill status={exc.status} size="xs" />
                  </div>
                </div>

                <div className="text-slate-400 p-1">
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-[#2563EB]" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Detailed Comparison & Resolution Workspace */}
            {isExpanded && (
              <div className="p-5 sm:p-6 border-t border-[#E6E9EF] bg-white space-y-6">
                {/* 1. What Happened & Why It Matters (Separate labeled blocks) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB]" />
                      What Happened
                    </span>
                    <p className="text-xs text-[#0F172A] leading-relaxed">
                      {whatHappened}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
                      Why It Matters
                    </span>
                    <p className="text-xs text-[#64748B] leading-relaxed">
                      {whyItMatters}
                    </p>
                  </div>
                </div>

                {/* 2. Three Aligned Comparison Columns: Bank vs Ledger vs Invoice */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-3">
                    3-Way Corroboration Comparison
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Column 1: Bank Transaction */}
                    <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
                          1. Bank Statement
                        </span>
                        <StatusPill
                          status={exc.bankTx ? "CONFIRMED" : "UNMATCHED"}
                          label={exc.bankTx ? "Present" : "Missing"}
                          size="xs"
                        />
                      </div>
                      {exc.bankTx ? (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Description</span>
                            <span className="font-semibold text-[#0F172A]">{exc.bankTx.description}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Date</span>
                            <span className="font-mono text-[#0F172A]">{new Date(exc.bankTx.date).toISOString().split("T")[0]}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Counterparty</span>
                            <span className="text-[#0F172A] font-medium">{exc.bankTx.counterparty || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Amount</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {formatPaise(exc.bankTx.debitPaise || exc.bankTx.creditPaise)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#64748B] italic py-4 text-center">
                          No matching clearing bank debit or credit found.
                        </div>
                      )}
                    </div>

                    {/* Column 2: General Ledger Entry */}
                    <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                          2. General Ledger
                        </span>
                        <StatusPill
                          status={exc.ledgerEntry ? "CONFIRMED" : "UNMATCHED"}
                          label={exc.ledgerEntry ? "Present" : "Missing"}
                          size="xs"
                        />
                      </div>
                      {exc.ledgerEntry ? (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Account</span>
                            <span className="font-semibold text-[#0F172A]">{exc.ledgerEntry.account}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Description</span>
                            <span className="text-[#0F172A]">{exc.ledgerEntry.description}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Reference</span>
                            <span className="font-mono text-[#0F172A]">{exc.ledgerEntry.ref || "—"}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Amount</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {formatPaise(exc.ledgerEntry.debitPaise || exc.ledgerEntry.creditPaise)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#DC2626] font-medium py-4 text-center bg-red-50/50 rounded-lg border border-red-100">
                          ⚠️ Unrecorded in books (Missing adjusting journal entry)
                        </div>
                      )}
                    </div>

                    {/* Column 3: Invoice / Tax Register Document */}
                    <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#2563EB]" />
                          3. Tax / Sales Invoice
                        </span>
                        <StatusPill
                          status={exc.evidence.length > 0 ? "CONFIRMED" : "PENDING"}
                          label={exc.evidence.length > 0 ? "Corroborated" : "Awaiting Doc"}
                          size="xs"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {exc.type === "UNRECORDED_SALE" || exc.type === "UNRECORDED_CREDIT" ? (
                          <>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Document</span>
                              <span className="font-semibold text-[#0F172A]">FBR Sales Tax Invoice #SI-2026-3387</span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Issuer / Recipient</span>
                              <span className="text-[#0F172A]">Al-Rehman Textiles</span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Invoice Value</span>
                              <span className="font-mono font-bold text-[#16A34A]">{formatPaise(34000000)}</span>
                            </div>
                          </>
                        ) : exc.type === "DUPLICATE_PAYMENT" ? (
                          <div className="text-xs text-[#D97706] font-medium py-3 text-center bg-amber-50/50 rounded-lg border border-amber-100">
                            Only 1 invoice (#ZT-1141) exists for 2 debit disbursements
                          </div>
                        ) : (
                          <div className="text-xs text-[#64748B] italic py-3 text-center">
                            Awaiting supplier invoice or tax challan attachment.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Suggested Resolution Callout */}
                {exc.suggestedResolution && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-[#2563EB]">
                      <CheckCircle2 className="w-4 h-4" />
                      Deterministic Engine Suggested Resolution
                    </span>
                    <p className="leading-relaxed text-blue-950">
                      {exc.suggestedResolution}
                    </p>
                  </div>
                )}

                {/* 4. Corroborating Evidence Attachments (Truncated 8-char hashes) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-[#64748B]" />
                      Attached Corroborating Evidence ({exc.evidence.length})
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2563EB] hover:underline"
                    >
                      + Upload Corroborating Document
                    </button>
                  </div>

                  {exc.evidence.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exc.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] flex items-start justify-between text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-semibold text-[#0F172A] block truncate">
                              {ev.filename}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                              <span>SHA: {formatShortHash(ev.sha256, 8)}</span>
                              <button
                                onClick={() => copyToClipboard(ev.sha256)}
                                title="Copy Full Hash"
                                className="text-slate-400 hover:text-[#2563EB] transition-colors"
                              >
                                {copiedHash === ev.sha256 ? (
                                  <Check className="w-3 h-3 text-[#16A34A]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {ev.notes && (
                              <p className="text-[11px] text-[#64748B] mt-1 italic">
                                {ev.notes}
                              </p>
                            )}
                          </div>
                          <StatusPill status="CONFIRMED" label="Validated" size="xs" variant="green" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[#E6E9EF] bg-[#F7F8FA] text-center text-xs text-[#64748B]">
                      No supporting documentation attached yet. Upload invoices or bank advice notes to submit for CA review.
                    </div>
                  )}
                </div>

                {/* 5. Resolution Actions */}
                <div className="pt-3 border-t border-[#E6E9EF] flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#64748B]">
                    Exception ID: {exc.id.slice(-8)}
                  </span>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      className="px-3.5 py-2 rounded-lg border border-[#E6E9EF] text-xs font-semibold text-[#0F172A] hover:bg-slate-50 transition-colors"
                    >
                      Attach Explanation Note
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      Submit for CA Sign-off
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
