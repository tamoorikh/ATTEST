import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ReceiptText,
  FileCheck2,
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Award,
  AlertOctagon,
  Clock,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { VerificationTrigger } from "./verification-trigger";

export default async function PortalDashboardPage() {
  // Retrieve demo organization details and metrics
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      bankAccounts: true,
      bankTransactions: {
        orderBy: { date: "asc" },
      },
      exceptions: {
        orderBy: { severity: "asc" },
      },
      certificates: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      processingRuns: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const transactions = org?.bankTransactions || [];
  const allExceptions = org?.exceptions || [];
  const openExceptions = allExceptions.filter((e) => e.status === "OPEN");
  const certificate = org?.certificates[0];
  const matchedCount = transactions.filter((t) => t.matchStatus === "MATCHED").length;
  const matchRate = transactions.length > 0 ? Math.round((matchedCount / transactions.length) * 100) : 0;
  const latestBalance = transactions[transactions.length - 1]?.runningBalancePaise ?? 80000000;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A] leading-tight">
            Assurance Overview
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Continuous reconciliation for <span className="font-semibold text-[#0F172A]">April 2026</span> &bull; Deterministic verification rule set active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/exceptions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Resolve {openExceptions.length} Exceptions</span>
          </Link>
          <Link
            href="/portal/certificate"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E6E9EF] hover:bg-slate-50 text-xs font-semibold text-[#0F172A] shadow-sm transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Certificate Preview</span>
          </Link>
        </div>
      </div>

      {/* Hero Row: 4 Redesigned Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Verified Closing Balance */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Verified Closing Balance
            </span>
            <div className="text-[30px] font-bold font-mono tracking-tight text-[#0F172A] tabular-nums mt-1 truncate leading-none">
              {formatPaise(latestBalance)}
            </div>
            <div className="text-[11.5px] text-[#64748B] mt-2 flex items-center gap-1">
              <span>Opening:</span>
              <span className="font-mono text-[#0F172A] font-semibold">{formatPaise(80000000)}</span>
              <span className="text-[#16A34A] font-bold">✓</span>
            </div>
          </div>
        </div>

        {/* Card 2: Deterministic Match Rate */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center shrink-0">
            <ReceiptText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Reconciliation Rate
            </span>
            <div className="text-[30px] font-bold font-mono tracking-tight text-[#0F172A] tabular-nums mt-1 leading-none">
              {matchRate}%
            </div>
            <div className="text-[11.5px] text-[#64748B] mt-2">
              <span className="font-semibold text-[#0F172A]">{matchedCount} of {transactions.length}</span> matched
            </div>
          </div>
        </div>

        {/* Card 3: Actionable Exceptions */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-[#D97706] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Open Exceptions
            </span>
            <div className="text-[30px] font-bold font-mono tracking-tight text-[#D97706] tabular-nums mt-1 leading-none">
              {openExceptions.length}
            </div>
            <div className="text-[11.5px] text-[#D97706] font-medium mt-2">
              Requires client corroboration
            </div>
          </div>
        </div>

        {/* Card 4: Verification Level */}
        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider block">
              Assurance Level
            </span>
            <div className="text-[26px] font-bold tracking-tight text-[#0F172A] mt-1 leading-none truncate">
              Level 1
            </div>
            <div className="text-[11.5px] text-[#64748B] mt-2">
              Eligible for <strong className="text-[#2563EB]">Level 3</strong> with invoices
            </div>
          </div>
        </div>
      </div>

      {/* Verification Trigger Card (With 6-Stage Pipeline Animation) */}
      <VerificationTrigger />

      {/* Redesigned Exceptions Block: Clean Single Card with Row List Items */}
      {openExceptions.length > 0 && (
        <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 sm:px-6 border-b border-[#E6E9EF] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Actionable Exceptions Requiring Resolution
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                The deterministic engine detected financial variances between bank records and books. Click an item to provide corroborating evidence.
              </p>
            </div>
            <Link
              href="/portal/exceptions"
              className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1 shrink-0"
            >
              <span>View Resolution Desk</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="divide-y divide-[#E6E9EF]">
            {openExceptions.map((exc) => {
              const isCritical = exc.severity === "CRITICAL";
              const isHigh = exc.severity === "HIGH";

              return (
                <Link
                  key={exc.id}
                  href={`/portal/exceptions`}
                  className="p-4 sm:px-6 flex items-start sm:items-center justify-between gap-4 hover:bg-[#F7F8FA] transition-colors group cursor-pointer"
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
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[15px] font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                          {exc.title}
                        </span>
                        <StatusPill status={exc.severity} size="xs" />
                      </div>
                      <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {exc.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 pl-2">
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-[#0F172A] tabular-nums">
                        {formatPaise(exc.amountPaise)}
                      </div>
                      <div className="mt-0.5">
                        <StatusPill status={exc.status} size="xs" />
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bank Statement Reconciliation Preview */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:px-6 border-b border-[#E6E9EF] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A]">
              Bank Statement Reconciliation Preview
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Habib Bank Limited &bull; Account #00427901842003 &bull; Period 2026-04
            </p>
          </div>
          <Link
            href="/portal/transactions"
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>View all transactions</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#64748B] font-semibold border-b border-[#E6E9EF]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Counterparty / Ref</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono text-[#64748B] whitespace-nowrap">
                    {tx.date.toISOString().split("T")[0]}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#0F172A]">
                    {tx.description}
                  </td>
                  <td className="py-3 px-4 text-[#64748B] font-mono text-[11px]">
                    {tx.counterparty || "—"} {tx.ref && `(${tx.ref})`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-[#0F172A]">
                    {tx.debitPaise > 0 ? formatPaise(tx.debitPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-[#16A34A]">
                    {tx.creditPaise > 0 ? formatPaise(tx.creditPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0F172A]">
                    {formatPaise(tx.runningBalancePaise)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusPill status={tx.matchStatus} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
