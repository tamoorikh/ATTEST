"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  PenTool,
  ShieldAlert,
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  FileCheck2,
  Lock,
  RotateCcw,
} from "lucide-react";
import { StatusPill } from "@/components/ui/StatusPill";
import { SealBadge } from "@/components/ui/SealBadge";
import { formatEnumLabel } from "@/lib/labels";
import { ATTEST_SCOPE_LANGUAGE, ATTEST_SIGNATURE_DISCLAIMER } from "@/lib/certificate";

interface Gate {
  id: string;
  name: string;
  status: "PASS" | "BLOCKED";
  reason: string;
}

interface DisclosedLimitation {
  exceptionId: string;
  title: string;
  severity: string;
  status: string;
  clientTreatment?: string;
  caTreatment?: string;
}

interface GatesResponse {
  canIssue: boolean;
  gates: Gate[];
  level: number;
  levelTitle: string;
  levelSummary: string;
  coveragePercent: number;
  procedures: string[];
  disclosedLimitations: DisclosedLimitation[];
}

interface IssuedCertificate {
  id: string;
  publicId: string;
  level: string;
  status: string;
  payloadHash: string;
  signature: string;
  version: number;
  issuedAt: string;
  supersededById?: string;
  revokedAt?: string;
  revocationReason?: string;
}

export default function CASignOffChamber() {
  const [period, setPeriod] = useState("2026-04");
  const [caConclusion, setCaConclusion] = useState(
    "In our professional judgment as licensed Chartered Accountants, all material reconciliation discrepancies for April 2026 have been satisfactorily resolved with verifiable corroboration."
  );
  const [gatesData, setGatesData] = useState<GatesResponse | null>(null);
  const [latestCert, setLatestCert] = useState<IssuedCertificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmScopeChecked, setConfirmScopeChecked] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [revocationReason, setRevocationReason] = useState("");
  const [copied, setCopied] = useState(false);

  async function fetchGates() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(
        `/api/certificates/gates?period=${encodeURIComponent(period)}&conclusion=${encodeURIComponent(
          caConclusion
        )}`
      );
      if (!res.ok) throw new Error("Failed to evaluate pre-issuance gates");
      const data = await res.json();
      setGatesData(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error evaluating gates");
    } finally {
      setLoading(false);
    }
  }

  async function fetchLatestCertificate() {
    try {
      const res = await fetch(`/api/certificates/gates?period=${encodeURIComponent(period)}`);
      // We can also check existing certificates from an endpoint or reuse
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    fetchGates();
  }, [period]);

  // Re-evaluate Gate 4 whenever conclusion text changes
  useEffect(() => {
    if (!gatesData) return;
    const len = caConclusion.trim().length;
    const updatedGates = gatesData.gates.map((g) => {
      if (g.id === "GATE_4_CA_CONCLUSION") {
        if (len < 50) {
          return {
            ...g,
            status: "BLOCKED" as const,
            reason: `CA professional conclusion note requires at least 50 characters (currently ${len} characters).`,
          };
        } else {
          return {
            ...g,
            status: "PASS" as const,
            reason: `Professional conclusion note documented (${len} characters).`,
          };
        }
      }
      return g;
    });

    const hasBlocked = updatedGates.some((g) => g.status === "BLOCKED");
    setGatesData({
      ...gatesData,
      gates: updatedGates,
      canIssue: !hasBlocked,
    });
  }, [caConclusion]);

  async function handleSignAndIssue() {
    if (!gatesData?.canIssue || !confirmScopeChecked) return;
    setIssuing(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/certificates/sign-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          period,
          caConclusion,
          confirmScope: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || (data.blockedReasons ? data.blockedReasons.join("; ") : "Issuance rejected"));
      }

      setLatestCert(data.certificate);
      setShowConfirmModal(false);
      setSuccessMsg(`Certificate ${data.certificate.publicId} successfully signed and issued!`);
      await fetchGates();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to sign certificate");
    } finally {
      setIssuing(false);
    }
  }

  async function handleRevokeCertificate() {
    if (!latestCert || revocationReason.trim().length < 20) return;
    setRevoking(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/certificates/${latestCert.id}/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: revocationReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to revoke certificate");

      setLatestCert(data.certificate);
      setShowRevokeModal(false);
      setSuccessMsg(`Certificate ${data.certificate.publicId} has been revoked.`);
      await fetchGates();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to revoke");
    } finally {
      setRevoking(false);
    }
  }

  function copyPublicUrl() {
    if (!latestCert) return;
    const url = `${window.location.origin}/verify/${latestCert.publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const blockedGates = gatesData?.gates.filter((g) => g.status === "BLOCKED") || [];
  const openHighGate = gatesData?.gates.find((g) => g.id === "GATE_3_NO_HIGH_EXCEPTIONS");

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            CA Signing &amp; Certification Chamber
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Server-enforced pre-issuance gate checklist, professional conclusion, and HMAC-SHA256 signing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="periodSelect" className="text-xs font-semibold text-[#64748B]">Period:</label>
          <select
            id="periodSelect"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="text-xs font-mono font-semibold bg-white border border-[#E6E9EF] rounded-lg px-2.5 py-1.5 text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          >
            <option value="2026-04">April 2026 (2026-04)</option>
            <option value="2026-05">May 2026 (2026-05)</option>
          </select>
          <button
            onClick={fetchGates}
            disabled={loading}
            className="p-1.5 rounded-lg border border-[#E6E9EF] bg-white hover:bg-[#F7F8FA] text-[#64748B] transition-colors"
            title="Refresh Gates"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mandatory Development-Mode Integrity Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block uppercase tracking-wide text-[10px] text-amber-800">
            Mandatory Integrity Classification Notice
          </span>
          <span className="mt-0.5 block leading-relaxed">
            Every certificate issued in this environment is cryptographically signed with integrity classification:{" "}
            <strong className="font-mono text-amber-950">&ldquo;{ATTEST_SIGNATURE_DISCLAIMER}&rdquo;</strong>.
            Signatures prove deterministic engine execution and tamper-evident auditability, not a statutory audit.
          </span>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-900 flex items-start gap-2.5">
          <XCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{errorMsg}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      {/* SECTION A: PRE-ISSUANCE SIGN-OFF GATES CHECKLIST */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#2563EB]" />
              Pre-Issuance Sign-Off Gates
            </h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              5 server-enforced validation gates must strictly pass before digital sign-off can occur.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              id="gatesStatusBadge"
              className={`text-xs font-bold px-3 py-1 rounded-full border ${
                gatesData?.canIssue
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              {gatesData?.canIssue ? "ALL GATES PASSED" : `${blockedGates.length} GATE(S) BLOCKED`}
            </span>
          </div>
        </div>

        {/* Gates List */}
        <div className="space-y-3" id="gatesList">
          {gatesData?.gates.map((gate, idx) => (
            <div
              key={gate.id}
              className={`p-4 rounded-xl border transition-all ${
                gate.status === "PASS"
                  ? "bg-emerald-50/40 border-emerald-200"
                  : "bg-red-50/50 border-red-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0">
                    {gate.status === "PASS" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#64748B]">Gate {idx + 1}</span>
                      <span className="text-sm font-bold text-[#0F172A]">{gate.name}</span>
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${gate.status === "PASS" ? "text-emerald-900" : "text-red-900 font-medium"}`}>
                      {gate.reason}
                    </p>
                    {gate.id === "GATE_3_NO_HIGH_EXCEPTIONS" && gate.status === "BLOCKED" && (
                      <div className="mt-2.5">
                        <Link
                          href="/ca/exceptions"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors"
                        >
                          Resolve Open Exceptions in CA Review Desk &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                </div>

                <span
                  className={`text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide shrink-0 ${
                    gate.status === "PASS"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {gate.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gate 4 Input: CA Professional Conclusion Note */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">
              Gate 4: CA Professional Conclusion Note (Required)
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enter your professional conclusion on the engagement (minimum 50 characters).
            </p>
          </div>
          <span
            className={`text-xs font-mono font-bold ${
              caConclusion.trim().length >= 50 ? "text-emerald-600" : "text-amber-600"
            }`}
          >
            {caConclusion.trim().length} / 50 min chars
          </span>
        </div>

        <textarea
          rows={3}
          value={caConclusion}
          onChange={(e) => setCaConclusion(e.target.value)}
          placeholder="Enter detailed professional conclusion note regarding arithmetic continuity, reconciliation testing, and exception treatment..."
          className="w-full text-xs text-[#0F172A] p-3 rounded-xl border border-[#E6E9EF] focus:outline-none focus:ring-1 focus:ring-[#2563EB] leading-relaxed"
        />
      </div>

      {/* Disclosed Limitations Card */}
      {gatesData?.disclosedLimitations && gatesData.disclosedLimitations.length > 0 && (
        <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-[#E6E9EF] pb-3">
            <h3 className="text-sm font-bold text-[#0F172A]">
              Disclosed Limitations ({gatesData.disclosedLimitations.length})
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Low/Medium and waived items included transparently on every certificate surface.
            </p>
          </div>

          <div className="space-y-2">
            {gatesData.disclosedLimitations.map((lim, idx) => (
              <div
                key={lim.exceptionId || idx}
                className="p-3 bg-[#F7F8FA] border border-[#E6E9EF] rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">{lim.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">
                    {lim.severity}
                  </span>
                </div>
                <div className="text-[#64748B] text-[11px]">
                  <strong>Client submission:</strong> {lim.clientTreatment} &bull; <strong>CA treatment:</strong> {lim.caTreatment}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign-Off Action Bar */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-[#64748B]">Assurance Signatory:</div>
          <div className="font-bold text-sm text-[#0F172A]">Ayesha Siddiqui, FCA</div>
          <div className="text-xs text-[#64748B] font-mono">Licensed Chartered Accountant &bull; ICAP-49102</div>
        </div>

        <button
          type="button"
          id="btnOpenSignModal"
          disabled={!gatesData?.canIssue || loading}
          onClick={() => setShowConfirmModal(true)}
          className="px-6 py-3 rounded-xl bg-[#2563EB] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm shrink-0"
        >
          <PenTool className="w-4 h-4" />
          <span>Review &amp; Apply Digital Signature</span>
        </button>
      </div>

      {/* If a certificate was issued or exists */}
      {latestCert && (
        <div className="bg-white/92 backdrop-blur-md border border-[#CBE6D8] rounded-[20px] p-6 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] space-y-4 rise">
          <div className="flex items-center justify-between border-b border-[#F1EFE9] pb-4">
            <div className="flex items-center gap-3">
              <SealBadge size={54} />
              <div>
                <span className="font-heading font-extrabold text-base text-[#17161A] block">
                  Active Trust Certificate Issued
                </span>
                <span className="text-xs text-[#6E6A61]">
                  Signed by licensed CA &bull; Publicly verifiable
                </span>
              </div>
            </div>
            <StatusPill rawValue={latestCert.status} type="status" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[#A8A296] block text-[10px] uppercase font-bold tracking-wider">Public Identifier</span>
              <span className="font-mono font-bold text-sm text-[#4F46E5] mt-0.5 block">{latestCert.publicId}</span>
            </div>
            <div>
              <span className="text-[#A8A296] block text-[10px] uppercase font-bold tracking-wider">Payload SHA-256 Hash</span>
              <span className="font-mono text-xs text-[#17161A] mt-0.5 block truncate">{latestCert.payloadHash}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[#F1EFE9]">
            <button
              onClick={copyPublicUrl}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E9E6DF] hover:bg-[#F1EFE9] text-xs font-semibold text-[#17161A] transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#188A54]" /> : <Copy className="w-3.5 h-3.5 text-[#6E6A61]" />}
              <span>{copied ? "Copied URL!" : "Copy Public URL"}</span>
            </button>

            <Link
              href={`/verify/${latestCert.publicId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors shadow-sm"
            >
              <span>Open in Public Verifier</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {latestCert.status === "ISSUED" && (
              <button
                onClick={() => setShowRevokeModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#F2CBC8] text-[#C0362C] hover:bg-[#FBECEA] text-xs font-semibold transition-colors ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Revoke Certificate</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* DELIBERATE TWO-STEP CONFIRMATION MODAL */}
      {showConfirmModal && gatesData && (
        <div className="fixed inset-0 z-50 bg-[#17161A]/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[22px] max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl rise">
            <div className="border-b border-[#E9E6DF] pb-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#4F46E5] tracking-wider block">
                  Final Attestation Step 2 of 2
                </span>
                <h2 className="font-heading text-xl font-bold text-[#17161A] mt-1">
                  Confirm &amp; Issue Continuous Assurance Certificate
                </h2>
              </div>
              <SealBadge size={62} />
            </div>

            {/* Scope & Details Summary */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-4 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
                <div>
                  <span className="text-[#6E6A61] block text-[10px] uppercase font-semibold">Organization</span>
                  <span className="font-bold text-[#17161A] mt-0.5 block">Meridian Textiles (Pvt) Ltd</span>
                </div>
                <div>
                  <span className="text-[#6E6A61] block text-[10px] uppercase font-semibold">Period</span>
                  <span className="font-mono font-bold text-[#17161A] mt-0.5 block">{period}</span>
                </div>
                <div>
                  <span className="text-[#6E6A61] block text-[10px] uppercase font-semibold">Assurance Level</span>
                  <span className="font-bold text-[#4F46E5] mt-0.5 block">{gatesData.levelTitle}</span>
                </div>
                <div>
                  <span className="text-[#6E6A61] block text-[10px] uppercase font-semibold">Reconciled Coverage</span>
                  <span className="font-bold text-[#188A54] mt-0.5 block">{gatesData.coveragePercent}%</span>
                </div>
              </div>

              {/* Procedures Performed */}
              <div>
                <span className="font-bold text-[#0F172A] block mb-1.5">Procedures Performed:</span>
                <ul className="list-disc list-inside space-y-1 text-[#64748B] text-[11.5px] bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {gatesData.procedures.map((p, idx) => (
                    <li key={idx} className="leading-relaxed">{p}</li>
                  ))}
                </ul>
              </div>

              {/* Exact Scope Language */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950">
                <span className="font-bold block text-[11px] uppercase tracking-wider text-blue-900">
                  Mandatory Statutory Scope Notice (ATTEST.md)
                </span>
                <p className="mt-1 text-xs font-mono font-medium leading-relaxed">
                  &ldquo;{ATTEST_SCOPE_LANGUAGE}&rdquo;
                </p>
              </div>

              {/* Development Mode Notice */}
              <div className="text-[11px] text-[#64748B] italic">
                Signature Mode: <strong>{ATTEST_SIGNATURE_DISCLAIMER}</strong>.
              </div>

              {/* Mandatory Checkbox */}
              <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  id="chkConfirmScope"
                  checked={confirmScopeChecked}
                  onChange={(e) => setConfirmScopeChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-xs text-[#0F172A] leading-relaxed font-medium">
                  I confirm that I am a licensed Chartered Accountant (ICAP), have reviewed the deterministic procedures and disclosed limitations, and hereby authorize the cryptographic signing and issuance of this certificate.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E6E9EF]">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-[#64748B] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btnConfirmIssuance"
                disabled={!confirmScopeChecked || issuing}
                onClick={handleSignAndIssue}
                className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm flex items-center gap-2"
              >
                <PenTool className="w-4 h-4" />
                <span>{issuing ? "Signing..." : "Confirm & Cryptographically Sign"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOCATION MODAL */}
      {showRevokeModal && latestCert && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="border-b border-[#E6E9EF] pb-3">
              <h2 className="text-lg font-bold text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Revoke Assurance Certificate
              </h2>
              <p className="text-xs text-[#64748B] mt-1 font-mono">
                Certificate ID: {latestCert.publicId}
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-[#64748B] leading-relaxed">
                Revocation is permanent and immediately reflected on the Public Verifier. Nothing is deleted from the immutable audit trail.
              </p>

              <div>
                <label className="font-semibold text-[#0F172A] block mb-1">
                  Mandatory Revocation Reason (min 20 characters):
                </label>
                <textarea
                  rows={3}
                  id="txtRevocationReason"
                  value={revocationReason}
                  onChange={(e) => setRevocationReason(e.target.value)}
                  placeholder="State the professional or compliance reason for revoking this certificate..."
                  className="w-full text-xs text-[#0F172A] p-2.5 rounded-xl border border-[#E6E9EF] focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <span
                  className={`text-[11px] font-mono font-medium ${
                    revocationReason.trim().length >= 20 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {revocationReason.trim().length} / 20 min characters
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E6E9EF]">
              <button
                type="button"
                onClick={() => setShowRevokeModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E6E9EF] text-xs font-semibold text-[#64748B] hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btnConfirmRevocation"
                disabled={revocationReason.trim().length < 20 || revoking}
                onClick={handleRevokeCertificate}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors shadow-sm"
              >
                {revoking ? "Revoking..." : "Confirm Revocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
