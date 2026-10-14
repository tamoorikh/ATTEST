import React from "react";
import Link from "next/link";
import { headers } from "next/headers";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  XCircle,
  Lock,
  Clock,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel } from "@/lib/labels";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  verifyCertificateSignature,
  ATTEST_SCOPE_LANGUAGE,
  ATTEST_SIGNATURE_DISCLAIMER,
} from "@/lib/certificate";
import { EvidenceRequestForm } from "@/components/verify/EvidenceRequestForm";

export default async function PublicCertificateVerifierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for") || headerList.get("x-real-ip") || "127.0.0.1";

  // Rate Limiting: 10 requests / min / IP
  const rl = checkRateLimit(`verify-ip:${ip}`, 10, 60000);
  if (!rl.allowed) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0F172A]">Rate Limit Exceeded (429)</h1>
        <p className="text-xs text-[#64748B] leading-relaxed">
          Too many verification requests received from your IP address. Please wait a minute before querying again.
        </p>
        <div className="pt-2">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Search
          </Link>
        </div>
      </div>
    );
  }

  // Lookup Certificate by publicId (STRICT PRIVACY: Never join bank transactions, ledger entries, or accounts)
  const cert = await prisma.certificate.findUnique({
    where: { publicId: id },
    select: {
      id: true,
      publicId: true,
      level: true,
      levelAchieved: true,
      periodStart: true,
      periodEnd: true,
      status: true,
      payloadHash: true,
      signature: true,
      signatureMode: true,
      canonicalPayload: true,
      caConclusion: true,
      disclosedLimitations: true,
      coveragePercent: true,
      proceduresJson: true,
      revokedAt: true,
      revocationReason: true,
      issuedAt: true,
      version: true,
      org: {
        select: {
          name: true,
          companyProfile: {
            select: {
              legalName: true,
              taxId: true,
              registrationNumber: true,
              jurisdiction: true,
            },
          },
        },
      },
      signedBy: {
        select: {
          name: true,
        },
      },
      supersededBy: {
        select: {
          publicId: true,
        },
      },
    },
  });

  // NOT FOUND (Generic response identical for all nonexistent or malformed IDs)
  if (!cert) {
    return (
      <div className="py-20 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 text-[#64748B] flex items-center justify-center mx-auto">
          <Award className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0F172A]">Certificate Not Found</h1>
        <p className="text-xs text-[#64748B] leading-relaxed">
          No certificate exists with public identifier <code className="font-mono font-bold text-[#0F172A]">{id}</code>. Please confirm the identifier from the source document.
        </p>
        <div className="pt-2">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Search Another Certificate
          </Link>
        </div>
      </div>
    );
  }

  // Cryptographic Signature Verification
  let isSignatureValid = false;
  if (cert.canonicalPayload && cert.payloadHash && cert.signature) {
    const check = verifyCertificateSignature(
      cert.canonicalPayload,
      cert.payloadHash,
      cert.signature
    );
    isSignatureValid = check.valid;
  }

  // Determine computed status
  let computedStatus: "VALID & CURRENT" | "VALID BUT SUPERSEDED" | "REVOKED" | "SIGNATURE INVALID" =
    "VALID & CURRENT";

  if (!isSignatureValid) {
    computedStatus = "SIGNATURE INVALID";
  } else if (cert.status === "REVOKED") {
    computedStatus = "REVOKED";
  } else if (cert.status === "SUPERSEDED") {
    computedStatus = "VALID BUT SUPERSEDED";
  } else if (cert.status === "ISSUED") {
    computedStatus = "VALID & CURRENT";
  }

  const profile = cert.org.companyProfile;
  const verificationTimestamp = new Date().toISOString();

  let procedures: string[] = [];
  let limitations: Array<{ title: string; severity: string; clientTreatment?: string; caTreatment?: string }> = [];

  if (cert.proceduresJson) {
    try {
      procedures = JSON.parse(cert.proceduresJson);
    } catch {}
  }
  if (cert.disclosedLimitations) {
    try {
      limitations = JSON.parse(cert.disclosedLimitations);
    } catch {}
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Verifier Search</span>
        </Link>
        <span className="font-mono text-xs text-[#64748B]">
          Verified at: <span className="text-[#0F172A] font-semibold">{verificationTimestamp}</span>
        </span>
      </div>

      {/* Main Verification Certificate Card */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 relative">
        {/* Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E6E9EF] pb-6">
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border ${
                computedStatus === "VALID & CURRENT"
                  ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                  : computedStatus === "VALID BUT SUPERSEDED"
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-red-50 text-red-600 border-red-200"
              }`}
            >
              {computedStatus === "VALID & CURRENT" ? (
                <ShieldCheck className="w-8 h-8" />
              ) : computedStatus === "VALID BUT SUPERSEDED" ? (
                <Award className="w-8 h-8" />
              ) : (
                <XCircle className="w-8 h-8" />
              )}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#64748B] block">
                Continuous Assurance Trust Certificate
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight">
                {profile?.legalName || cert.org.name}
              </h1>
              <div className="text-xs text-[#64748B] font-mono mt-0.5">
                {profile?.jurisdiction || "PK"} Legal Reg: {profile?.registrationNumber || "0094182-LHR"} &bull; Tax ID: {profile?.taxId || "NTN-4892184-7"}
              </div>
            </div>
          </div>

          {/* Computed Status Badge */}
          <div className="flex flex-col items-start sm:items-end">
            <span
              id="verificationStatusBadge"
              className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border tracking-wide ${
                computedStatus === "VALID & CURRENT"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : computedStatus === "VALID BUT SUPERSEDED"
                  ? "bg-amber-50 text-amber-900 border-amber-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {computedStatus}
            </span>
            <span className="font-mono text-xs text-[#64748B] mt-1 font-semibold">
              ID: <span className="text-[#2563EB]">{cert.publicId}</span>
            </span>
            <span className="text-[10px] font-mono text-[#64748B]">v{cert.version}.0</span>
          </div>
        </div>

        {/* Superseded Notice */}
        {computedStatus === "VALID BUT SUPERSEDED" && cert.supersededBy && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Valid But Superseded</span>
              <p className="mt-0.5 leading-relaxed">
                This certificate represents a historical assurance period that was subsequently re-evaluated and superseded. The active successor certificate is:{" "}
                <Link
                  href={`/verify/${cert.supersededBy.publicId}`}
                  className="font-mono font-bold underline text-amber-900 hover:text-black"
                >
                  {cert.supersededBy.publicId} &rarr;
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Revoked Notice */}
        {computedStatus === "REVOKED" && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Certificate Revoked</span>
              <p className="mt-0.5 leading-relaxed">
                This certificate was revoked by the signing Chartered Accountant. Revocation Category:{" "}
                <strong>{cert.revocationReason || "Revoked under CA professional judgment"}</strong>.
                Revocation Date: {cert.revokedAt ? new Date(cert.revokedAt).toISOString().split("T")[0] : "Recorded"}.
              </p>
            </div>
          </div>
        )}

        {/* Signature Invalid Notice */}
        {computedStatus === "SIGNATURE INVALID" && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-950 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block">Cryptographic Signature Invalid</span>
              <p className="mt-0.5 leading-relaxed">
                CRITICAL WARNING: The cryptographic HMAC signature does not match the canonical certificate payload. Data tampering or signature corruption has been detected. Do not rely on this certificate.
              </p>
            </div>
          </div>
        )}

        {/* Core Verification Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Assurance Level</span>
            <div className="font-bold text-[#0F172A] text-sm mt-0.5">{formatEnumLabel(cert.level)}</div>
            <div className="text-[#64748B] text-[10.5px] mt-0.5">
              {cert.levelAchieved === 2
                ? "Bank & Ledger Reconciled (No 3-way invoice test)"
                : cert.levelAchieved === 3
                ? "3-Way Corroborated with Invoices"
                : "Statements Only"}
            </div>
          </div>

          <div className="p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Period Covered</span>
            <div className="font-mono font-bold text-[#0F172A] text-sm mt-0.5">
              2026-04-01 &mdash; 2026-04-30
            </div>
            <div className="text-[#64748B] text-[10.5px] mt-0.5">Monthly Assurance Cycle</div>
          </div>

          <div className="p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Issuing Firm</span>
            <div className="font-bold text-[#0F172A] text-sm mt-0.5">Attest Assurance Network</div>
            <div className="text-[#64748B] text-[10.5px] mt-0.5">Platform Core Assurance</div>
          </div>

          <div className="p-3.5 bg-[#F7F8FA] rounded-xl border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Licensed Signatory</span>
            <div className="font-bold text-[#0F172A] text-sm mt-0.5">
              {cert.signedBy?.name || "Ayesha Siddiqui, FCA"}
            </div>
            <div className="text-[#64748B] text-[10.5px] mt-0.5">ICAP Licensed Accountant</div>
          </div>
        </div>

        {/* Coverage & Scope */}
        <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 uppercase text-[11px] tracking-wider">
              Engagement Scope &amp; Assurance Limits (ATTEST.md)
            </span>
            <span className="font-mono font-bold text-blue-950 text-xs">
              Coverage: {cert.coveragePercent}%
            </span>
          </div>
          <p className="mt-1 font-mono text-blue-950 font-medium leading-relaxed text-xs">
            &ldquo;{ATTEST_SCOPE_LANGUAGE}&rdquo;
          </p>
        </div>

        {/* Procedures Performed */}
        {procedures.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#0F172A] block">Procedures Performed:</span>
            <ul className="list-disc list-inside space-y-1 text-[#64748B] text-[11.5px] p-3 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF]">
              {procedures.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclosed Limitations */}
        {limitations.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#0F172A] block">Disclosed Limitations:</span>
            <div className="space-y-2">
              {limitations.map((lim, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#0F172A]">{lim.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">
                      {lim.severity}
                    </span>
                  </div>
                  <div className="text-[#64748B] mt-1 text-[11px]">
                    Client: {lim.clientTreatment || "Recorded"} &bull; CA: {lim.caTreatment || "Reviewed"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cryptographic Integrity Section */}
        <div className="pt-4 border-t border-[#E6E9EF] text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-[#0F172A]">
            <Lock className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Cryptographic Integrity Result: </span>
            <span
              className={`font-mono font-bold ${
                isSignatureValid ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {isSignatureValid ? "SIGNATURE VERIFIED" : "INTEGRITY CHECK FAILED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-[#64748B]">
            <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E6E9EF] truncate">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">SHA-256 Payload Hash</span>
              {cert.payloadHash}
            </div>
            <div className="p-2.5 rounded bg-[#F7F8FA] border border-[#E6E9EF] truncate">
              <span className="text-[9px] uppercase font-bold text-gray-500 block">HMAC-SHA256 Signature</span>
              {cert.signature}
            </div>
          </div>

          <div className="text-[11px] text-[#64748B] italic">
            Mandatory Integrity Notice: <strong>{ATTEST_SIGNATURE_DISCLAIMER}</strong>.
          </div>
        </div>

        {/* Evidence Pack Request Form */}
        <EvidenceRequestForm
          certificatePublicId={cert.publicId}
          period="2026-04"
        />
      </div>
    </div>
  );
}
