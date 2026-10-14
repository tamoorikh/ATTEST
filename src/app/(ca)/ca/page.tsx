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
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

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
      },
    },
  });

  const cert = org?.certificates[0];
  const exceptions = org?.exceptions || [];
  const bankTxs = org?.bankTransactions || [];
  const ledgerEntries = org?.ledgerEntries || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0B1220]">
              CA Assurance & Review Chamber
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#2456E6] border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              Chartered Accountant License Verified
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Engagement: <span className="font-semibold text-gray-800">{org?.name}</span> &bull; Period: April 2026
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ca/exceptions"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium shadow-sm transition-colors"
          >
            <Scale className="w-4 h-4" />
            Review 2 Exceptions
          </Link>
          <Link
            href="/ca/sign-off"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#0B1220] hover:bg-black text-white text-xs font-medium shadow-sm transition-colors"
          >
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
            Sign-Off Chamber
          </Link>
        </div>
      </div>

      {/* Authority Rule Alert */}
      <div className="bg-white border-l-4 border-l-[#2456E6] border border-gray-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-[#2456E6] mt-0.5 shrink-0" />
          <div className="text-xs">
            <div className="font-bold text-[#0B1220] text-sm">
              Constitutional Authority Rule In Effect
            </div>
            <p className="text-gray-600 mt-1">
              <em>&ldquo;AI proposes. Deterministic code validates. Authorized humans approve.&rdquo;</em>
              <br />
              As the licensed CA-reviewer, your physical approval and cryptographic key are required to transition Certificate <strong>{cert?.publicId}</strong> from PENDING_REVIEW to ISSUED.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Engagement Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Reconciled Bank Volume</span>
          <div className="text-xl font-bold font-mono text-[#0B1220] mt-2">
            {formatPaise(16365000)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">8 Transactions Verified</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Recorded Book Volume</span>
          <div className="text-xl font-bold font-mono text-[#0B1220] mt-2">
            {formatPaise(21570000)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">7 Ledger Entries Verified</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Pending Exceptions</span>
          <div className="text-xl font-bold font-mono text-amber-600 mt-2">
            {exceptions.length} Discrepancies
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">E-101 & E-102 unapproved</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs text-gray-500 font-medium">Issuance Readiness</span>
          <div className="text-xl font-bold font-mono text-[#D97706] mt-2">
            BLOCKED
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Requires CA review of exceptions</div>
        </div>
      </div>

      {/* Two Column Layout: Exceptions + Audit Trail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exceptions Column */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#0B1220] flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-amber-600" />
              Exceptions Awaiting CA Review
            </h2>
            <Link href="/ca/exceptions" className="text-xs text-[#2456E6] font-semibold hover:underline">
              Review all &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {exceptions.map((exc) => (
              <div key={exc.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/70 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0B1220]">{exc.title}</span>
                  <span className="font-mono font-bold text-gray-900">{formatPaise(exc.amountPaise)}</span>
                </div>
                <p className="text-gray-600 text-[11px] line-clamp-2">{exc.explanation}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] font-mono uppercase bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600">
                    {exc.type}
                  </span>
                  <Link
                    href={`/ca/exceptions`}
                    className="text-[#2456E6] text-[11px] font-semibold hover:underline"
                  >
                    Examine Evidence &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Hash Chain Preview */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-sm font-bold text-[#0B1220] flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-[#2456E6]" />
              Immutable Audit Hash Chain
            </h2>
            <Link href="/ca/audit-trail" className="text-xs text-[#2456E6] font-semibold hover:underline">
              Inspect full chain &rarr;
            </Link>
          </div>

          <div className="space-y-3">
            {org?.auditEvents.map((evt) => (
              <div key={evt.id} className="p-2.5 rounded-lg border border-gray-100 bg-[#FAF9F7] text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-gray-800">{evt.action}</span>
                  <span className="text-[10px] font-mono text-gray-400">
                    {evt.createdAt.toISOString().replace("T", " ").substring(0, 16)}
                  </span>
                </div>
                <div className="font-mono text-[10px] text-gray-500 mt-1 truncate">
                  Hash: <span className="text-[#2456E6]">{evt.hash}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
