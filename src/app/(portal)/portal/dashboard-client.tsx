"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { VerdictCard } from "@/components/ui/VerdictCard";
import { SummaryStrip } from "@/components/ui/SummaryStrip";
import { ExceptionRow } from "@/components/ui/ExceptionRow";
import { TimelineSteps } from "@/components/ui/TimelineSteps";
import { Tag } from "@/components/ui/Tag";
import { formatPaise } from "@/lib/money";
import { getOwnerFriendlyException, formatRelativeTime } from "@/lib/labels";
import { VerificationTrigger } from "./verification-trigger";

interface ExceptionItem {
  id: string;
  type: string;
  severity: string;
  status: string;
  title: string;
  explanation: string;
  amountPaise: number;
  counterparty?: string | null;
}

interface AuditEventItem {
  id: string;
  action: string;
  createdAt: string | Date;
  details?: string | null;
}

interface DashboardClientProps {
  userName?: string;
  orgName?: string;
  latestBalance?: number;
  transactionsCount?: number;
  matchedCount?: number;
  exceptions: ExceptionItem[];
  certificate?: {
    id: string;
    publicId: string;
    status: string;
    level: string;
    issuedAt?: string | Date | null;
    signedBy?: { name?: string | null } | null;
  } | null;
  recentAuditEvents: AuditEventItem[];
}

export function PortalDashboardClient({
  userName = "Tariq",
  orgName = "Meridian Textiles (Pvt) Ltd",
  latestBalance = 163650000,
  transactionsCount = 8,
  matchedCount = 7,
  exceptions = [],
  certificate,
  recentAuditEvents = [],
}: DashboardClientProps) {
  const router = useRouter();

  const openExceptions = exceptions.filter((e) => e.status === "OPEN" || e.status === "CLIENT_SUBMITTED");
  const openCount = openExceptions.length;

  const isIssued = certificate?.status === "ISSUED" || certificate?.status === "VALID";
  const certPublicId = certificate?.publicId || "ATTEST-PK-2026-406434-0A";
  const signerName = certificate?.signedBy?.name || "Ayesha Siddiqui, FCA";

  // Selected Exception for Modal
  const [selectedException, setSelectedException] = useState<ExceptionItem | null>(null);

  const activeFriendly = selectedException ? getOwnerFriendlyException(selectedException) : null;

  return (
    <div className="space-y-5">
      {/* Demo Notice Badge */}
      <div className="inline-flex items-center gap-2 bg-[#FFFBEA] border border-[#F1E8C8] text-[#8A6D1A] text-[11.5px] font-semibold px-3.5 py-1.5 rounded-full">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>Demo data — all companies, figures and people are fictional</span>
      </div>

      {/* Greeting */}
      <h1 className="font-heading text-2xl sm:text-[26px] font-extrabold tracking-tight text-[#17161A] rise">
        Good morning, {userName.split(" ")[0]}
      </h1>

      {/* Hero Verdict Card */}
      <VerdictCard
        state={openCount === 0 ? "green" : "amber"}
        count={openCount}
        period="April 2026"
        onCtaClick={() => {
          if (openCount > 0) {
            const taskPanel = document.getElementById("taskPanel");
            taskPanel?.scrollIntoView({ behavior: "smooth" });
          } else {
            router.push("/portal/certificate");
          }
        }}
      />

      {/* 4-Stat Summary Strip */}
      <SummaryStrip
        balancePaise={latestBalance}
        matchedCount={openCount === 0 ? transactionsCount : matchedCount}
        totalTransactions={transactionsCount}
        openQuestionsCount={openCount}
        certificateStatus={isIssued ? "Valid" : openCount === 0 ? "With CA" : "Pending"}
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-[18px] items-start">
        {/* Left Column: Tasks, Engine, Documents */}
        <div className="space-y-[18px]">
          {/* Panel 1: Things waiting for you */}
          <div
            id="taskPanel"
            className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] overflow-hidden rise d1"
          >
            <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4.5 border-b border-[#F1EFE9] gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-[16px] text-[#17161A] flex items-center gap-2.5">
                  {openCount > 0 && (
                    <span className="min-w-[24px] h-[24px] rounded-full bg-[#FCF2E2] text-[#B45309] grid place-items-center text-xs font-bold px-2 font-mono">
                      {openCount}
                    </span>
                  )}
                  <span>Things waiting for you</span>
                </h3>
                <div className="text-[12.5px] text-[#6E6A61] mt-0.5">
                  Simple questions about your money — each answer moves your certificate forward
                </div>
              </div>

              {openCount > 0 && (
                <Link
                  href="/portal/exceptions"
                  className="text-xs font-semibold text-[#4F46E5] hover:underline"
                >
                  Resolution desk &rarr;
                </Link>
              )}
            </div>

            {/* List of Exceptions */}
            <div>
              {exceptions.map((exc) => {
                const friendly = getOwnerFriendlyException(exc);
                const isResolved = exc.status === "RESOLVED" || exc.status === "WAIVED";

                return (
                  <ExceptionRow
                    key={exc.id}
                    id={exc.id.slice(-5).toUpperCase()}
                    title={friendly.title}
                    description={friendly.description}
                    amountFormatted={formatPaise(exc.amountPaise)}
                    severity={exc.severity}
                    tagText={friendly.tagText}
                    done={isResolved}
                    onClick={() => setSelectedException(exc)}
                  />
                );
              })}

              {openCount === 0 && (
                <div className="p-8 text-center text-[#188A54] font-bold text-sm bg-[#E7F5EE]/40">
                  ✓ Nothing waiting — your file has gone to your CA for signing
                </div>
              )}
            </div>
          </div>

          {/* Panel 2: The checking machine */}
          <VerificationTrigger />

          {/* Panel 3: Your documents */}
          <div className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] overflow-hidden rise d2">
            <div className="flex items-center justify-between p-4 sm:px-6 sm:py-4.5 border-b border-[#F1EFE9] gap-3 flex-wrap">
              <div>
                <h3 className="font-bold text-[16px] text-[#17161A]">
                  Your documents
                </h3>
                <div className="text-[12.5px] text-[#6E6A61] mt-0.5">
                  What we hold from you — and how it arrived
                </div>
              </div>
              <Link
                href="/portal/sources"
                className="px-3.5 py-1.5 rounded-[10px] text-[13.5px] font-semibold bg-white border border-[#E9E6DF] hover:border-[#D5D0C6] text-[#17161A] transition-all hover:-translate-y-0.5"
              >
                ＋ Add document
              </Link>
            </div>

            <div className="divide-y divide-[#F1EFE9]">
              {/* Doc 1 */}
              <div className="flex items-center gap-3.5 p-4 sm:px-6 hover:bg-[#FCFBF8] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M4 11l8-6 8 6" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] text-[#17161A] truncate">
                    Bank statement — HBL, April 2026
                  </div>
                  <div className="text-xs text-[#6E6A61] mt-0.5 truncate">
                    Arrived from your bank&apos;s own email &middot; fingerprint-sealed
                  </div>
                </div>
                <Tag variant="ok">✓ VERIFIED</Tag>
              </div>

              {/* Doc 2 */}
              <div className="flex items-center gap-3.5 p-4 sm:px-6 hover:bg-[#FCFBF8] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] text-[#17161A] truncate">
                    General ledger — April 2026
                  </div>
                  <div className="text-xs text-[#6E6A61] mt-0.5 truncate">
                    Exported from your accounting software &middot; fingerprint-sealed
                  </div>
                </div>
                <Tag variant="ok">✓ VERIFIED</Tag>
              </div>

              {/* Doc 3 */}
              <div className="flex items-center gap-3.5 p-4 sm:px-6 hover:bg-[#FCFBF8] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center shrink-0">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6M16 13H8M16 17H8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13.5px] text-[#17161A] truncate">
                    Sales invoices — FBR e-invoicing
                  </div>
                  <div className="text-xs text-[#6E6A61] mt-0.5 truncate">
                    Pulled directly from FBR &middot; fingerprint-sealed
                  </div>
                </div>
                <Tag variant="ok">✓ VERIFIED</Tag>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Trust Certificate Timeline & Recent Activity */}
        <div className="space-y-[18px] lg:sticky lg:top-[86px]">
          {/* Certificate Timeline Card */}
          <div className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] overflow-hidden rise d1">
            <div className="p-4 sm:px-5 sm:py-4 border-b border-[#F1EFE9]">
              <h3 className="font-bold text-[15px] text-[#17161A]">
                Your Trust Certificate
              </h3>
              <div className="font-mono text-[11px] text-[#A8A296] mt-0.5">
                {certPublicId}
              </div>
            </div>

            <TimelineSteps
              openQuestionsCount={openCount}
              caSignerName={signerName}
              certPublicId={certPublicId}
              isIssued={isIssued}
            />
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[20px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] overflow-hidden rise d2">
            <div className="p-4 sm:px-5 sm:py-4 border-b border-[#F1EFE9]">
              <h3 className="font-bold text-[15px] text-[#17161A]">
                Recent activity
              </h3>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs">
              {recentAuditEvents.length > 0 ? (
                recentAuditEvents.slice(0, 4).map((evt) => (
                  <div key={evt.id} className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-[#17161A]">
                        {evt.action.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                      </div>
                      <div className="text-[11px] text-[#A8A296] mt-0.5">
                        {formatRelativeTime(evt.createdAt)}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5] mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#17161A]">Engine run — 2 questions raised</div>
                      <div className="text-[11px] text-[#A8A296] mt-0.5">just now</div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#188A54] mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#17161A]">Statement validated — arithmetic ✓</div>
                      <div className="text-[11px] text-[#A8A296] mt-0.5">06:00 today</div>
                    </div>
                  </div>
                  <div className="flex gap-2.5 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D8D3C9] mt-1.5 shrink-0" />
                    <div>
                      <div className="font-semibold text-[#17161A]">HBL statement received &amp; sealed</div>
                      <div className="text-[11px] text-[#A8A296] mt-0.5">yesterday</div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Question Modal Matching Reference */}
      {selectedException && activeFriendly && (
        <div
          className="fixed inset-0 z-[100] bg-[#17161A]/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedException(null)}
        >
          <div
            className="bg-white rounded-[20px] max-w-[560px] w-full p-7 sm:p-8 max-h-[86vh] overflow-y-auto shadow-[0_30px_80px_-20px_rgba(23,22,26,.4)] rise"
            onClick={(e) => e.stopPropagation()}
          >
            <Tag variant={selectedException.severity === "CRITICAL" ? "crit" : "warn"}>
              {activeFriendly.tagText}
            </Tag>

            <h3 className="font-heading text-xl font-extrabold text-[#17161A] mt-2.5 mb-1">
              {activeFriendly.title}
            </h3>
            <p className="font-mono text-xs text-[#A8A296] mb-4">
              {selectedException.id.slice(-5).toUpperCase()} &middot; April 2026 &middot; {orgName}
            </p>

            <div className="bg-[#FAF9F6] border border-[#F1EFE9] rounded-[13px] p-3.5 sm:px-4 my-2.5">
              <div className="text-[10.5px] font-bold tracking-[1.1px] text-[#A8A296] uppercase">
                What we noticed
              </div>
              <div className="text-sm text-[#17161A] mt-1 leading-relaxed">
                {activeFriendly.what}
              </div>
            </div>

            <div className="bg-[#FAF9F6] border border-[#F1EFE9] rounded-[13px] p-3.5 sm:px-4 my-2.5">
              <div className="text-[10.5px] font-bold tracking-[1.1px] text-[#A8A296] uppercase">
                Why it matters to you
              </div>
              <div className="text-sm text-[#17161A] mt-1 leading-relaxed">
                {activeFriendly.why}
              </div>
            </div>

            <div className="bg-[#FAF9F6] border border-[#F1EFE9] rounded-[13px] p-3.5 sm:px-4 my-2.5">
              <div className="text-[10.5px] font-bold tracking-[1.1px] text-[#A8A296] uppercase">
                How to clear it
              </div>
              <div className="text-sm text-[#17161A] mt-1 leading-relaxed">
                {activeFriendly.fix}
              </div>
            </div>

            <div className="flex gap-2.5 mt-5 justify-end">
              <button
                type="button"
                onClick={() => setSelectedException(null)}
                className="px-4 py-2 text-[13.5px] font-semibold bg-white border border-[#E9E6DF] rounded-[10px] hover:border-[#D5D0C6] transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                Do it later
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedException(null);
                  router.push(`/portal/exceptions`);
                }}
                className="px-4 py-2 text-[13.5px] font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-[10px] shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all hover:-translate-y-0.5 cursor-pointer"
              >
                I&apos;ll answer this now &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PortalDashboardClient;
