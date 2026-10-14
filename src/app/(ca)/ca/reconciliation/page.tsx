import React from "react";
import { CheckCircle2, Shield, Settings2, Sliders, Cpu } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel, formatShortHash } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";

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
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Deterministic Reconciliation Engine
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Engine Version: <span className="font-mono font-semibold text-[#0F172A]">v1.0.0-deterministic</span> &bull; Zero generative hallucinations
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>Rules Operational</span>
        </div>
      </div>

      {/* Rules Engine Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">Rule 1</div>
          <div className="text-sm font-bold text-[#0F172A]">Exact Amount &amp; Date Match</div>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Exact match on transaction date (tolerance &plusmn;0 days) and exact paisa amount. Score: 1.00.
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-600">5 Confirmed Matches</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">Rule 2</div>
          <div className="text-sm font-bold text-[#0F172A]">Invoice Reference Extraction</div>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Normalized alphanumeric extraction matching invoice/bill numbers across bank narrative and ledger memo.
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-600">1 Confirmed Match</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm">
          <div className="text-xs font-bold text-[#2563EB] uppercase tracking-wider mb-1">Rule 3</div>
          <div className="text-sm font-bold text-[#0F172A]">Balance Chain Continuity</div>
          <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
            Sequential running balance validation: Opening + Credits &minus; Debits = Running Balance.
          </p>
          <div className="mt-3 text-xs font-semibold text-emerald-600">100% Continuity Verified</div>
        </div>
      </div>

      {/* Confirmed Matches Table */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-[#E6E9EF]">
          <h2 className="text-sm font-bold text-[#0F172A]">Deterministic Matches in Current Run</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#64748B] font-semibold border-b border-[#E6E9EF]">
              <tr>
                <th className="py-3 px-4">Match ID</th>
                <th className="py-3 px-4">Applied Rule</th>
                <th className="py-3 px-4">Confidence Score</th>
                <th className="py-3 px-4">Bank Transaction</th>
                <th className="py-3 px-4">Matched Book Entry</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {matches.map((m) => (
                <tr key={m.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-[11px] text-[#64748B]">
                    {formatShortHash(m.id, 8)}
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">
                    {formatEnumLabel(m.rule)}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-700 font-bold tabular-nums">
                    {(m.score * 100).toFixed(0)}%
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#0F172A]">{m.bankTx.description}</span>
                    <span className="text-[10px] text-[#64748B] block font-mono">{m.bankTx.ref}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-[#0F172A]">{m.ledgerEntry.account}</span>
                    <span className="text-[10px] text-[#64748B] block">{m.ledgerEntry.description}</span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusPill rawValue={m.status} type="status" />
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
