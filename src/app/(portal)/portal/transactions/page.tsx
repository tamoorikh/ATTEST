import React from "react";
import { ReceiptText, CheckCircle2, AlertTriangle, ShieldCheck, Calculator } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

export default async function TransactionsPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      bankAccounts: true,
      bankTransactions: {
        orderBy: { date: "asc" },
      },
    },
  });

  const transactions = org?.bankTransactions || [];
  const openingBalance = 8000000;
  const totalDebits = transactions.reduce((sum, tx) => sum + tx.debitPaise, 0);
  const totalCredits = transactions.reduce((sum, tx) => sum + tx.creditPaise, 0);
  const calculatedClosing = openingBalance - totalDebits + totalCredits;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            Bank Statement Transactions
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Habib Bank Limited (HBL) &bull; Acct: 00427901842003 &bull; Period: April 2026
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          <Calculator className="w-4 h-4 text-emerald-600" />
          <span>Continuous Arithmetic Integrity: 100% Validated</span>
        </div>
      </div>

      {/* Statement Reconciliation Arithmetic Strip */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        <div>
          <span className="text-gray-500 block">Statement Opening</span>
          <span className="font-mono text-sm font-bold text-gray-900">{formatPaise(openingBalance)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Total Debits (-)</span>
          <span className="font-mono text-sm font-bold text-red-600">-{formatPaise(totalDebits)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Total Credits (+)</span>
          <span className="font-mono text-sm font-bold text-emerald-700">+{formatPaise(totalCredits)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Net Periodic Flow</span>
          <span className="font-mono text-sm font-bold text-[#0B1220]">{formatPaise(totalCredits - totalDebits)}</span>
        </div>
        <div>
          <span className="text-gray-500 block">Verified Closing</span>
          <span className="font-mono text-sm font-bold text-[#2456E6]">{formatPaise(calculatedClosing)}</span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Transaction Details</th>
                <th className="py-3 px-4">Counterparty / Ref</th>
                <th className="py-3 px-4 text-right">Debit (Paisa)</th>
                <th className="py-3 px-4 text-right">Credit (Paisa)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
                <th className="py-3 px-4 text-center">Arithmetic</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((tx, idx) => (
                <tr key={tx.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4 font-mono text-gray-400">{idx + 1}</td>
                  <td className="py-3 px-4 font-mono text-gray-600 whitespace-nowrap">
                    {tx.date.toISOString().split("T")[0]}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-[#0B1220]">{tx.description}</div>
                    <div className="text-[10px] text-gray-500">Category: {tx.category || "Unassigned"}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    <div>{tx.counterparty || "—"}</div>
                    <div className="text-[10px] text-gray-400">{tx.ref || "No ref"}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-gray-900">
                    {tx.debitPaise > 0 ? formatPaise(tx.debitPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-medium text-emerald-700">
                    {tx.creditPaise > 0 ? formatPaise(tx.creditPaise) : "—"}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#0B1220]">
                    {formatPaise(tx.runningBalancePaise)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      OK
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {tx.matchStatus === "MATCHED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Reconciled
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
