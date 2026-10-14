"use client";

import React, { useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  Paperclip,
  FileText,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Building,
  CreditCard,
  BookOpen,
  Receipt,
  ArrowRight,
  ShieldAlert,
  Clock,
  Send,
  Upload,
  Link as LinkIcon,
  HelpCircle,
  MessageSquare,
  FileCheck,
  AlertCircle,
  X,
} from "lucide-react";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel, formatShortHash, formatRelativeTime } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";

interface ExceptionItem {
  id: string;
  type: string;
  title: string;
  explanation: string;
  severity: string;
  status: string;
  amountPaise: number;
  period: string;
  suggestedResolution?: string | null;
  rejectionReason?: string | null;
  resolutionType?: string | null;
  resolutionNotes?: string | null;
  declarationAccepted?: boolean;
  bankTx?: {
    id: string;
    date: Date | string;
    description: string;
    counterparty?: string | null;
    debitPaise: number;
    creditPaise: number;
    ref?: string | null;
  } | null;
  ledgerEntry?: {
    id: string;
    date: Date | string;
    description: string;
    counterparty?: string | null;
    debitPaise: number;
    creditPaise: number;
    account: string;
    ref?: string | null;
  } | null;
  evidence: Array<{
    id: string;
    filename: string;
    sha256: string;
    notes?: string | null;
    createdAt: Date | string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    createdAt: Date | string;
    author: {
      id: string;
      name?: string | null;
      email: string;
    };
  }>;
  reviewNotes: Array<{
    id: string;
    content: string;
    actionType?: string | null;
    createdAt: Date | string;
    author: {
      name?: string | null;
      email: string;
    };
  }>;
}

interface VaultDoc {
  id: string;
  filename: string;
  type: string;
  period: string;
  sha256: string;
}

export function ExceptionDesk({
  exceptions: initialExceptions,
  vaultDocuments = [],
}: {
  exceptions: ExceptionItem[];
  vaultDocuments?: VaultDoc[];
}) {
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(initialExceptions);
  const [expandedId, setExpandedId] = useState<string | null>(exceptions[0]?.id || null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Stepper state
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [resolutionType, setResolutionType] = useState<string>("MISSING_EVIDENCE");
  const [evidenceMode, setEvidenceMode] = useState<"UPLOAD" | "LINK_VAULT" | "LINK_LEDGER_INVOICE">("UPLOAD");
  const [uploadedFile, setUploadedFile] = useState<{
    filename: string;
    contentBase64: string;
    sha256: string;
  } | null>(null);
  const [selectedVaultDocId, setSelectedVaultDocId] = useState<string>(vaultDocuments[0]?.id || "");
  const [linkedInvoiceNum, setLinkedInvoiceNum] = useState<string>("SI-2026-3387");
  const [explanation, setExplanation] = useState<string>("");
  const [declarationAccepted, setDeclarationAccepted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Comment state
  const [newComment, setNewComment] = useState<{ [excId: string]: string }>({});
  const [commentSubmitting, setCommentSubmitting] = useState<{ [excId: string]: boolean }>({});

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getBorderColor = (severity: string) => {
    if (severity === "CRITICAL") return "border-l-4 border-l-[#DC2626]";
    if (severity === "HIGH") return "border-l-4 border-l-[#D97706]";
    return "border-l-4 border-l-[#2563EB]";
  };

  const openResolutionStepper = (exc: ExceptionItem) => {
    setResolvingId(exc.id);
    setStep(1);
    setErrorMsg(null);
    setExplanation("");
    setDeclarationAccepted(false);
    setUploadedFile(null);

    // Contextual default resolution type
    if (exc.type === "DUPLICATE_PAYMENT") {
      setResolutionType("DUPLICATE_REVERSAL");
      setEvidenceMode("UPLOAD");
    } else if (exc.type === "UNRECORDED_CREDIT" || exc.type === "UNRECORDED_SALE") {
      setResolutionType("LINK_LEDGER_INVOICE");
      setEvidenceMode("LINK_LEDGER_INVOICE");
      setLinkedInvoiceNum("SI-2026-3387");
    } else {
      setResolutionType("MISSING_EVIDENCE");
      setEvidenceMode("UPLOAD");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      // Generate synthetic/browser sha256
      const arrayBuf = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuf);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256Hex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

      setUploadedFile({
        filename: file.name,
        contentBase64: base64,
        sha256: sha256Hex,
      });
    };
    reader.readAsDataURL(file);
  };

  const submitResolution = async (excId: string) => {
    if (explanation.trim().length < 20) {
      setErrorMsg("Written explanation must be at least 20 characters long.");
      return;
    }
    if (!declarationAccepted) {
      setErrorMsg("You must accept the declaration checkbox to confirm accuracy.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      let evidencePayload: any = null;
      if (evidenceMode === "UPLOAD" && uploadedFile) {
        evidencePayload = {
          type: "UPLOAD",
          filename: uploadedFile.filename,
          content: uploadedFile.contentBase64,
          sha256: uploadedFile.sha256,
        };
      } else if (evidenceMode === "LINK_VAULT" && selectedVaultDocId) {
        evidencePayload = {
          type: "LINK_VAULT",
          sourceDocumentId: selectedVaultDocId,
        };
      } else if (evidenceMode === "LINK_LEDGER_INVOICE") {
        evidencePayload = {
          type: "LINK_LEDGER_INVOICE",
          linkedInvoiceNum,
        };
      }

      const res = await fetch(`/api/exceptions/${excId}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionType,
          explanation,
          declarationAccepted,
          evidence: evidencePayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit resolution");
      }

      // Update state locally
      setExceptions((prev) =>
        prev.map((e) =>
          e.id === excId
            ? {
                ...e,
                status: "CLIENT_SUBMITTED",
                resolutionType,
                resolutionNotes: explanation,
                declarationAccepted: true,
                rejectionReason: null,
                evidence: data.evidence
                  ? [...e.evidence, data.evidence]
                  : e.evidence,
                comments: [
                  ...e.comments,
                  {
                    id: `c-${Date.now()}`,
                    content: `[Resolution Submission]: ${explanation}`,
                    createdAt: new Date(),
                    author: { id: "me", email: "client@attest.pk", name: "Client Owner" },
                  },
                ],
              }
            : e
        )
      );

      setResolvingId(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit resolution");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePostComment = async (excId: string) => {
    const text = (newComment[excId] || "").trim();
    if (!text) return;

    setCommentSubmitting((prev) => ({ ...prev, [excId]: true }));
    try {
      const res = await fetch(`/api/exceptions/${excId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (res.ok && data.comment) {
        setExceptions((prev) =>
          prev.map((e) =>
            e.id === excId
              ? {
                  ...e,
                  comments: [...e.comments, data.comment],
                }
              : e
          )
        );
        setNewComment((prev) => ({ ...prev, [excId]: "" }));
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setCommentSubmitting((prev) => ({ ...prev, [excId]: false }));
    }
  };

  const getExpectedEvidenceLabel = (type: string) => {
    switch (type) {
      case "DUPLICATE_PAYMENT":
        return "Expected: Supplier bank refund advice, signed vendor credit note, or corroborated second tax invoice.";
      case "UNRECORDED_CREDIT":
      case "UNRECORDED_SALE":
        return "Expected: FBR Annexure-C sales tax invoice, customer contract, or remittance advice note.";
      case "PAYMENT_WITHOUT_INVOICE":
        return "Expected: Supplier tax invoice with NTN and STRN.";
      default:
        return "Expected: Signed commercial voucher, tax challan, or bank clearing advice.";
    }
  };

  return (
    <div className="space-y-4">
      {exceptions.map((exc) => {
        const isExpanded = expandedId === exc.id;
        const isResolving = resolvingId === exc.id;
        const isCritical = exc.severity === "CRITICAL";
        const isHigh = exc.severity === "HIGH";
        const isPendingReview =
          exc.status === "CLIENT_SUBMITTED" || exc.status === "CA_REVIEW";
        const isResolved = exc.status === "RESOLVED";
        const isMoreInfo = exc.status === "MORE_INFO_REQUESTED";
        const isRejected = Boolean(exc.rejectionReason && exc.status === "OPEN");

        // Parse explanation and impact
        let whatHappened = exc.explanation;
        let whyItMatters =
          "Discrepancies in books or bank records invalidate statutory assertions and require corroborating documentation.";
        if (exc.explanation.includes("However,")) {
          const parts = exc.explanation.split(/(?=However,)/);
          whatHappened = parts[0];
          whyItMatters = parts[1] || whyItMatters;
        } else if (
          exc.explanation.includes("Duplicate disbursements") ||
          exc.explanation.includes("Unrecorded receipts") ||
          exc.explanation.includes("Disbursements without")
        ) {
          const sentences = exc.explanation.split(". ");
          whatHappened = sentences.slice(0, -1).join(". ") + (sentences.length > 1 ? "." : "");
          whyItMatters = sentences[sentences.length - 1];
        }

        return (
          <div
            key={exc.id}
            className={`bg-white rounded-xl border border-[#E6E9EF] shadow-sm transition-all overflow-hidden ${getBorderColor(
              exc.severity
            )}`}
          >
            {/* Clickable Header Row */}
            <div
              onClick={() => setExpandedId(isExpanded ? null : exc.id)}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-[#F7F8FA] transition-colors"
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                    isCritical
                      ? "bg-red-50 text-[#DC2626]"
                      : isHigh
                      ? "bg-amber-50 text-[#D97706]"
                      : "bg-blue-50 text-[#2563EB]"
                  }`}
                >
                  {isCritical ? (
                    <AlertOctagon className="w-5 h-5" />
                  ) : isHigh ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-base font-semibold text-[#0F172A] tracking-tight">
                      {exc.title}
                    </span>
                    <StatusPill rawValue={exc.status} type="status" />
                    {isRejected && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                        Revision Requested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {whatHappened}
                  </p>
                </div>
              </div>

              {/* Right side Amount and Status */}
              <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                <div className="text-right">
                  <span className="font-mono text-base font-bold text-[#0F172A] tabular-nums block">
                    {formatPaise(exc.amountPaise)}
                  </span>
                  <span className="text-[11px] text-[#64748B] font-mono block">
                    {exc.period}
                  </span>
                </div>
                <div className="text-[#64748B] p-1">
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </div>
              </div>
            </div>

            {/* Expanded Detail View */}
            {isExpanded && (
              <div className="px-6 pb-6 pt-2 border-t border-[#E6E9EF] space-y-5 bg-white">
                {/* Status Notice Banners */}
                {isRejected && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-rose-700">
                      <AlertCircle className="w-4 h-4" />
                      <span>Resolution Returned by Licensed CA Reviewer</span>
                    </div>
                    <p className="font-semibold text-rose-900 bg-white/70 p-2.5 rounded-lg border border-rose-200">
                      &ldquo;{exc.rejectionReason}&rdquo;
                    </p>
                    <p className="text-[#64748B] text-[11px]">
                      Your prior submission history is preserved below. Please review the CA&apos;s feedback and submit revised evidence.
                    </p>
                  </div>
                )}

                {isMoreInfo && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-800">
                      <Clock className="w-4 h-4" />
                      <span>Additional Information Requested by CA Reviewer</span>
                    </div>
                    <p className="font-semibold text-amber-900 bg-white/70 p-2.5 rounded-lg border border-amber-200">
                      &ldquo;{exc.rejectionReason}&rdquo;
                    </p>
                  </div>
                )}

                {isPendingReview && (
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-[#2563EB]">
                      <Clock className="w-4 h-4" />
                      <span>Awaiting Professional Review — Typically 1 Business Day</span>
                    </div>
                    <p className="text-blue-900 leading-relaxed">
                      Your resolution package has been sealed with SHA-256 evidence hashes and submitted to the assigned CA. While under review, the submission is read-only. You may post additional clarifying comments below.
                    </p>
                  </div>
                )}

                {isResolved && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Resolution Approved &amp; Verified by Licensed CA</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      This variance has been satisfactorily corroborated with statutory evidence and incorporated into the assurance working papers.
                    </p>
                  </div>
                )}

                {/* 1. What Happened and Why It Matters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-[#2563EB]" />
                      What Happened
                    </span>
                    <p className="text-xs text-[#0F172A] leading-relaxed">
                      {whatHappened}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                      <AlertOctagon className="w-3.5 h-3.5 text-[#D97706]" />
                      Why It Matters
                    </span>
                    <p className="text-xs text-[#0F172A] leading-relaxed">
                      {whyItMatters}
                    </p>
                  </div>
                </div>

                {/* 2. Three-Way Reconciliation Comparison Columns */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] block mb-3">
                    Three-Way Verification Corroboration
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Bank Column */}
                    <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-[#2563EB]" />
                          1. Bank Statement
                        </span>
                        <StatusPill status="CONFIRMED" label="Cleared" size="xs" variant="green" />
                      </div>
                      {exc.bankTx ? (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Date</span>
                            <span className="font-mono text-[#0F172A]">
                              {new Date(exc.bankTx.date).toISOString().split("T")[0]}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Description</span>
                            <span className="text-[#0F172A]">{exc.bankTx.description}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Counterparty</span>
                            <span className="font-semibold text-[#0F172A]">
                              {exc.bankTx.counterparty || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Cleared Amount</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {formatPaise(exc.bankTx.debitPaise || exc.bankTx.creditPaise)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#64748B] italic py-4 text-center">
                          No direct bank clearing record.
                        </div>
                      )}
                    </div>

                    {/* Ledger Column */}
                    <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-[#2563EB]" />
                          2. General Ledger
                        </span>
                        <StatusPill
                          status={exc.ledgerEntry ? "CONFIRMED" : "EXCEPTION"}
                          label={exc.ledgerEntry ? "Recorded" : "Missing Entry"}
                          size="xs"
                        />
                      </div>
                      {exc.ledgerEntry ? (
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Account</span>
                            <span className="font-semibold text-[#0F172A]">
                              {exc.ledgerEntry.account}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Description</span>
                            <span className="text-[#0F172A]">{exc.ledgerEntry.description}</span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Reference</span>
                            <span className="font-mono text-[#0F172A]">
                              {exc.ledgerEntry.ref || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-[#64748B] block text-[11px]">Amount</span>
                            <span className="font-mono font-bold text-[#0F172A]">
                              {formatPaise(
                                exc.ledgerEntry.debitPaise || exc.ledgerEntry.creditPaise
                              )}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-[#DC2626] font-medium py-4 text-center bg-red-50/50 rounded-lg border border-red-100">
                          ⚠️ Unrecorded in books (Missing adjusting journal entry)
                        </div>
                      )}
                    </div>

                    {/* Invoice Column */}
                    <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-2.5">
                      <div className="flex items-center justify-between pb-2 border-b border-[#E6E9EF]">
                        <span className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                          <Receipt className="w-3.5 h-3.5 text-[#2563EB]" />
                          3. Tax / Sales Invoice
                        </span>
                        <StatusPill
                          status={exc.evidence.length > 0 ? "CONFIRMED" : "PENDING"}
                          label={exc.evidence.length > 0 ? "Corroborated" : "Awaiting Doc"}
                          size="xs"
                        />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        {exc.type === "UNRECORDED_SALE" || exc.type === "UNRECORDED_CREDIT" ? (
                          <>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Document</span>
                              <span className="font-semibold text-[#0F172A]">
                                FBR Sales Tax Invoice #SI-2026-3387
                              </span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Recipient</span>
                              <span className="text-[#0F172A]">Al-Rehman Textiles</span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Invoice Value</span>
                              <span className="font-mono font-bold text-[#16A34A]">
                                {formatPaise(34000000)}
                              </span>
                            </div>
                          </>
                        ) : exc.type === "DUPLICATE_PAYMENT" ? (
                          <div className="text-xs text-[#D97706] font-medium py-3 text-center bg-amber-50/50 rounded-lg border border-amber-100">
                            Only 1 invoice (#ZT-1141) exists for 2 debit disbursements
                          </div>
                        ) : (
                          <div className="text-xs text-[#64748B] italic py-3 text-center">
                            Awaiting supplier invoice or tax challan attachment.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Suggested Resolution Callout */}
                {exc.suggestedResolution && (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-[#2563EB]">
                      <CheckCircle2 className="w-4 h-4" />
                      Suggested Resolution Guidance
                    </span>
                    <p className="leading-relaxed text-blue-950">
                      {exc.suggestedResolution}
                    </p>
                    <p className="text-[11px] font-medium text-[#2563EB] pt-1">
                      {getExpectedEvidenceLabel(exc.type)}
                    </p>
                  </div>
                )}

                {/* 4. Corroborating Evidence Vault Attachments */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-[#64748B]" />
                    Attached Corroborating Evidence ({exc.evidence.length})
                  </span>

                  {exc.evidence.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {exc.evidence.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-3 rounded-lg border border-[#E6E9EF] bg-[#F7F8FA] flex items-start justify-between text-xs"
                        >
                          <div className="space-y-0.5 min-w-0 pr-2">
                            <span className="font-semibold text-[#0F172A] block truncate">
                              {ev.filename}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-mono">
                              <span>SHA: {formatShortHash(ev.sha256, 8)}</span>
                              <button
                                onClick={() => copyToClipboard(ev.sha256)}
                                title="Copy Full Hash"
                                className="text-slate-400 hover:text-[#2563EB] transition-colors"
                              >
                                {copiedHash === ev.sha256 ? (
                                  <Check className="w-3 h-3 text-[#16A34A]" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            {ev.notes && (
                              <p className="text-[11px] text-[#64748B] mt-1 italic">
                                {ev.notes}
                              </p>
                            )}
                          </div>
                          <StatusPill status="CONFIRMED" label="Validated" size="xs" variant="green" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[#E6E9EF] bg-[#F7F8FA] text-center text-xs text-[#64748B]">
                      No supporting evidence attached yet. Launch the resolution stepper below to provide documentation.
                    </div>
                  )}
                </div>

                {/* 5. Complete Communication & Comment History */}
                <div className="space-y-3 pt-2 border-t border-[#E6E9EF]">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-[#64748B]" />
                    Audit Dialogue &amp; Review History ({exc.comments.length + exc.reviewNotes.length})
                  </span>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto">
                    {exc.comments.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#0F172A]">
                            {c.author.name || c.author.email}
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {formatRelativeTime(c.createdAt)}
                          </span>
                        </div>
                        <p className="text-[#334155] leading-relaxed">{c.content}</p>
                      </div>
                    ))}

                    {exc.reviewNotes.map((n) => (
                      <div
                        key={n.id}
                        className="p-3 rounded-xl border border-blue-100 bg-blue-50/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#2563EB] flex items-center gap-1">
                            <FileCheck className="w-3.5 h-3.5" />
                            CA Reviewer ({n.author.name || "Chartered Accountant"})
                          </span>
                          <span className="text-[10px] text-[#64748B]">
                            {formatRelativeTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="text-blue-950 leading-relaxed">{n.content}</p>
                      </div>
                    ))}
                  </div>

                  {/* Add Comment Input (Always available while not resolved) */}
                  {!isResolved && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        value={newComment[exc.id] || ""}
                        onChange={(e) =>
                          setNewComment((prev) => ({ ...prev, [exc.id]: e.target.value }))
                        }
                        placeholder="Add clarifying note or comment for CA reviewer..."
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-[#E6E9EF] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                      />
                      <button
                        type="button"
                        onClick={() => handlePostComment(exc.id)}
                        disabled={commentSubmitting[exc.id] || !newComment[exc.id]?.trim()}
                        className="px-3.5 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold disabled:opacity-50 transition-colors inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 6. Action Panel: "Resolve this" Guided Stepper or Submission Status */}
                <div className="pt-4 border-t border-[#E6E9EF]">
                  {isResolving ? (
                    /* The Guided Stepper Modal / Card */
                    <div className="bg-[#F7F8FA] border-2 border-[#2563EB] rounded-2xl p-5 space-y-5">
                      {/* Stepper Header */}
                      <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-3">
                        <div>
                          <span className="font-bold text-sm text-[#0F172A] block">
                            Guided Resolution Stepper
                          </span>
                          <span className="text-[11px] text-[#64748B]">
                            Step {step} of 4:{" "}
                            {step === 1 && "Choose Resolution Strategy"}
                            {step === 2 && "Corroborating Evidence"}
                            {step === 3 && "Written Explanation & Declaration"}
                            {step === 4 && "Review & Submit for CA Review"}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setResolvingId(null)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {errorMsg && (
                        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
                          {errorMsg}
                        </div>
                      )}

                      {/* STEP 1: Choose resolution type */}
                      {step === 1 && (
                        <div className="space-y-3">
                          <span className="text-xs font-semibold text-[#0F172A] block">
                            Select resolution approach for this exception:
                          </span>
                          <div className="space-y-2">
                            {exc.type === "DUPLICATE_PAYMENT" ? (
                              <>
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                                  <input
                                    type="radio"
                                    name="resType"
                                    checked={resolutionType === "DUPLICATE_REVERSAL"}
                                    onChange={() => setResolutionType("DUPLICATE_REVERSAL")}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <span className="font-bold text-xs text-[#0F172A] block">
                                      It&apos;s a duplicate — I&apos;ll reverse it / already reversed
                                    </span>
                                    <span className="text-[11px] text-[#64748B]">
                                      Attach vendor credit note or bank reversal clearing advice.
                                    </span>
                                  </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                                  <input
                                    type="radio"
                                    name="resType"
                                    checked={resolutionType === "MISSING_EVIDENCE"}
                                    onChange={() => setResolutionType("MISSING_EVIDENCE")}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <span className="font-bold text-xs text-[#0F172A] block">
                                      Provide missing second purchase invoice
                                    </span>
                                    <span className="text-[11px] text-[#64748B]">
                                      Both disbursements were genuine separate orders; upload 2nd bill.
                                    </span>
                                  </div>
                                </label>
                              </>
                            ) : exc.type === "UNRECORDED_CREDIT" || exc.type === "UNRECORDED_SALE" ? (
                              <>
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                                  <input
                                    type="radio"
                                    name="resType"
                                    checked={resolutionType === "LINK_LEDGER_INVOICE"}
                                    onChange={() => {
                                      setResolutionType("LINK_LEDGER_INVOICE");
                                      setEvidenceMode("LINK_LEDGER_INVOICE");
                                    }}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <span className="font-bold text-xs text-[#0F172A] block">
                                      Link FBR Sales Invoice #SI-2026-3387 &amp; post adjusting sale
                                    </span>
                                    <span className="text-[11px] text-[#64748B]">
                                      Corroborates deposit against customer sales invoice and books adjusting journal entry.
                                    </span>
                                  </div>
                                </label>
                                <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                                  <input
                                    type="radio"
                                    name="resType"
                                    checked={resolutionType === "MISSING_EVIDENCE"}
                                    onChange={() => setResolutionType("MISSING_EVIDENCE")}
                                    className="mt-0.5"
                                  />
                                  <div>
                                    <span className="font-bold text-xs text-[#0F172A] block">
                                      Provide missing sales invoice or remittance advice
                                    </span>
                                    <span className="text-[11px] text-[#64748B]">
                                      Upload customer contract or bank payment advice.
                                    </span>
                                  </div>
                                </label>
                              </>
                            ) : (
                              <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                                <input
                                  type="radio"
                                  name="resType"
                                  checked={resolutionType === "MISSING_EVIDENCE"}
                                  onChange={() => setResolutionType("MISSING_EVIDENCE")}
                                  className="mt-0.5"
                                />
                                <div>
                                  <span className="font-bold text-xs text-[#0F172A] block">
                                    Provide the missing corroborating evidence
                                  </span>
                                  <span className="text-[11px] text-[#64748B]">
                                    Upload official commercial or statutory document.
                                  </span>
                                </div>
                              </label>
                            )}

                            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                              <input
                                type="radio"
                                name="resType"
                                checked={resolutionType === "EXPLANATION"}
                                onChange={() => setResolutionType("EXPLANATION")}
                                className="mt-0.5"
                              />
                              <div>
                                <span className="font-bold text-xs text-[#0F172A] block">
                                  Commercial / Accounting explanation
                                </span>
                                <span className="text-[11px] text-[#64748B]">
                                  Provide formal business explanation for CA evaluation.
                                </span>
                              </div>
                            </label>

                            <label className="flex items-start gap-3 p-3 rounded-xl border border-[#E6E9EF] bg-white cursor-pointer hover:border-[#2563EB] transition-colors">
                              <input
                                type="radio"
                                name="resType"
                                checked={resolutionType === "DISPUTE"}
                                onChange={() => setResolutionType("DISPUTE")}
                                className="mt-0.5"
                              />
                              <div>
                                <span className="font-bold text-xs text-[#0F172A] block">
                                  Dispute this finding
                                </span>
                                <span className="text-[11px] text-[#64748B]">
                                  Contest deterministic engine variance assertion.
                                </span>
                              </div>
                            </label>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                            >
                              Continue to Evidence &rarr;
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 2: Evidence */}
                      {step === 2 && (
                        <div className="space-y-4">
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-[#2563EB] flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            <span>{getExpectedEvidenceLabel(exc.type)}</span>
                          </div>

                          {/* Evidence Selection Mode */}
                          <div className="flex gap-2 border-b border-[#E6E9EF] pb-3">
                            <button
                              type="button"
                              onClick={() => setEvidenceMode("UPLOAD")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                evidenceMode === "UPLOAD"
                                  ? "bg-[#2563EB] text-white"
                                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E6E9EF]"
                              }`}
                            >
                              Upload New File
                            </button>
                            <button
                              type="button"
                              onClick={() => setEvidenceMode("LINK_VAULT")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                evidenceMode === "LINK_VAULT"
                                  ? "bg-[#2563EB] text-white"
                                  : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E6E9EF]"
                              }`}
                            >
                              Link Existing Vault Document
                            </button>
                            {(exc.type === "UNRECORDED_CREDIT" || exc.type === "UNRECORDED_SALE") && (
                              <button
                                type="button"
                                onClick={() => setEvidenceMode("LINK_LEDGER_INVOICE")}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                  evidenceMode === "LINK_LEDGER_INVOICE"
                                    ? "bg-[#2563EB] text-white"
                                    : "bg-white text-[#64748B] hover:text-[#0F172A] border border-[#E6E9EF]"
                                }`}
                              >
                                Link FBR Sales Invoice
                              </button>
                            )}
                          </div>

                          {/* Upload Tab */}
                          {evidenceMode === "UPLOAD" && (
                            <div className="space-y-2">
                              <label className="block p-5 border-2 border-dashed border-[#E6E9EF] rounded-xl text-center bg-white hover:bg-slate-50 cursor-pointer transition-colors">
                                <Upload className="w-6 h-6 mx-auto text-[#64748B] mb-2" />
                                <span className="text-xs font-semibold text-[#0F172A] block">
                                  {uploadedFile
                                    ? uploadedFile.filename
                                    : "Click to upload evidence document (PDF, CSV, Image)"}
                                </span>
                                <span className="text-[11px] text-[#64748B] block mt-0.5">
                                  {uploadedFile
                                    ? `SHA-256: ${formatShortHash(uploadedFile.sha256, 12)} (Cryptographically sealed)`
                                    : "Files are automatically SHA-256 hashed into the Attest vault"}
                                </span>
                                <input
                                  type="file"
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  accept=".pdf,.csv,.png,.jpg,.jpeg"
                                />
                              </label>
                            </div>
                          )}

                          {/* Link Vault Tab */}
                          {evidenceMode === "LINK_VAULT" && (
                            <div className="space-y-2">
                              <span className="text-xs text-[#64748B] block">
                                Select from documents already ingested into your tenant vault:
                              </span>
                              <select
                                value={selectedVaultDocId}
                                onChange={(e) => setSelectedVaultDocId(e.target.value)}
                                className="w-full p-2.5 rounded-xl border border-[#E6E9EF] bg-white text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                              >
                                {vaultDocuments.map((doc) => (
                                  <option key={doc.id} value={doc.id}>
                                    {doc.filename} ({formatEnumLabel(doc.type)} &bull; {doc.period})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}

                          {/* Link Invoice Tab */}
                          {evidenceMode === "LINK_LEDGER_INVOICE" && (
                            <div className="p-4 rounded-xl border border-[#E6E9EF] bg-white space-y-2 text-xs">
                              <span className="font-bold text-[#0F172A] block">
                                Corroborating Sales Invoice
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[#64748B]">Invoice #:</span>
                                <input
                                  type="text"
                                  value={linkedInvoiceNum}
                                  onChange={(e) => setLinkedInvoiceNum(e.target.value)}
                                  className="px-2.5 py-1 font-mono rounded border border-[#E6E9EF] font-semibold text-[#0F172A]"
                                />
                                <span className="text-emerald-700 font-semibold">
                                  PKR 340,000.00 (FBR Annexure-C Registered)
                                </span>
                              </div>
                              <p className="text-[11px] text-[#64748B]">
                                An adjusting journal entry will be scheduled to record this sale against Domestic Sales Revenue upon CA review.
                              </p>
                            </div>
                          )}

                          <div className="flex justify-between pt-2">
                            <button
                              type="button"
                              onClick={() => setStep(1)}
                              className="px-4 py-2 rounded-xl border border-[#E6E9EF] bg-white text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              &larr; Back
                            </button>
                            <button
                              type="button"
                              onClick={() => setStep(3)}
                              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                            >
                              Continue to Explanation &rarr;
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: Written explanation & declaration */}
                      {step === 3 && (
                        <div className="space-y-4">
                          <div>
                            <label className="text-xs font-semibold text-[#0F172A] block mb-1">
                              Detailed Accounting Explanation (Minimum 20 characters)
                            </label>
                            <textarea
                              rows={4}
                              value={explanation}
                              onChange={(e) => setExplanation(e.target.value)}
                              placeholder="Provide the commercial background, confirmation details from supplier/customer, and accounting rationale..."
                              className="w-full p-3 text-xs rounded-xl border border-[#E6E9EF] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                            />
                            <div className="flex justify-between text-[11px] text-[#64748B] mt-1">
                              <span>Min 20 characters required</span>
                              <span
                                className={
                                  explanation.trim().length >= 20
                                    ? "text-emerald-600 font-bold"
                                    : "text-amber-600"
                                }
                              >
                                {explanation.trim().length} / 20 chars
                              </span>
                            </div>
                          </div>

                          {/* Mandatory Declaration Checkbox */}
                          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-blue-200 bg-blue-50/70 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={declarationAccepted}
                              onChange={(e) => setDeclarationAccepted(e.target.checked)}
                              className="mt-0.5 rounded text-[#2563EB]"
                            />
                            <span className="text-xs text-[#0F172A] font-medium leading-relaxed">
                              I confirm this information is accurate and I am authorized to provide it on behalf of the company.
                            </span>
                          </label>

                          <div className="flex justify-between pt-2">
                            <button
                              type="button"
                              onClick={() => setStep(2)}
                              className="px-4 py-2 rounded-xl border border-[#E6E9EF] bg-white text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              &larr; Back
                            </button>
                            <button
                              type="button"
                              disabled={explanation.trim().length < 20 || !declarationAccepted}
                              onClick={() => setStep(4)}
                              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50 transition-colors"
                            >
                              Review Submission &rarr;
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 4: Review & Submit */}
                      {step === 4 && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl border border-[#E6E9EF] bg-white space-y-2.5 text-xs">
                            <span className="font-bold text-[#0F172A] block uppercase text-[11px] tracking-wider text-[#64748B]">
                              Resolution Package Summary
                            </span>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Strategy</span>
                              <span className="font-semibold text-[#0F172A]">
                                {formatEnumLabel(resolutionType)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Evidence Attached</span>
                              <span className="font-mono text-[#0F172A]">
                                {evidenceMode === "UPLOAD"
                                  ? uploadedFile?.filename || "Synthetic reversal advice voucher"
                                  : evidenceMode === "LINK_VAULT"
                                  ? "Linked from Vault"
                                  : `FBR Invoice #${linkedInvoiceNum}`}
                              </span>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Explanation Note</span>
                              <p className="text-[#334155] italic bg-[#F7F8FA] p-2.5 rounded-lg border border-[#E6E9EF]">
                                &ldquo;{explanation}&rdquo;
                              </p>
                            </div>
                            <div>
                              <span className="text-[#64748B] block text-[11px]">Authorization</span>
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Confirmed by Client Representative
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between pt-2">
                            <button
                              type="button"
                              onClick={() => setStep(3)}
                              className="px-4 py-2 rounded-xl border border-[#E6E9EF] bg-white text-xs font-semibold hover:bg-slate-50 transition-colors"
                            >
                              &larr; Back
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => submitResolution(exc.id)}
                              className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-bold shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
                            >
                              {submitting ? (
                                <span>Submitting...</span>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Submit for CA Sign-Off</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Default Action Bar */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[11px] font-mono text-[#64748B]">
                        Exception ID: {exc.id.slice(-8)}
                      </span>

                      <div className="flex items-center gap-2.5">
                        {!isResolved && !isPendingReview && (
                          <button
                            type="button"
                            onClick={() => openResolutionStepper(exc)}
                            className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              {isRejected ? "Resubmit Resolution" : "Resolve this"}
                            </span>
                          </button>
                        )}

                        {isPendingReview && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#2563EB] text-xs font-semibold border border-blue-200">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Awaiting CA review</span>
                          </span>
                        )}

                        {isResolved && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Fully Resolved &amp; Verified</span>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
