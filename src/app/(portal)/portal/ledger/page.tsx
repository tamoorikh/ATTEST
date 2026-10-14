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
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            General Ledger Entries
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Accounting books extracted from General_Ledger_April_2026.xlsx &bull; 7 Recorded Book Entries
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-900">
          <BookOpen className="w-4 h-4 text-[#2456E6]" />
          <span>7 Book Entries Recorded</span>
        </div>
      </div>

      {/* Summary totals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-500">Total Book Debits</span>
          <div className="text-lg font-bold font-mono text-gray-900 mt-1">{formatPaise(totalDebits)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-500">Total Book Credits</span>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1">{formatPaise(totalCredits)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <span className="text-xs text-gray-500">Books Discrepancy Note</span>
          <div className="text-xs font-medium text-amber-700 mt-1">
            Missing entry for 12 Apr deposit (PKR 34,000.00)
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Account / Description</th>
                <th className="py-3 px-4">Counterparty / Ref</th>
                <th className="py-3 px-4 text-right">Debit (Paisa)</th>
                <th className="py-3 px-4 text-right">Credit (Paisa)</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((entry, idx) => (
                <tr key={entry.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4 font-mono text-gray-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                    {entry.date.toISOString().split("T")[0]}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0B1220]">{entry.account}</div>
                    <div className="text-[11px] text-gray-500">{entry.description}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    <div>{entry.counterparty || "—"}</div>
                    <div className="text-[10px] text-gray-400">{entry.ref || "No ref"}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">
                    {entry.debitPaise > 0 ? formatPaise(entry.debitPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                    {entry.creditPaise > 0 ? formatPaise(entry.creditPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
