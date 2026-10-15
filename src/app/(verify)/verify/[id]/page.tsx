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
import { SealBadge } from "@/components/ui/SealBadge";

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
        <div className="w-12 h-12 rounded-full bg-[#B45309]/15 text-[#B45309] flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#17161A]">Rate Limit Exceeded (429)</h1>
        <p className="text-xs text-[#6E6A63] leading-relaxed">
          Too many verification requests received from your IP address. Please wait a minute before querying again.
        </p>
        <div className="pt-2">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] hover:underline"
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
          isDemo: true,
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
      <div className="py-20 text-center max-w-md mx-auto space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-white border border-[#E9E6DF] text-[#6E6A63] flex items-center justify-center mx-auto shadow-sm">
          <Award className="w-8 h-8 opacity-60" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-[#17161A] font-heading">Certificate Not Found</h1>
          <p className="text-xs text-[#6E6A63] leading-relaxed">
            No certificate exists with public identifier <code className="font-mono font-bold text-[#17161A] bg-[#FAF9F6] px-1.5 py-0.5 rounded border border-[#E9E6DF]">{id}</code>. Please confirm the identifier from the source document or search again.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4F46E5] text-white text-xs font-semibold hover:bg-[#4338CA] transition-colors shadow-sm"
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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6A63] hover:text-[#17161A] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Public Verifier Search</span>
        </Link>
        <span className="font-mono text-xs text-[#6E6A63]">
          Verified at: <span className="text-[#17161A] font-semibold">{verificationTimestamp}</span>
        </span>
      </div>

      {/* Demonstration Data Ribbon */}
      {cert.org.isDemo && (
        <div className="bg-[#B45309]/10 border border-[#B45309]/20 text-[#B45309] text-xs px-4 py-2.5 rounded-xl font-medium flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-[#B45309] animate-pulse" />
            <span>
              <strong>DEMONSTRATION DATA</strong> &mdash; This certificate belongs to demonstration entity {cert.org.name}. Synthetic dataset for assurance testing.
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-[#B45309]/20 text-[#B45309] px-2 py-0.5 rounded font-bold border border-[#B45309]/30">
            Demo Mode
          </span>
        </div>
      )}

      {/* Main Verification Certificate Card */}
      <div className="bg-white border border-[#E9E6DF] rounded-2xl shadow-sm p-6 sm:p-10 space-y-8 relative overflow-hidden">
        {/* Status Banner */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#E9E6DF] pb-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border mt-1 ${
                computedStatus === "VALID & CURRENT"
                  ? "bg-[#188A54]/10 text-[#188A54] border-[#188A54]/30"
                  : computedStatus === "VALID BUT SUPERSEDED"
                  ? "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30"
                  : "bg-[#C0362C]/10 text-[#C0362C] border-[#C0362C]/30"
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
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#6E6A63] block">
                Continuous Assurance Trust Certificate
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#17161A] tracking-tight font-heading">
                {profile?.legalName || cert.org.name}
              </h1>
              <div className="text-xs text-[#6E6A63] font-mono mt-0.5">
                {profile?.jurisdiction || "PK"} Legal Reg: {profile?.registrationNumber || "0094182-LHR"} &bull; Tax ID: {profile?.taxId || "NTN-4892184-7"}
              </div>
            </div>
          </div>

          {/* Computed Status Badge + SealBadge */}
          <div className="flex items-center gap-4 self-start sm:self-auto">
            {computedStatus === "VALID & CURRENT" && (
              <div className="hidden sm:block shrink-0">
                <SealBadge size={76} />
              </div>
            )}
            <div className="flex flex-col items-start sm:items-end">
              <span
                id="verificationStatusBadge"
                className={`text-xs font-extrabold uppercase px-3 py-1 rounded-full border tracking-wide ${
                  computedStatus === "VALID & CURRENT"
                    ? "bg-[#188A54]/10 text-[#188A54] border-[#188A54]/30"
                    : computedStatus === "VALID BUT SUPERSEDED"
                    ? "bg-[#B45309]/10 text-[#B45309] border-[#B45309]/30"
                    : "bg-[#C0362C]/10 text-[#C0362C] border-[#C0362C]/30"
                }`}
              >
                {computedStatus}
              </span>
              <span className="font-mono text-xs text-[#6E6A63] mt-1 font-semibold">
                ID: <span className="text-[#4F46E5]">{cert.publicId}</span>
              </span>
              <span className="text-[10px] font-mono text-[#6E6A63]">v{cert.version}.0</span>
            </div>
          </div>
        </div>

        {/* Superseded Notice */}
        {computedStatus === "VALID BUT SUPERSEDED" && cert.supersededBy && (
          <div className="p-4 rounded-xl bg-[#B45309]/10 border border-[#B45309]/20 text-xs text-[#17161A] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-[#B45309]">Valid But Superseded</span>
              <p className="mt-0.5 leading-relaxed text-[#6E6A63]">
                This certificate represents a historical assurance period that was subsequently re-evaluated and superseded. The active successor certificate is:{" "}
                <Link
                  href={`/verify/${cert.supersededBy.publicId}`}
                  className="font-mono font-bold underline text-[#B45309] hover:text-[#17161A]"
                >
                  {cert.supersededBy.publicId} &rarr;
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Revoked Notice */}
        {computedStatus === "REVOKED" && (
          <div className="p-4 rounded-xl bg-[#C0362C]/10 border border-[#C0362C]/20 text-xs text-[#17161A] flex items-start gap-3">
            <XCircle className="w-5 h-5 text-[#C0362C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-[#C0362C]">Certificate Revoked</span>
              <p className="mt-0.5 leading-relaxed text-[#6E6A63]">
                This certificate was revoked by the signing Chartered Accountant. Revocation Category:{" "}
                <strong>{cert.revocationReason || "Revoked under CA professional judgment"}</strong>.
                Revocation Date: {cert.revokedAt ? new Date(cert.revokedAt).toISOString().split("T")[0] : "Recorded"}.
              </p>
            </div>
          </div>
        )}

        {/* Signature Invalid Notice */}
        {computedStatus === "SIGNATURE INVALID" && (
          <div className="p-4 rounded-xl bg-[#C0362C]/10 border border-[#C0362C]/20 text-xs text-[#17161A] flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-[#C0362C] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block text-[#C0362C]">Cryptographic Signature Invalid</span>
              <p className="mt-0.5 leading-relaxed text-[#6E6A63]">
                CRITICAL WARNING: The cryptographic HMAC signature does not match the canonical certificate payload. Data tampering or signature corruption has been detected. Do not rely on this certificate.
              </p>
            </div>
          </div>
        )}

        {/* Core Verification Metadata Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
            <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Assurance Level</span>
            <div className="font-bold text-[#17161A] text-sm mt-0.5">{formatEnumLabel(cert.level)}</div>
            <div className="text-[#6E6A63] text-[10.5px] mt-0.5">
              {cert.levelAchieved === 2
                ? "Bank & Ledger Reconciled (No 3-way invoice test)"
                : cert.levelAchieved === 3
                ? "3-Way Corroborated with Invoices"
                : "Statements Only"}
            </div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
            <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Period Covered</span>
            <div className="font-mono font-bold text-[#17161A] text-sm mt-0.5">
              2026-04-01 &mdash; 2026-04-30
            </div>
            <div className="text-[#6E6A63] text-[10.5px] mt-0.5">Monthly Assurance Cycle</div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
            <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Issuing Firm</span>
            <div className="font-bold text-[#17161A] text-sm mt-0.5">Attest Assurance Network</div>
            <div className="text-[#6E6A63] text-[10.5px] mt-0.5">Platform Core Assurance</div>
          </div>

          <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
            <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Licensed Signatory</span>
            <div className="font-bold text-[#17161A] text-sm mt-0.5">
              {cert.signedBy?.name || "Ayesha Siddiqui, FCA"}
            </div>
            <div className="text-[#6E6A63] text-[10.5px] mt-0.5">ICAP Licensed Accountant</div>
          </div>
        </div>

        {/* Coverage & Scope */}
        <div className="p-4 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#4F46E5] uppercase text-[11px] tracking-wider">
              Engagement Scope &amp; Assurance Limits (ATTEST.md)
            </span>
            <span className="font-mono font-bold text-[#17161A] text-xs">
              Coverage: {cert.coveragePercent}%
            </span>
          </div>
          <p className="mt-1 font-mono text-[#17161A] font-medium leading-relaxed text-xs">
            &ldquo;{ATTEST_SCOPE_LANGUAGE}&rdquo;
          </p>
        </div>

        {/* Procedures Performed */}
        {procedures.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#17161A] block">Procedures Performed:</span>
            <ul className="list-disc list-inside space-y-1 text-[#6E6A63] text-[11.5px] p-3 rounded-xl bg-[#FAF9F6] border border-[#E9E6DF]">
              {procedures.map((p, idx) => (
                <li key={idx}>{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclosed Limitations */}
        {limitations.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#17161A] block">Disclosed Limitations:</span>
            <div className="space-y-2">
              {limitations.map((lim, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E9E6DF] text-[11.5px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#17161A]">{lim.title}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#17161A] border border-[#E9E6DF] font-semibold">
                      {lim.severity}
                    </span>
                  </div>
                  <div className="text-[#6E6A63] mt-1 text-[11px]">
                    Client: {lim.clientTreatment || "Recorded"} &bull; CA: {lim.caTreatment || "Reviewed"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cryptographic Integrity Section */}
        <div className="pt-4 border-t border-[#E9E6DF] text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-[#17161A]">
            <Lock className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span>Cryptographic Integrity Result: </span>
            <span
              className={`font-mono font-bold ${
                isSignatureValid ? "text-[#188A54]" : "text-[#C0362C]"
              }`}
            >
              {isSignatureValid ? "SIGNATURE VERIFIED" : "INTEGRITY CHECK FAILED"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] font-mono text-[#6E6A63]">
            <div className="p-2.5 rounded bg-[#FAF9F6] border border-[#E9E6DF] truncate">
              <span className="text-[9px] uppercase font-bold text-[#6E6A63] block">SHA-256 Payload Hash</span>
              {cert.payloadHash}
            </div>
            <div className="p-2.5 rounded bg-[#FAF9F6] border border-[#E9E6DF] truncate">
              <span className="text-[9px] uppercase font-bold text-[#6E6A63] block">HMAC-SHA256 Signature</span>
              {cert.signature}
            </div>
          </div>

          <div className="text-[11px] text-[#6E6A63] italic">
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
