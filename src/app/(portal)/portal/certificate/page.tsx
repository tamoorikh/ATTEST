import React from "react";
import Link from "next/link";
import { Award, ShieldCheck, ExternalLink, Printer, Download, Copy, Lock, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { SealBadge } from "@/components/ui/SealBadge";
import { ATTEST_SCOPE_LANGUAGE, ATTEST_SIGNATURE_DISCLAIMER } from "@/lib/certificate";
import { CertificateActions } from "@/components/certificate/CertificateActions";

export default async function ClientCertificatePage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      certificates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          signedBy: true,
          supersededBy: true,
        },
      },
      companyProfile: true,
    },
  });

  const cert = org?.certificates[0];
  const profile = org?.companyProfile;

  let procedures: string[] = [];
  let limitations: Array<{ title: string; severity: string; clientTreatment?: string; caTreatment?: string }> = [];

  if (cert?.proceduresJson) {
    try {
      procedures = JSON.parse(cert.proceduresJson);
    } catch {}
  }
  if (cert?.disclosedLimitations) {
    try {
      limitations = JSON.parse(cert.disclosedLimitations);
    } catch {}
  }

  // Build documented JSON schema for Download JSON
  const jsonExportData = cert
    ? {
        id: cert.publicId,
        org: profile?.legalName || org?.name,
        level: cert.level,
        levelAchieved: cert.levelAchieved,
        period: "2026-04-01 to 2026-04-30",
        scope: ATTEST_SCOPE_LANGUAGE,
        coveragePercent: cert.coveragePercent,
        procedures: procedures,
        limitations: limitations,
        signatory: {
          name: cert.signedBy?.name || "Ayesha Siddiqui, FCA",
          license: "ICAP-49102",
          title: "Senior Assurance Partner",
        },
        issuedAt: cert.issuedAt?.toISOString(),
        payloadHash: cert.payloadHash,
        signature: cert.signature,
        signatureMode: cert.signatureMode || "DEVELOPMENT",
        verifyUrl: `https://attest.pk/verify/${cert.publicId}`,
        disclaimer: ATTEST_SIGNATURE_DISCLAIMER,
      }
    : null;

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#17161A] font-heading">
            Continuous Assurance Certificate
          </h1>
          <p className="text-xs text-[#6E6A63] mt-1">
            Live cryptographic trust certificate verifiable by anyone on the public network without login.
          </p>
        </div>

        {cert?.publicId && (
          <CertificateActions
            publicId={cert.publicId}
            jsonExportData={jsonExportData}
          />
        )}
      </div>

      {!cert ? (
        <div className="card-glass border border-[#E9E6DF] rounded-2xl p-12 text-center space-y-3">
          <Award className="w-12 h-12 text-[#6E6A63] mx-auto opacity-50" />
          <h3 className="text-base font-bold text-[#17161A]">No Certificate Issued Yet</h3>
          <p className="text-xs text-[#6E6A63] max-w-md mx-auto">
            Your financial statements for the current period are awaiting CA review and digital sign-off.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status Alert if Revoked or Superseded */}
          {cert.status === "REVOKED" && (
            <div className="bg-[#C0362C]/10 border border-[#C0362C]/20 rounded-xl p-4 text-xs text-[#17161A] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C0362C] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-[#C0362C]">Certificate Revoked</span>
                <p className="mt-0.5 leading-relaxed text-[#6E6A63]">
                  This certificate has been revoked by the licensed Chartered Accountant. Reason:{" "}
                  <strong>{cert.revocationReason || "Revocation notice filed."}</strong>
                </p>
              </div>
            </div>
          )}

          {cert.status === "SUPERSEDED" && (
            <div className="bg-[#B45309]/10 border border-[#B45309]/20 rounded-xl p-4 text-xs text-[#17161A] flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#B45309] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-sm block text-[#B45309]">Certificate Superseded</span>
                <p className="mt-0.5 leading-relaxed text-[#6E6A63]">
                  This certificate was superseded by a re-issued certificate:{" "}
                  <Link
                    href={`/verify/${cert.supersededBy?.publicId}`}
                    className="font-mono font-bold underline text-[#B45309]"
                  >
                    {cert.supersededBy?.publicId}
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* Certificate Main Card */}
          <div className="card-glass border border-[#E9E6DF] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E9E6DF] pb-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex items-center justify-center text-[#4F46E5] shrink-0">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#6E6A63] block">
                    Attest Continuous Assurance Network
                  </span>
                  <div className="text-xl font-bold text-[#17161A] font-heading">{org?.name}</div>
                  <div className="text-xs text-[#6E6A63] font-mono mt-0.5">
                    {profile?.jurisdiction || "PK"} Reg: {profile?.registrationNumber || "0094182-LHR"} &bull; Tax ID: {profile?.taxId || "NTN-4892184-7"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 self-start sm:self-auto">
                {cert.status === "ISSUED" && (
                  <div className="hidden sm:block shrink-0">
                    <SealBadge size={76} />
                  </div>
                )}
                <div className="flex flex-col items-start sm:items-end">
                  <StatusPill rawValue={cert.status} type="status" />
                  <span className="text-[11px] font-mono text-[#6E6A63] mt-1 font-semibold">
                    Public ID: <strong className="text-[#4F46E5]">{cert.publicId}</strong>
                  </span>
                  <span className="text-[10px] font-mono text-[#6E6A63]">v{cert.version}.0</span>
                </div>
              </div>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
                <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Assurance Level</span>
                <span className="font-bold text-[#17161A] text-sm mt-0.5 block">
                  {formatEnumLabel(cert.level)}
                </span>
                <span className="text-[#6E6A63] text-[10.5px] mt-0.5 block">
                  {cert.levelAchieved === 2
                    ? "Bank & Ledger Reconciled (No 3-way invoice test)"
                    : cert.levelAchieved === 3
                    ? "3-Way Corroborated with Invoices"
                    : "Statements Only"}
                </span>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
                <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Period Covered</span>
                <span className="font-mono font-bold text-[#17161A] text-sm mt-0.5 block">
                  2026-04-01 &mdash; 2026-04-30
                </span>
                <span className="text-[#6E6A63] text-[10.5px] mt-0.5 block">Monthly Assurance Cycle</span>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
                <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Reconciled Coverage</span>
                <span className="font-bold text-[#188A54] text-sm mt-0.5 block">
                  {cert.coveragePercent}%
                </span>
                <span className="text-[#6E6A63] text-[10.5px] mt-0.5 block">Deterministic Match Volume</span>
              </div>

              <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E9E6DF]">
                <span className="text-[#6E6A63] block text-[10px] uppercase font-semibold">Licensed Signatory</span>
                <span className="font-bold text-[#17161A] text-sm mt-0.5 block">
                  {cert.signedBy?.name || "Ayesha Siddiqui, FCA"}
                </span>
                <span className="text-[#6E6A63] text-[10.5px] mt-0.5 block">ICAP-49102 &bull; Licensed CA</span>
              </div>
            </div>

            {/* Scope Language */}
            <div className="p-4 rounded-xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-xs">
              <span className="font-bold text-[#4F46E5] block text-[11px] uppercase tracking-wider">
                Attest Scope of Engagement (ATTEST.md)
              </span>
              <p className="mt-1 font-mono text-[#17161A] font-medium leading-relaxed">
                &ldquo;{ATTEST_SCOPE_LANGUAGE}&rdquo;
              </p>
            </div>

            {/* CA Professional Conclusion */}
            {cert.caConclusion && (
              <div className="p-4 rounded-xl bg-[#FAF9F6] border border-[#E9E6DF] text-xs space-y-1">
                <span className="font-bold text-[#6E6A63] block uppercase text-[10.5px] tracking-wider">
                  CA Independent Professional Conclusion
                </span>
                <p className="text-[#17161A] italic leading-relaxed">
                  &ldquo;{cert.caConclusion}&rdquo;
                </p>
              </div>
            )}

            {/* Procedures Performed */}
            {procedures.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#17161A] block">Procedures Performed:</span>
                <ul className="list-disc list-inside space-y-1 text-[#6E6A63] text-[11.5px] p-3 rounded-xl bg-[#FAF9F6] border border-[#E9E6DF]">
                  {procedures.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclosed Limitations */}
            {limitations.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-bold text-[#17161A] block">Disclosed Limitations:</span>
                <div className="space-y-2">
                  {limitations.map((lim, i) => (
                    <div key={i} className="p-3 rounded-lg bg-[#FAF9F6] border border-[#E9E6DF] text-[11.5px]">
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

            {/* Cryptographic Integrity Footer */}
            <div className="pt-4 border-t border-[#E9E6DF] text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-[#17161A] font-semibold">
                <Lock className="w-3.5 h-3.5 text-[#4F46E5]" />
                Cryptographic Signature &amp; Tamper-Evident Integrity
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
                Integrity Classification: <strong>{ATTEST_SIGNATURE_DISCLAIMER}</strong>.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
