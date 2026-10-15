import React from "react";
import Link from "next/link";
import {
  Scale,
  FileCheck2,
  Clock,
  ArrowRight,
  GitCommit,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ChevronRight,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash, formatRelativeTime, getOwnerFriendlyException } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { Tag } from "@/components/ui/Tag";
import { CopyButton } from "@/components/ui/CopyButton";
import { PriorityScoreChip } from "@/components/ca/PriorityScoreChip";
import { ExceptionRow } from "@/components/ui/ExceptionRow";

export default async function CAConsoleDashboard() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      companyProfile: true,
      bankAccounts: true,
      bankTransactions: true,
      ledgerEntries: true,
      exceptions: true,
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
  const allExceptions = org?.exceptions || [];

  // Live CA Overview Metrics
  const pendingSubmissions = allExceptions.filter((e) => e.status === "CLIENT_SUBMITTED");
  const resolvedThisMonth = allExceptions.filter((e) => e.status === "RESOLVED");
  const highSeverityOpen = allExceptions.filter(
    (e) =>
      (e.status === "OPEN" || e.status === "CLIENT_SUBMITTED" || e.status === "MORE_INFO_REQUESTED") &&
      (e.severity === "CRITICAL" || e.severity === "HIGH")
  );

  let totalTurnaroundHours = 0;
  let resolvedCount = 0;
  for (const exc of allExceptions) {
    if (exc.resolvedAt && exc.createdAt) {
      const hours =
        (new Date(exc.resolvedAt).getTime() - new Date(exc.createdAt).getTime()) /
        (1000 * 60 * 60);
      totalTurnaroundHours += hours;
      resolvedCount++;
    }
  }
  const avgTurnaroundDisplay =
    resolvedCount > 0 ? `${(totalTurnaroundHours / resolvedCount).toFixed(1)} hrs` : "< 1 day";

  // Active exceptions that require review in prioritized queue
  const activeExceptions = allExceptions.filter(
    (e) => e.status !== "RESOLVED" && e.status !== "WAIVED"
  );

  // Calculate days-waiting and priority score for ranked queue
  const now = new Date();
  const rankedExceptions = activeExceptions
    .map((exc) => {
      const createdDate = new Date(exc.createdAt);
      const diffMs = Math.max(0, now.getTime() - createdDate.getTime());
      const daysWaiting = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) || 3);

      const severityWeights: Record<string, number> = {
        CRITICAL: 40,
        HIGH: 30,
        MEDIUM: 20,
        LOW: 10,
        INFO: 5,
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-[28px] font-extrabold tracking-tight text-[#17161A]">
              Review queue, Ayesha
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEEDFB] text-[#4F46E5] border border-[#DCD9F8]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>Licensed Chartered Accountant (ICAP)</span>
            </span>
          </div>
          <p className="text-xs text-[#6E6A61] mt-1">
            Engagement: <span className="font-semibold text-[#17161A]">{org?.name}</span> &bull; Period: April 2026 &bull; Framework: IFRS for SMEs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/ca/exceptions"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-[#E9E6DF] hover:border-[#D5D0C6] text-[#17161A] text-xs font-semibold transition-all hover:-translate-y-0.5"
          >
            <Scale className="w-4 h-4 text-[#4F46E5]" />
            <span>Exceptions Desk</span>
          </Link>
          <Link
            href="/ca/sign-off"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all hover:-translate-y-0.5"
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Sign-Off Chamber</span>
          </Link>
        </div>
      </div>

      {/* Constitutional Authority Rule Alert */}
      <div className="bg-white/92 backdrop-blur-md border-l-4 border-l-[#4F46E5] border border-[#E9E6DF] rounded-[20px] p-5 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)]">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div className="text-xs">
            <div className="font-bold text-[#17161A] text-sm">
              Constitutional Authority Rule In Effect
            </div>
            <p className="text-[#6E6A61] mt-1 leading-relaxed">
              <em>&ldquo;AI proposes. Deterministic code validates. Authorized humans approve.&rdquo;</em>
              <br />
              As the licensed CA-reviewer, your physical judgment and cryptographic approval are required to issue or revoke certificates. Deterministic algorithms validate data; you judge evidence completeness.
            </p>
          </div>
        </div>
      </div>

      {/* Live Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <Link
          href="/ca/exceptions?filter=CLIENT_SUBMITTED"
          className="bg-white/92 backdrop-blur-md p-5 rounded-[20px] border border-[#E9E6DF] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] flex items-start gap-3.5 hover:border-[#DCD9F8] hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#A8A296] uppercase tracking-wider block">
              Pending Submissions
            </span>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-[#17161A] mt-1 tabular-nums">
              {pendingSubmissions.length}
            </div>
            <div className="text-xs text-[#4F46E5] font-semibold mt-1">
              Awaiting CA review &rarr;
            </div>
          </div>
        </Link>

        {/* Metric 2 */}
        <Link
          href="/ca/exceptions"
          className="bg-white/92 backdrop-blur-md p-5 rounded-[20px] border border-[#E9E6DF] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] flex items-start gap-3.5 hover:border-[#DCD9F8] hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#A8A296] uppercase tracking-wider block">
              Average Turnaround
            </span>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-[#17161A] mt-1 tabular-nums">
              {avgTurnaroundDisplay}
            </div>
            <div className="text-xs text-[#6E6A61] mt-1">Review cycle speed</div>
          </div>
        </Link>

        {/* Metric 3 */}
        <Link
          href="/ca/exceptions?filter=RESOLVED"
          className="bg-white/92 backdrop-blur-md p-5 rounded-[20px] border border-[#E9E6DF] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] flex items-start gap-3.5 hover:border-[#CBE6D8] hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E7F5EE] text-[#188A54] grid place-items-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#A8A296] uppercase tracking-wider block">
              Resolved This Month
            </span>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-[#188A54] mt-1 tabular-nums">
              {resolvedThisMonth.length}
            </div>
            <div className="text-xs text-[#188A54] font-semibold mt-1">Corroborated with evidence</div>
          </div>
        </Link>

        {/* Metric 4 */}
        <Link
          href="/ca/exceptions?filter=HIGH_SEVERITY"
          className="bg-white/92 backdrop-blur-md p-5 rounded-[20px] border border-[#E9E6DF] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] flex items-start gap-3.5 hover:border-[#F0DDBB] hover:-translate-y-0.5 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FCF2E2] text-[#B45309] grid place-items-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs font-semibold text-[#A8A296] uppercase tracking-wider block">
              High-Severity Open
            </span>
            <div className="text-2xl font-extrabold font-mono tracking-tight text-[#B45309] mt-1 tabular-nums">
              {highSeverityOpen.length}
            </div>
            <div className="text-xs text-[#B45309] font-semibold mt-1">Requires immediate review</div>
          </div>
        </Link>
      </div>

      {/* Prioritized Review Queue — styled with ExceptionRow */}
      <div className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] overflow-hidden rise d1">
        <div className="p-5 sm:px-6 border-b border-[#F1EFE9] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#17161A] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#B45309]" />
              <span>Prioritized Review Queue</span>
            </h2>
            <p className="text-xs text-[#6E6A61] mt-0.5">
              Ranked dynamically by severity weight, value at risk, and aging factors. Click to examine workpaper.
            </p>
          </div>
          <Link
            href="/ca/exceptions"
            className="text-xs font-semibold text-[#4F46E5] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Open All Exceptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Queue Rows using ExceptionRow Styling */}
        <div>
          {rankedExceptions.map((exc, idx) => {
            const friendly = getOwnerFriendlyException(exc);

            return (
              <Link
                key={exc.id}
                href={`/ca/exceptions/${exc.id}`}
                className="block hover:bg-[#FCFBF8] transition-colors"
              >
                <ExceptionRow
                  id={exc.id.slice(-5).toUpperCase()}
                  title={friendly.title}
                  description={friendly.description}
                  amountFormatted={formatPaise(exc.amountPaise)}
                  severity={exc.severity}
                  tagText={friendly.tagText}
                  done={exc.status === "RESOLVED"}
                  extraMeta={
                    <>
                      <PriorityScoreChip
                        score={exc.score}
                        severity={exc.severity}
                        amountPaise={exc.amountPaise}
                        daysWaiting={exc.daysWaiting}
                      />
                      <Tag variant="mut" mono>
                        {exc.daysWaiting}d waiting
                      </Tag>
                      <StatusPill status={exc.status} size="xs" />
                    </>
                  }
                />
              </Link>
            );
          })}

          {rankedExceptions.length === 0 && (
            <div className="p-8 text-center text-[#188A54] font-bold text-sm bg-[#E7F5EE]/40">
              ✓ Queue clear — zero exceptions awaiting professional judgment.
            </div>
          )}
        </div>
      </div>

      {/* Audit Hash Chain Preview */}
      <div className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] p-5 sm:p-6 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] space-y-4 rise d2">
        <div className="flex items-center justify-between border-b border-[#F1EFE9] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#17161A] flex items-center gap-2">
              <GitCommit className="w-4 h-4 text-[#4F46E5]" />
              <span>Immutable Audit Hash Chain (Recent Activity)</span>
            </h2>
            <p className="text-xs text-[#6E6A61] mt-0.5">
              Cryptographically chained SHA-256 events recording all state transitions.
            </p>
          </div>
          <Link
            href="/ca/audit-trail"
            className="text-xs text-[#4F46E5] font-semibold hover:underline flex items-center gap-1"
          >
            <span>Inspect full chain</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="space-y-2.5">
          {org?.auditEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3.5 rounded-xl border border-[#F1EFE9] bg-[#FAF9F6] hover:bg-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
                  <GitCommit className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-semibold text-[#17161A]">
                    {formatEnumLabel(evt.action)}
                  </div>
                  <div className="text-[11px] text-[#6E6A61] flex items-center gap-2 mt-0.5">
                    <span>Actor: {evt.actor?.name || "Deterministic Engine"}</span>
                    <span>&bull;</span>
                    <span>{formatRelativeTime(evt.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] text-[#A8A296]">Hash:</span>
                <span className="font-mono text-xs font-semibold text-[#4F46E5] bg-white px-2 py-0.5 rounded-lg border border-[#E9E6DF]">
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
