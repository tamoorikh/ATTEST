import React from "react";
import { CheckCircle2, Shield, Settings2, Sliders, Cpu } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function ReconciliationEnginePage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      matches: {
        include: {
          bankTx: true,
          ledgerEntry: true,
        },
      },
    },
  });

  const matches = org?.matches || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            Deterministic Reconciliation Engine
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Engine Version: <span className="font-mono font-semibold text-gray-800">v1.0.0-deterministic</span> &bull; Zero generative hallucinations
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>Rules Operational</span>
        </div>
      </div>

      {/* Rules Engine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1">Rule 1</div>
          <div className="text-sm font-bold text-gray-900">EXACT_AMOUNT_DATE</div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Exact match on transaction date (tolerance &plusmn;0 days) and exact paisa amount. Score: 1.00.
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-600">5 Confirmed Matches</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1">Rule 2</div>
          <div className="text-sm font-bold text-gray-900">INVOICE_REF_MATCH</div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Normalized string extraction of invoice/bill numbers across bank payment narrative and ledger memo.
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-600">1 Confirmed Match</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1">Rule 3</div>
          <div className="text-sm font-bold text-gray-900">BALANCE_CONTINUITY</div>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">
            Step-by-step sequential running balance validation: Opening + Credits - Debits = Current.
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-600">100% Continuity Verified</div>
        </div>
      </div>

      {/* Confirmed Matches Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-sm font-bold text-[#0B1220]">Deterministic Matches in Current Run</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Match ID</th>
                <th className="py-3 px-4">Applied Rule</th>
                <th className="py-3 px-4">Confidence Score</th>
                <th className="py-3 px-4">Bank Transaction</th>
                <th className="py-3 px-4">Matched Book Entry</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-400">{m.id.substring(0, 10)}...</td>
                  <td className="py-3 px-4 font-mono font-semibold text-[#0B1220]">{m.rule}</td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold">{(m.score * 100).toFixed(0)}%</td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-800">{m.bankTx.description}</span>
                    <span className="text-[10px] text-gray-400 block font-mono">{m.bankTx.ref}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-800">{m.ledgerEntry.account}</span>
                    <span className="text-[10px] text-gray-400 block">{m.ledgerEntry.description}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {m.status}
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
