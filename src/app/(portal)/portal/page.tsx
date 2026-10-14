import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  AlertTriangle,
  ReceiptText,
  FileCheck2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

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
        where: { status: "OPEN" },
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
  const exceptions = org?.exceptions || [];
  const certificate = org?.certificates[0];
  const totalVolume = transactions.reduce((acc, tx) => acc + tx.debitPaise + tx.creditPaise, 0);
  const matchedCount = transactions.filter((t) => t.matchStatus === "MATCHED").length;
  const matchRate = transactions.length > 0 ? Math.round((matchedCount / transactions.length) * 100) : 0;
  const latestBalance = transactions[transactions.length - 1]?.runningBalancePaise ?? 80000000;

  return (
    <div className="space-y-8">
      {/* Page Title & Status Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1220]">Assurance Overview</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Engine Active
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Continuous reconciliation for period <span className="font-semibold text-gray-700">April 2026</span> &bull; Deterministic verification rule set active
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal/exceptions"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Resolve 2 Exceptions
          </Link>
          <Link
            href="/portal/certificate"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 text-xs font-medium text-gray-700 shadow-sm transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-[#2456E6]" />
            View Certificate Preview
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Verified Balance */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Verified Closing Balance</span>
            <TrendingUp className="w-4 h-4 text-[#2456E6]" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[#0B1220]">
              {formatPaise(latestBalance)}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
              <span>Opening:</span>
              <span className="font-mono">{formatPaise(80000000)}</span>
              <span className="text-emerald-600 font-semibold">(Verified ✓)</span>
            </div>
          </div>
        </div>

        {/* Reconciliation Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Deterministic Match Rate</span>
            <ReceiptText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-[#0B1220]">
              {matchRate}%
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              {matchedCount} of {transactions.length} transactions matched
            </div>
          </div>
        </div>

        {/* Exceptions Pending Resolution */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Actionable Exceptions</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-amber-600">
              {exceptions.length}
            </div>
            <div className="text-[11px] text-amber-700 font-medium mt-1">
              Requires client evidence / explanation
            </div>
          </div>
        </div>

        {/* Assurance Certificate Status */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
            <span>Assurance Status</span>
            <FileCheck2 className="w-4 h-4 text-[#2456E6]" />
          </div>
          <div className="mt-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              {certificate?.status || "PENDING_REVIEW"}
            </span>
            <div className="text-[11px] text-gray-500 mt-2 font-mono truncate">
              ID: {certificate?.publicId}
            </div>
          </div>
        </div>
      </div>

      {/* Exceptions Alert Box */}
      {exceptions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-900">
                  {exceptions.length} Financial Exceptions Require Your Resolution
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  The deterministic engine identified discrepancies between the uploaded HBL bank statement and the general ledger. A licensed CA cannot issue the signed Trust Certificate until these items are addressed.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="bg-white/90 border border-amber-300 rounded-lg px-3 py-1.5 text-xs text-amber-900 flex items-center gap-2"
                    >
                      <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        {exc.type}
                      </span>
                      <span className="font-medium truncate max-w-xs">{exc.title}</span>
                      <span className="font-mono font-semibold">{formatPaise(exc.amountPaise)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <Link
              href="/portal/exceptions"
              className="text-xs font-semibold text-amber-900 hover:text-black flex items-center gap-1 shrink-0 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              Resolve Desk <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Bank Transactions Table Preview */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:px-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0B1220]">Bank Statement Reconciliation Preview</h2>
            <p className="text-xs text-gray-500">
              Habib Bank Limited &bull; Account #00427901842003 &bull; April 2026
            </p>
          </div>
          <Link
            href="/portal/transactions"
            className="text-xs font-semibold text-[#2456E6] hover:underline flex items-center gap-1"
          >
            View all 8 transactions <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Description</th>
                <th className="py-2.5 px-4">Counterparty / Ref</th>
                <th className="py-2.5 px-4 text-right">Debit</th>
                <th className="py-2.5 px-4 text-right">Credit</th>
                <th className="py-2.5 px-4 text-right">Running Balance</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-2.5 px-4 font-mono text-gray-600 whitespace-nowrap">
                    {tx.date.toISOString().split("T")[0]}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-[#0B1220]">
                    {tx.description}
                  </td>
                  <td className="py-2.5 px-4 text-gray-500 font-mono text-[11px]">
                    {tx.counterparty || "—"} {tx.ref && `(${tx.ref})`}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium text-gray-900">
                    {tx.debitPaise > 0 ? formatPaise(tx.debitPaise) : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-medium text-emerald-700">
                    {tx.creditPaise > 0 ? formatPaise(tx.creditPaise) : "—"}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-[#0B1220]">
                    {formatPaise(tx.runningBalancePaise)}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {tx.matchStatus === "MATCHED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Matched
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        Exception
                      </span>
                    )}
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
