import React from "react";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

export default async function LedgerPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      ledgerEntries: {
        orderBy: { date: "asc" },
      },
    },
  });

  const entries = org?.ledgerEntries || [];
  const totalDebits = entries.reduce((s, e) => s + e.debitPaise, 0);
  const totalCredits = entries.reduce((s, e) => s + e.creditPaise, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            General Ledger Entries
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Accounting books extracted from General_Ledger_April_2026.xlsx &bull; 7 Recorded Book Entries
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
          <BookOpen className="w-4 h-4" />
          <span>7 Book Entries Recorded</span>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-[#64748B]">Total Book Debits</span>
          <div className="text-lg font-bold font-mono text-[#0F172A] mt-1 tabular-nums">{formatPaise(totalDebits)}</div>
        </div>
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-[#64748B]">Total Book Credits</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1 tabular-nums">{formatPaise(totalCredits)}</div>
        </div>
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 shadow-sm">
          <span className="text-xs text-[#64748B]">Books Discrepancy Note</span>
          <div className="text-xs font-semibold text-amber-700 mt-1">
            Missing entry for 12 Apr deposit (PKR 340,000.00)
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#64748B] font-semibold border-b border-[#E6E9EF]">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account / Description</th>
                <th className="py-3 px-4">Counterparty / Ref</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {entries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[#64748B]">#{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-[#64748B] whitespace-nowrap">
                    {entry.date.toISOString().split("T")[0]}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0F172A]">{entry.account}</div>
                    <div className="text-[11px] text-[#64748B]">{entry.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#64748B]">
                    <div>{entry.counterparty || "—"}</div>
                    <div className="text-[10px] text-[#64748B]">{entry.ref || "No ref"}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-[#0F172A] tabular-nums">
                    {entry.debitPaise > 0 ? formatPaise(entry.debitPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700 tabular-nums">
                    {entry.creditPaise > 0 ? formatPaise(entry.creditPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Recorded
                    </span>
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
