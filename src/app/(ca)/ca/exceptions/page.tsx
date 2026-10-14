import React from "react";
import Link from "next/link";
import {
  Scale,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Paperclip,
  MessageSquare,
  ArrowRight,
  Filter,
  ArrowLeft,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash, formatRelativeTime } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyButton } from "@/components/ui/CopyButton";

export default async function CAExceptionsReviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string }>;
}) {
  const resolvedParams = searchParams ? await searchParams : {};
  const currentFilter = resolvedParams.filter || "ALL";

  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      exceptions: {
        include: {
          bankTx: true,
          ledgerEntry: true,
          evidence: true,
          comments: {
            include: { author: true },
          },
          reviewNotes: {
            include: { author: true },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const allExceptions = org?.exceptions || [];

  // Filter logic
  const filteredExceptions = allExceptions.filter((exc) => {
    if (currentFilter === "CLIENT_SUBMITTED") {
      return exc.status === "CLIENT_SUBMITTED";
    }
    if (currentFilter === "RESOLVED") {
      return exc.status === "RESOLVED";
    }
    if (currentFilter === "HIGH_SEVERITY") {
      return (
        (exc.status === "OPEN" || exc.status === "CLIENT_SUBMITTED" || exc.status === "MORE_INFO_REQUESTED") &&
        (exc.severity === "CRITICAL" || exc.severity === "HIGH")
      );
    }
    if (currentFilter === "ESCALATED") {
      return exc.isEscalated === true;
    }
    return true; // "ALL"
  });

  const pendingCount = allExceptions.filter((e) => e.status === "CLIENT_SUBMITTED").length;
  const resolvedCount = allExceptions.filter((e) => e.status === "RESOLVED").length;
  const highSevCount = allExceptions.filter(
    (e) =>
      (e.status === "OPEN" || e.status === "CLIENT_SUBMITTED" || e.status === "MORE_INFO_REQUESTED") &&
      (e.severity === "CRITICAL" || e.severity === "HIGH")
  ).length;
  const escalatedCount = allExceptions.filter((e) => e.isEscalated).length;

  const tabs = [
    { id: "ALL", label: "All Items", count: allExceptions.length, href: "/ca/exceptions" },
    { id: "CLIENT_SUBMITTED", label: "Pending Submissions", count: pendingCount, href: "/ca/exceptions?filter=CLIENT_SUBMITTED" },
    { id: "HIGH_SEVERITY", label: "High Severity", count: highSevCount, href: "/ca/exceptions?filter=HIGH_SEVERITY" },
    { id: "RESOLVED", label: "Resolved", count: resolvedCount, href: "/ca/exceptions?filter=RESOLVED" },
    { id: "ESCALATED", label: "Escalated", count: escalatedCount, href: "/ca/exceptions?filter=ESCALATED" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href="/ca"
              className="text-xs text-[#64748B] hover:text-[#0F172A] inline-flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>CA Chamber</span>
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-xs text-[#0F172A] font-semibold">Exceptions Queue</span>
          </div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A] mt-1">
            CA Exception Workpaper Queue
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Examine discrepancy findings, client-submitted evidence packages, and adjudicate final working papers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/ca/sign-off"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            Proceed to Sign-Off
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E6E9EF] pb-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.id;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 shrink-0 ${
                isActive
                  ? "bg-[#0F172A] text-white shadow-sm"
                  : "bg-white text-[#64748B] border border-[#E6E9EF] hover:bg-[#F7F8FA] hover:text-[#0F172A]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? "bg-white/20 text-white" : "bg-gray-100 text-[#64748B]"
                }`}
              >
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Exceptions List */}
      {filteredExceptions.length === 0 ? (
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-12 text-center shadow-sm space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
          <h3 className="text-base font-bold text-[#0F172A]">No items match this filter</h3>
          <p className="text-xs text-[#64748B] max-w-sm mx-auto">
            All exceptions under this view have been adjudicated or none currently qualify.
          </p>
          <Link
            href="/ca/exceptions"
            className="inline-block mt-2 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            View all exceptions &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredExceptions.map((exc) => {
            const borderColor =
              exc.severity === "CRITICAL"
                ? "border-l-red-500"
                : exc.severity === "HIGH"
                ? "border-l-amber-500"
                : exc.severity === "MEDIUM"
                ? "border-l-blue-500"
                : "border-l-slate-400";

            return (
              <div
                key={exc.id}
                className={`bg-white border border-[#E6E9EF] border-l-4 ${borderColor} rounded-xl overflow-hidden shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E9EF] pb-3">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <StatusPill rawValue={exc.severity} type="severity" />
                    <span className="text-base font-bold text-[#0F172A]">{exc.title}</span>
                    <span className="text-xs text-[#64748B] font-mono">
                      ({formatEnumLabel(exc.type)})
                    </span>
                    {exc.isEscalated && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                        <ShieldAlert className="w-3 h-3" />
                        ESCALATED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill rawValue={exc.status} type="status" />
                    <div className="font-mono text-base font-bold text-[#0F172A] tabular-nums">
                      {formatPaise(exc.amountPaise)}
                    </div>
                  </div>
                </div>

                {/* Explanation & Impact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#F7F8FA] p-3.5 rounded-xl border border-[#E6E9EF] space-y-1">
                    <span className="font-semibold text-[#0F172A] block uppercase text-[10px] tracking-wider">
                      Discrepancy Findings
                    </span>
                    <p className="text-[#64748B] leading-relaxed">{exc.explanation}</p>
                  </div>

                  <div className="bg-[#F7F8FA] p-3.5 rounded-xl border border-[#E6E9EF] space-y-1">
                    <span className="font-semibold text-[#0F172A] block uppercase text-[10px] tracking-wider">
                      Audit Resolution Standard
                    </span>
                    <p className="text-[#64748B] leading-relaxed">{exc.suggestedResolution}</p>
                  </div>
                </div>

                {/* Client Resolution Preview if submitted */}
                {exc.status === "CLIENT_SUBMITTED" && exc.resolutionNotes && (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-900 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                        Client Submission Package Awaiting Adjudication
                      </span>
                      {exc.resolutionType && (
                        <span className="text-[11px] font-semibold text-[#2563EB] bg-white px-2 py-0.5 rounded border border-blue-200">
                          {formatEnumLabel(exc.resolutionType)}
                        </span>
                      )}
                    </div>
                    <p className="text-blue-950 font-medium italic">
                      &ldquo;{exc.resolutionNotes}&rdquo;
                    </p>
                  </div>
                )}

                {/* Evidence Summary & Action */}
                <div className="pt-2 border-t border-[#E6E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-[#64748B]">
                    <span className="flex items-center gap-1 font-medium">
                      <Paperclip className="w-3.5 h-3.5" />
                      {exc.evidence.length} {exc.evidence.length === 1 ? "evidence file" : "evidence files"}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1 font-medium">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {exc.comments.length} dialogue {exc.comments.length === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  <Link
                    href={`/ca/exceptions/${exc.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                  >
                    <span>Open Full Workpaper</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
