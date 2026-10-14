"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Copy,
  Check,
  Building,
  Mail,
  FileText,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";

interface DisclosureItem {
  id: string;
  requesterName: string;
  requesterOrg?: string | null;
  requesterEmail: string;
  purpose: string;
  period: string;
  categoriesJson: string;
  approvedCategoriesJson?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  downloadToken?: string | null;
  downloadTokenExpiresAt?: string | null;
  downloadCount: number;
  rejectionReason?: string | null;
  createdAt: string;
  certificate: {
    publicId: string;
  };
}

export default function EvidenceSharingPage() {
  const [requests, setRequests] = useState<DisclosureItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Modal states
  const [selectedReq, setSelectedReq] = useState<DisclosureItem | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "REJECT" | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch("/api/disclosures");
      if (!res.ok) throw new Error("Failed to load requests");
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error fetching disclosure requests");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  function openApproveModal(req: DisclosureItem) {
    setSelectedReq(req);
    setActionType("APPROVE");
    try {
      setSelectedCategories(JSON.parse(req.categoriesJson || "[]"));
    } catch {
      setSelectedCategories(["BANK_STATEMENT"]);
    }
  }

  function openRejectModal(req: DisclosureItem) {
    setSelectedReq(req);
    setActionType("REJECT");
    setRejectionReason("Request does not meet verified commercial lending counterparty requirements.");
  }

  async function handleDecision() {
    if (!selectedReq || !actionType) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/disclosures/${selectedReq.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          approvedCategories: actionType === "APPROVE" ? selectedCategories : undefined,
          rejectionReason: actionType === "REJECT" ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Decision failed");

      setActionSuccess(
        actionType === "APPROVE"
          ? `Evidence pack link successfully generated for ${selectedReq.requesterName} (expires in 7 days).`
          : `Request from ${selectedReq.requesterName} rejected.`
      );
      setSelectedReq(null);
      setActionType(null);
      await loadRequests();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Action failed");
    } finally {
      setSubmitting(false);
    }
  }

  function copyDownloadLink(token: string) {
    const url = `${window.location.origin}/api/disclosures/download?token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  }

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
          Evidence Pack Sharing Desk
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Review third-party requests for supporting evidence. Approve scoped, signed, 7-day expiring download packages.
        </p>
      </div>

      {/* Consent Charter Note */}
      <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <FileCheck2 className="w-5 h-5 text-[#2563EB] mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block uppercase tracking-wider text-[10px] text-blue-900">
            Attest Evidence Sharing &amp; Consent Charter
          </span>
          <span className="mt-0.5 block leading-relaxed text-blue-950">
            Third parties who look up your public certificate may request access to supporting evidence. Nothing is ever shared without your explicit authorization. Approved packages contain only the selected document categories and a cryptographic SHA-256 manifest.
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{actionSuccess}</div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-start gap-2.5">
          <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {/* Requests List */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-4">
          <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#2563EB]" />
            Incoming Disclosure Requests ({requests.length})
          </h2>
          <span className="text-xs text-[#64748B]">Audited Access Control</span>
        </div>

        {requests.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            No evidence disclosure requests received yet.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const requestedCats: string[] = (() => {
                try {
                  return JSON.parse(req.categoriesJson || "[]");
                } catch {
                  return [];
                }
              })();

              const isExpired =
                req.downloadTokenExpiresAt && new Date(req.downloadTokenExpiresAt) < new Date();

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-[#E6E9EF] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0F172A]">{req.requesterName}</span>
                        {req.requesterOrg && (
                          <span className="text-xs font-medium text-[#64748B]">
                            &bull; {req.requesterOrg}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{req.requesterEmail}</span>
                        <span>&bull; Certificate: <strong className="font-mono text-[#2563EB]">{req.certificate.publicId}</strong></span>
                        <span>&bull; Period: {req.period}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusPill rawValue={req.status} type="status" />
                      {isExpired && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold">
                          EXPIRED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-[#0F172A] block">Stated Purpose:</span>
                    <p className="text-[#64748B] italic bg-white p-2.5 rounded-lg border border-gray-200">
                      &ldquo;{req.purpose}&rdquo;
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[#64748B] font-medium">Requested Documents:</span>
                    {requestedCats.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-md bg-white border border-[#E6E9EF] font-mono text-[11px] text-[#0F172A] font-semibold"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Actions / Results */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E6E9EF]">
                    <div className="text-[11px] text-[#64748B]">
                      Requested: {new Date(req.createdAt).toLocaleDateString()}
                    </div>

                    {req.status === "PENDING" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openRejectModal(req)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => openApproveModal(req)}
                          className="px-3.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
                        >
                          Approve Evidence Pack
                        </button>
                      </div>
                    )}

                    {req.status === "APPROVED" && req.downloadToken && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-emerald-700 font-semibold">
                          Downloads: {req.downloadCount}
                        </span>
                        <button
                          onClick={() => copyDownloadLink(req.downloadToken!)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E6E9EF] hover:bg-gray-50 text-xs font-semibold text-[#0F172A] transition-colors"
                        >
                          {copiedToken === req.downloadToken ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#64748B]" />
                              <span>Copy 7-Day Expiring Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {req.status === "REJECTED" && (
                      <div className="text-[11px] text-red-700 italic">
                        Declined: &ldquo;{req.rejectionReason}&rdquo;
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* APPROVE MODAL */}
      {selectedReq && actionType === "APPROVE" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="border-b border-[#E6E9EF] pb-3">
              <h3 className="text-base font-bold text-[#0F172A]">
                Approve Evidence Pack Disclosure
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Recipient: <strong>{selectedReq.requesterName}</strong> ({selectedReq.requesterEmail})
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <span className="font-semibold text-[#0F172A] block">
                Select Categories to Include in Package:
              </span>
              {["BANK_STATEMENT", "LEDGER", "INVOICE_REGISTER"].map((cat) => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, cat]);
                      } else {
                        setSelectedCategories(selectedCategories.filter((c) => c !== cat));
                      }
                    }}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span className="font-mono text-xs">{cat}</span>
                </label>
              ))}

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                A signed download link will be created, valid for <strong>exactly 7 days</strong>. Access is audited upon every download.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E9EF]">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-[#64748B] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedCategories.length === 0 || submitting}
                onClick={handleDecision}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
              >
                {submitting ? "Approving..." : "Authorize & Generate Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {selectedReq && actionType === "REJECT" && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="border-b border-[#E6E9EF] pb-3">
              <h3 className="text-base font-bold text-red-600">
                Reject Evidence Request
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Recipient: <strong>{selectedReq.requesterName}</strong>
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-[#0F172A] block">
                Internal Rejection Note:
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full text-xs text-[#0F172A] p-2.5 rounded-xl border border-[#E6E9EF] focus:outline-none focus:ring-1 focus:ring-red-500"
              />
              <p className="text-[11px] text-[#64748B]">
                The requester will see a generic &ldquo;request not granted&rdquo; message.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E9EF]">
              <button
                type="button"
                onClick={() => {
                  setSelectedReq(null);
                  setActionType(null);
                }}
                className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-[#64748B] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleDecision}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
              >
                {submitting ? "Rejecting..." : "Decline Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
