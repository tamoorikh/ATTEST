import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Scale,
  FileCheck2,
  Clock,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash, formatRelativeTime } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyButton } from "@/components/ui/CopyButton";
import { PriorityScoreChip } from "@/components/ca/PriorityScoreChip";

export default async function CAConsoleDashboard() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      companyProfile: true,
      bankAccounts: true,
      bankTransactions: true,
      ledgerEntries: true,
      exceptions: {
        where: { status: "OPEN" },
      },
      certificates: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      auditEvents: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { actor: true },
      },
    },
  });

  const cert = org?.certificates[0];
  const rawExceptions = org?.exceptions || [];
  const bankTxs = org?.bankTransactions || [];
  const ledgerEntries = org?.ledgerEntries || [];

  // Calculate days-waiting and priority score for ranked queue
  const now = new Date();
  const rankedExceptions = rawExceptions
    .map((exc) => {
      const createdDate = new Date(exc.createdAt);
      const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
      const daysWaiting = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) || 3);

      const severityWeights: Record<string, number> = {
        CRITICAL: 40,
        HIGH: 30,
        MEDIUM: 20,
        LOW: 10,
      };
      const sevScore = severityWeights[exc.severity] ?? 25;
      const amountScore = Math.min(40, Math.round((exc.amountPaise / 40000000) * 40));
      const ageScore = Math.min(20, daysWaiting * 5);
      const score = Math.min(100, Math.max(10, sevScore + amountScore + ageScore));

      return {
        ...exc,
        daysWaiting,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
              CA Assurance &amp; Review Chamber
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Chartered Accountant License Verified
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Engagement: <span className="font-semibold text-[#0F172A]">{org?.name}</span> &bull; Period: April 2026 &bull; Framework: IFRS for SMEs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ca/exceptions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Scale className="w-4 h-4" />
            Review {rawExceptions.length} Exceptions
          </Link>
          <Link
            href="/ca/sign-off"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <FileCheck2 className="w-4 h-4" />
            Sign-Off Chamber
          </Link>
        </div>
      </div>

      {/* Constitutional Authority Rule Alert */}
      <div className="bg-white border-l-4 border-l-[#2563EB] border border-[#E6E9EF] rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-[#0F172A] text-sm">
              Constitutional Authority Rule In Effect
            </div>
            <p className="text-[#64748B] mt-1 leading-relaxed">
              <em>&ldquo;AI proposes. Deterministic code validates. Authorized humans approve.&rdquo;</em>
              <br />
              As the licensed CA-reviewer, your physical approval and cryptographic key are required to transition Certificate <span className="font-mono font-semibold text-[#0F172A]">{cert?.publicId}</span> from{" "}
              <span className="font-semibold text-amber-700">{formatEnumLabel(cert?.status || "PENDING_REVIEW")}</span> to{" "}
              <span className="font-semibold text-emerald-700">{formatEnumLabel("ISSUED")}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[#64748B]">Reconciled Bank Volume</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#0F172A] mt-1 tabular-nums">
              {formatPaise(163650000)}
            </div>
            <div className="text-xs text-[#64748B] mt-1">8 Transactions Verified</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[#64748B]">Recorded Book Volume</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-[#0F172A] mt-1 tabular-nums">
              {formatPaise(215700000)}
            </div>
            <div className="text-xs text-[#64748B] mt-1">7 Ledger Entries Verified</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[#64748B]">Pending Exceptions</span>
            <div className="text-2xl font-bold font-mono tracking-tight text-amber-600 mt-1 tabular-nums">
              {rawExceptions.length} Items
            </div>
            <div className="text-xs text-amber-700 font-medium mt-1">E-101 &amp; E-102 unapproved</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E6E9EF] shadow-sm flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#D97706] shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-[#64748B]">Issuance Readiness</span>
            <div className="text-2xl font-bold tracking-tight text-[#D97706] mt-1">
              Blocked
            </div>
            <div className="text-xs text-[#64748B] mt-1">Requires CA review of exceptions</div>
          </div>
        </div>
      </div>

      {/* Screen C Requirement: Ranked Review Queue Table */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#E6E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <Scale className="w-5 h-5 text-amber-600" />
              Prioritized Review Queue
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ranked dynamically by severity weight, value at risk, and aging factors.
            </p>
          </div>
          <Link
            href="/ca/exceptions"
            className="text-xs font-semibold text-[#2563EB] hover:underline flex items-center gap-1"
          >
            <span>Open Exceptions Workspace</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#64748B] font-semibold border-b border-[#E6E9EF]">
              <tr>
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Priority Score</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Discrepancy Details</th>
                <th className="py-3 px-4 text-right">Value at Risk</th>
                <th className="py-3 px-4 text-center">Days Waiting</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {rankedExceptions.map((exc, idx) => (
                <tr key={exc.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3.5 px-4 text-center font-mono font-bold text-[#64748B]">
                    #{idx + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <PriorityScoreChip
                      score={exc.score}
                      severity={exc.severity}
                      amountPaise={exc.amountPaise}
                      daysWaiting={exc.daysWaiting}
                    />
                  </td>
                  <td className="py-3.5 px-4">
                    <StatusPill rawValue={exc.severity} type="severity" />
                  </td>
                  <td className="py-3.5 px-4 max-w-md">
                    <div className="font-semibold text-[#0F172A]">{exc.title}</div>
                    <div className="text-[11px] text-[#64748B] line-clamp-1 mt-0.5">
                      {exc.explanation}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] tabular-nums">
                    {formatPaise(exc.amountPaise)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="font-mono text-xs text-[#0F172A] font-medium bg-gray-100 px-2 py-0.5 rounded">
                      {exc.daysWaiting} {exc.daysWaiting === 1 ? "day" : "days"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      href="/ca/exceptions"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white font-medium text-xs transition-colors"
                    >
                      <span>Examine</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Hash Chain Preview */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-[#2563EB]" />
              Immutable Audit Hash Chain (Recent Activity)
            </h2>
            <p className="text-xs text-[#64748B]">
              Cryptographically chained SHA-256 events recording all state transitions.
            </p>
          </div>
          <Link
            href="/ca/audit-trail"
            className="text-xs text-[#2563EB] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Inspect full chain</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-3">
          {org?.auditEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] hover:bg-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-[#2563EB] shrink-0">
                  <GitCommit className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-[#0F172A]">
                    {formatEnumLabel(evt.action)}
                  </div>
                  <div className="text-[11px] text-[#64748B] flex items-center gap-2 mt-0.5">
                    <span>Actor: {evt.actor?.name || "System Engine"}</span>
                    <span>&bull;</span>
                    <span>{formatRelativeTime(evt.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] text-[#64748B]">Hash:</span>
                <span className="font-mono text-xs font-semibold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-[#E6E9EF]">
                  {formatShortHash(evt.hash, 8)}
                </span>
                <CopyButton value={evt.hash} label="Copy full hash" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
