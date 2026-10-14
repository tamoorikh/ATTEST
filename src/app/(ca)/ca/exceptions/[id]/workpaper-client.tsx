"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ShieldCheck,
  FileCheck,
  FileText,
  Paperclip,
  Building,
  CreditCard,
  BookOpen,
  Receipt,
  ArrowLeft,
  Copy,
  Check,
  Send,
  Download,
  AlertCircle,
  Scale,
  Flag,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash, formatRelativeTime } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyButton } from "@/components/ui/CopyButton";
import { PriorityScoreChip } from "@/components/ca/PriorityScoreChip";

interface WorkpaperProps {
  exception: any;
  org: any;
  score: number;
  daysWaiting: number;
}

export function WorkpaperClient({
  exception: initialException,
  org,
  score,
  daysWaiting,
}: WorkpaperProps) {
  const router = useRouter();
  const [exception, setException] = useState(initialException);
  const [actionModal, setActionModal] = useState<"ACCEPT" | "REJECT" | "REQUEST_MORE_INFO" | "ESCALATE" | null>(null);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const handleAction = async (action: "ACCEPT" | "REJECT" | "REQUEST_MORE_INFO" | "ESCALATE") => {
    if ((action === "REJECT" || action === "REQUEST_MORE_INFO") && reason.trim().length < 20) {
      setErrorMsg("A mandatory reason of at least 20 characters is required.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/exceptions/${exception.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process review decision");
      }

      setException(data.exception);
      setActionModal(null);
      setReason("");
      setSuccessMsg(
        action === "ACCEPT"
          ? "Resolution approved! Exception status updated to RESOLVED and corroborating working paper signed."
          : action === "REJECT"
          ? "Resolution rejected and returned to client with mandatory reasoning."
          : action === "REQUEST_MORE_INFO"
          ? "Additional evidence request dispatched to client."
          : "Exception marked as escalated for partner review."
      );
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process decision");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const res = await fetch(`/api/exceptions/${exception.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `[CA Reviewer Note]: ${newComment.trim()}` }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setException((prev: any) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }));
        setNewComment("");
      }
    } catch (e) {
      console.error("Error adding comment:", e);
    }
  };

  const isResolved = exception.status === "RESOLVED";

  return (
    <div className="space-y-6">
      {/* Top Navigation & Engagement Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E9EF] pb-4">
        <Link
          href="/ca"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Assurance Review Queue</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#64748B]">Workpaper ID:</span>
          <span className="font-mono text-xs font-bold text-[#0F172A] bg-slate-100 px-2 py-0.5 rounded">
            WP-{exception.id.slice(-8).toUpperCase()}
          </span>
          <StatusPill rawValue={exception.status} type="status" size="sm" />
          {exception.isEscalated && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
              Escalated
            </span>
          )}
        </div>
      </div>

      {/* Engagement Card */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg font-bold text-[#0F172A]">
                {org?.name || "Meridian Textiles (Pvt) Ltd"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-[#2563EB] border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Chartered Accountant Working Paper
              </span>
            </div>
            <p className="text-xs text-[#64748B]">
              Period: <span className="font-semibold text-[#0F172A]">{exception.period}</span> &bull; 
              NTN: <span className="font-mono text-[#0F172A]">{org?.companyProfile?.taxId || "7391024-8"}</span> &bull; 
              Audit Framework: <span className="font-semibold text-[#0F172A]">ISAE 3000 / IFRS</span> &bull; 
              Assurance Level: <span className="font-semibold text-[#2563EB]">Level 1 (Advancing to Level 2/3)</span>
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <PriorityScoreChip
              score={score}
              severity={exception.severity}
              amountPaise={exception.amountPaise}
              daysWaiting={daysWaiting}
            />
          </div>
        </div>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-center gap-2 font-medium">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Exception Variance Summary Card */}
      <div
        className={`bg-white rounded-2xl border border-[#E6E9EF] p-6 shadow-sm space-y-5 border-l-4 ${
          exception.severity === "CRITICAL"
            ? "border-l-rose-600"
            : exception.severity === "HIGH"
            ? "border-l-amber-500"
            : "border-l-blue-600"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E6E9EF] pb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <StatusPill rawValue={exception.severity} type="severity" />
              <span className="text-xs font-mono text-[#64748B]">
                Type: {formatEnumLabel(exception.type)}
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">
              {exception.title}
            </h1>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#64748B] block">Variance Value at Risk</span>
            <span className="font-mono text-2xl font-bold text-[#0F172A] tabular-nums">
              {formatPaise(exception.amountPaise)}
            </span>
          </div>
        </div>

        {/* Narrative Finding & Impact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
              1. Auditor Finding Narrative
            </span>
            <p className="text-[#0F172A] leading-relaxed">{exception.explanation}</p>
          </div>

          <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
              2. Resolution Standard &amp; Pre-requisite
            </span>
            <p className="text-[#0F172A] leading-relaxed">
              {exception.suggestedResolution || "Requires corroborating commercial evidence."}
            </p>
          </div>
        </div>

        {/* 3-Column Financial Corroboration */}
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block mb-3">
            3-Way Corroboration Reconciliation Model
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Column 1: Bank */}
            <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
                  Bank Statement
                </span>
                <StatusPill status="CONFIRMED" label="Cleared" size="xs" variant="green" />
              </div>
              {exception.bankTx ? (
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Transaction Date</span>
                    <span className="font-mono text-[#0F172A]">
                      {new Date(exception.bankTx.date).toISOString().split("T")[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Description</span>
                    <span className="text-[#0F172A]">{exception.bankTx.description}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Amount</span>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {formatPaise(exception.bankTx.debitPaise || exception.bankTx.creditPaise)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 italic py-2">No bank record.</div>
              )}
            </div>

            {/* Column 2: Ledger */}
            <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                  General Ledger
                </span>
                <StatusPill
                  status={exception.ledgerEntry ? "CONFIRMED" : "EXCEPTION"}
                  label={exception.ledgerEntry ? "Recorded" : "Missing"}
                  size="xs"
                />
              </div>
              {exception.ledgerEntry ? (
                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Account</span>
                    <span className="font-semibold text-[#0F172A]">{exception.ledgerEntry.account}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Reference</span>
                    <span className="font-mono text-[#0F172A]">{exception.ledgerEntry.ref || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] block text-[11px]">Amount</span>
                    <span className="font-mono font-bold text-[#0F172A]">
                      {formatPaise(exception.ledgerEntry.debitPaise || exception.ledgerEntry.creditPaise)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-rose-600 font-medium py-3 text-center bg-rose-50/50 rounded-lg border border-rose-100">
                  ⚠️ Unrecorded in books
                </div>
              )}
            </div>

            {/* Column 3: Tax Invoices */}
            <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-[#2563EB]" />
                  Statutory Tax Invoice
                </span>
                <StatusPill
                  status={exception.evidence?.length > 0 ? "CONFIRMED" : "PENDING"}
                  label={exception.evidence?.length > 0 ? "Attached" : "Missing"}
                  size="xs"
                />
              </div>
              <div className="space-y-1 text-xs">
                {exception.type === "UNRECORDED_CREDIT" || exception.type === "UNRECORDED_SALE" ? (
                  <>
                    <span className="font-semibold text-[#0F172A] block">FBR Invoice #SI-2026-3387</span>
                    <span className="text-[#64748B] block">Al-Rehman Textiles</span>
                    <span className="font-mono font-bold text-emerald-600 block">
                      {formatPaise(34000000)}
                    </span>
                  </>
                ) : exception.type === "DUPLICATE_PAYMENT" ? (
                  <div className="text-amber-700 py-2 text-center bg-amber-50 rounded">
                    Only 1 invoice (#ZT-1141) exists for 2 disbursements.
                  </div>
                ) : (
                  <div className="text-slate-400 italic py-2 text-center">Awaiting invoice evidence.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Client Submission Package (Read-Only) */}
        <div className="p-5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
              <FileCheck className="w-4 h-4" />
              Client Resolution Package Submission
            </span>
            <span className="text-[11px] text-[#64748B]">
              Status: <span className="font-semibold text-[#0F172A]">{formatEnumLabel(exception.status)}</span>
            </span>
          </div>

          {exception.resolutionNotes ? (
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#64748B] block text-[11px]">Resolution Strategy:</span>
                <span className="font-semibold text-[#0F172A]">
                  {formatEnumLabel(exception.resolutionType || "MISSING_EVIDENCE")}
                </span>
              </div>

              <div>
                <span className="text-[#64748B] block text-[11px]">Client Written Explanation:</span>
                <p className="p-3 bg-white rounded-xl border border-blue-200 text-[#0F172A] italic leading-relaxed">
                  &ldquo;{exception.resolutionNotes}&rdquo;
                </p>
              </div>

              {exception.declarationAccepted && (
                <div className="flex items-center gap-1.5 text-emerald-700 font-semibold text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Authorized client declaration accepted and verified.</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-[#64748B] italic py-2">
              Client has not submitted a formal explanation package for this exception yet.
            </div>
          )}

          {/* Attached Evidence Files */}
          <div className="pt-2 border-t border-blue-200/80">
            <span className="text-xs font-semibold text-[#0F172A] block mb-2">
              Attached Supporting Evidence ({exception.evidence?.length || 0}):
            </span>

            {exception.evidence && exception.evidence.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {exception.evidence.map((ev: any) => (
                  <div
                    key={ev.id}
                    className="p-3 bg-white rounded-xl border border-[#E6E9EF] flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <span className="font-semibold text-[#0F172A] truncate block">
                        {ev.filename}
                      </span>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                        <span>SHA: {formatShortHash(ev.sha256, 8)}</span>
                        <CopyButton value={ev.sha256} label="Copy hash" />
                      </div>
                    </div>
                    {ev.sourceDocumentId && (
                      <a
                        href={`/api/documents/${ev.sourceDocumentId}/download`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg border border-[#E6E9EF] text-[#2563EB] hover:bg-blue-50 transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#64748B] italic">No evidence files attached.</div>
            )}
          </div>
        </div>

        {/* History Dialogue & Review Notes */}
        <div className="space-y-3 pt-2 border-t border-[#E6E9EF]">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block">
            Audit Trail &amp; Communication History ({((exception.comments?.length || 0) + (exception.reviewNotes?.length || 0))})
          </span>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {exception.comments?.map((c: any) => (
              <div key={c.id} className="p-3 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#0F172A]">{c.author?.name || c.author?.email}</span>
                  <span className="text-[10px] text-[#64748B]">{formatRelativeTime(c.createdAt)}</span>
                </div>
                <p className="text-[#334155]">{c.content}</p>
              </div>
            ))}

            {exception.reviewNotes?.map((n: any) => (
              <div key={n.id} className="p-3 rounded-xl border border-blue-200 bg-blue-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2563EB] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    CA Decision: {formatEnumLabel(n.actionType || "REVIEW")}
                  </span>
                  <span className="text-[10px] text-[#64748B]">{formatRelativeTime(n.createdAt)}</span>
                </div>
                <p className="text-blue-950 font-medium">{n.content}</p>
              </div>
            ))}
          </div>

          {/* Add CA internal note */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add CA working paper observation note..."
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E6E9EF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            />
            <button
              type="button"
              onClick={handleAddComment}
              disabled={!newComment.trim()}
              className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
            >
              Add Note
            </button>
          </div>
        </div>

        {/* CA Decision Chamber (Action Bar) */}
        <div className="pt-4 border-t border-[#E6E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-[#64748B]">
            <Scale className="w-4 h-4 text-[#2563EB]" />
            <span>Chartered Accountant Review Authority</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setActionModal("ESCALATE");
                setReason("");
              }}
              className="px-3 py-2 rounded-xl border border-[#E6E9EF] hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors flex items-center gap-1"
            >
              <Flag className="w-3.5 h-3.5 text-purple-600" />
              <span>Escalate</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionModal("REQUEST_MORE_INFO");
                setReason("");
              }}
              className="px-3 py-2 rounded-xl border border-[#E6E9EF] hover:bg-slate-50 text-xs font-semibold text-[#0F172A] transition-colors flex items-center gap-1"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Request More Info</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActionModal("REJECT");
                setReason("");
              }}
              className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors"
            >
              Reject Resolution
            </button>

            <button
              type="button"
              onClick={() => {
                setActionModal("ACCEPT");
                setReason("Resolution approved and corroborating evidence verified against statutory books.");
              }}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept Resolution</span>
            </button>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E6E9EF] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-3">
              <span className="font-bold text-base text-[#0F172A] flex items-center gap-2">
                {actionModal === "ACCEPT" && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                {actionModal === "REJECT" && <AlertCircle className="w-5 h-5 text-rose-600" />}
                {actionModal === "REQUEST_MORE_INFO" && <Clock className="w-5 h-5 text-amber-600" />}
                {actionModal === "ESCALATE" && <Flag className="w-5 h-5 text-purple-600" />}
                <span>
                  {actionModal === "ACCEPT" && "Approve & Sign Exception Resolution"}
                  {actionModal === "REJECT" && "Reject Resolution & Return for Revision"}
                  {actionModal === "REQUEST_MORE_INFO" && "Request Additional Corroborating Evidence"}
                  {actionModal === "ESCALATE" && "Escalate to Senior Audit Partner"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 rounded-lg">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <label className="text-xs font-semibold text-[#0F172A] block">
                {actionModal === "ACCEPT"
                  ? "Audit Working Paper Endorsement Note (Optional):"
                  : "Mandatory Professional Reasoning (Minimum 20 characters):"}
              </label>
              <textarea
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionModal === "REJECT"
                    ? "Specify exact reason why evidence is insufficient (e.g. credit note lacks vendor signature or stamp)..."
                    : actionModal === "REQUEST_MORE_INFO"
                    ? "Detail additional documentation required to substantiate occurrence or valuation..."
                    : "Endorsement note for working paper..."
                }
                className="w-full p-3 text-xs rounded-xl border border-[#E6E9EF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
              />

              {(actionModal === "REJECT" || actionModal === "REQUEST_MORE_INFO") && (
                <div className="flex justify-between text-[11px] text-[#64748B]">
                  <span>Mandatory min 20 characters</span>
                  <span
                    className={
                      reason.trim().length >= 20 ? "text-emerald-600 font-bold" : "text-amber-600"
                    }
                  >
                    {reason.trim().length} / 20 chars
                  </span>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#E6E9EF]">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isSubmitting ||
                  ((actionModal === "REJECT" || actionModal === "REQUEST_MORE_INFO") &&
                    reason.trim().length < 20)
                }
                onClick={() => handleAction(actionModal)}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-50 transition-colors ${
                  actionModal === "ACCEPT"
                    ? "bg-[#2563EB] hover:bg-blue-700"
                    : actionModal === "REJECT"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : actionModal === "REQUEST_MORE_INFO"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                {isSubmitting ? "Processing Decision..." : "Confirm Decision"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
