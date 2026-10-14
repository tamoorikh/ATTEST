import React from "react";
import Link from "next/link";
import { Award, ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel } from "@/lib/labels";
import { ATTEST_SCOPE_LANGUAGE, ATTEST_SIGNATURE_DISCLAIMER } from "@/lib/certificate";
import { PrintTrigger } from "@/components/certificate/PrintTrigger";

export default async function CertificatePrintViewPage() {
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

  if (!cert) {
    return (
      <div className="p-12 text-center text-sm text-[#64748B]">
        No active certificate found to print.
      </div>
    );
  }

  const verifyUrl = `https://attest.pk/verify/${cert.publicId}`;

  return (
    <div className="min-h-screen bg-white text-[#0F172A] p-4 sm:p-8 font-sans">
      {/* Screen-only top action bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/portal/certificate"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Portal</span>
        </Link>

        <div className="flex items-center gap-2">
          <PrintTrigger />
        </div>
      </div>

      {/* PRINT-OPTIMIZED DOCUMENT CONTAINER */}
      <div
        id="printDocument"
        className="max-w-4xl mx-auto border-2 border-[#0F172A] p-8 sm:p-12 rounded-lg shadow-sm print:shadow-none print:border-2 print:p-8 bg-white relative space-y-8"
        style={{ minHeight: "297mm" }}
      >
        {/* Certificate Header */}
        <div className="flex items-start justify-between border-b-2 border-[#0F172A] pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#2563EB] flex items-center justify-center text-white print:border print:border-[#0F172A]">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#2563EB] block">
                Attest Continuous Assurance Network
              </span>
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
                CONTINUOUS ASSURANCE TRUST CERTIFICATE
              </h1>
              <span className="text-xs text-[#64748B] font-medium block mt-0.5">
                Deterministic Financial Reconciliation &amp; CA Verification
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-[#64748B] uppercase block">Certificate Identifier</span>
            <span className="font-mono text-sm font-bold text-[#2563EB] block mt-0.5">
              {cert.publicId}
            </span>
            <span className="text-[10px] font-mono text-[#64748B] block mt-1">
              Version {cert.version}.0 &bull; Status: {cert.status}
            </span>
          </div>
        </div>

        {/* Legal Entity & Period Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Verified Entity</span>
            <span className="font-bold text-[#0F172A] block mt-0.5">{org?.name}</span>
            <span className="text-[10.5px] font-mono text-gray-600 block mt-0.5">
              Reg: {profile?.registrationNumber || "0094182-LHR"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Tax / NTN</span>
            <span className="font-mono font-bold text-[#0F172A] block mt-0.5">
              {profile?.taxId || "NTN-4892184-7"}
            </span>
            <span className="text-[10.5px] text-gray-600 block mt-0.5">Jurisdiction: PK</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Assurance Level</span>
            <span className="font-bold text-[#2563EB] block mt-0.5">
              {formatEnumLabel(cert.level)}
            </span>
            <span className="text-[10px] text-gray-600 block mt-0.5">
              {cert.levelAchieved === 2 ? "Bank + General Ledger" : "Comprehensive"}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Assurance Period</span>
            <span className="font-mono font-bold text-[#0F172A] block mt-0.5">
              2026-04-01 &mdash; 2026-04-30
            </span>
            <span className="text-[10px] text-gray-600 block mt-0.5">
              Coverage: {cert.coveragePercent}%
            </span>
          </div>
        </div>

        {/* Scope Language */}
        <div className="p-4 rounded-lg border border-blue-200 bg-blue-50/50 text-xs space-y-1">
          <span className="font-bold uppercase tracking-wider text-[10.5px] text-blue-900 block">
            Scope of Assurance &amp; Standard of Review
          </span>
          <p className="font-mono text-xs font-medium text-blue-950 leading-relaxed">
            &ldquo;{ATTEST_SCOPE_LANGUAGE}&rdquo;
          </p>
        </div>

        {/* Procedures Performed */}
        {procedures.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] block">
              Procedures Executed Under Deterministic Engine:
            </span>
            <ul className="list-disc list-inside space-y-1 text-gray-700 text-[11.5px] p-3 rounded-lg border border-gray-200 bg-white">
              {procedures.map((p, idx) => (
                <li key={idx} className="leading-relaxed">{p}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclosed Limitations */}
        {limitations.length > 0 && (
          <div className="space-y-2 text-xs">
            <span className="font-bold text-[#0F172A] uppercase tracking-wider text-[11px] block">
              Disclosed Limitations:
            </span>
            <div className="space-y-1.5">
              {limitations.map((lim, idx) => (
                <div key={idx} className="p-2.5 rounded border border-gray-200 bg-gray-50/50 text-[11px]">
                  <span className="font-bold text-[#0F172A]">{lim.title}</span> ({lim.severity}) &bull;{" "}
                  <span className="text-gray-600">Client: {lim.clientTreatment || "Recorded"}</span> &bull;{" "}
                  <span className="text-gray-600">CA: {lim.caTreatment || "Reviewed"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CA Professional Conclusion */}
        {cert.caConclusion && (
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-xs space-y-1">
            <span className="font-bold uppercase text-[10px] tracking-wider text-gray-500 block">
              CA Professional Conclusion
            </span>
            <p className="italic text-[#0F172A] leading-relaxed">
              &ldquo;{cert.caConclusion}&rdquo;
            </p>
          </div>
        )}

        {/* Signatory & QR Verification Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t-2 border-[#0F172A] items-center">
          <div className="space-y-2 text-xs">
            <span className="font-bold uppercase text-[10px] text-gray-500 tracking-wider block">
              Chartered Accountant Signatory
            </span>
            <div className="font-bold text-base text-[#0F172A]">{cert.signedBy?.name || "Ayesha Siddiqui, FCA"}</div>
            <div className="text-xs text-gray-600">
              License #ICAP-49102 &bull; Licensed Assurance Practitioner
            </div>
            <div className="font-mono text-[11px] text-gray-500">
              Issued At: {cert.issuedAt?.toISOString().split("T")[0] || "2026-10-14"}
            </div>
          </div>

          <div className="p-4 rounded-lg border border-gray-200 bg-gray-50 flex items-center gap-4 text-xs">
            {/* Visual QR Code representation */}
            <div className="w-20 h-20 bg-white border border-gray-300 rounded p-1 flex flex-col justify-between items-center text-[8px] font-mono text-center shrink-0">
              <div className="w-full flex justify-between">
                <div className="w-4 h-4 bg-black rounded-sm" />
                <div className="w-4 h-4 bg-black rounded-sm" />
              </div>
              <span className="font-bold text-gray-800">QR VERIFY</span>
              <div className="w-full flex justify-between">
                <div className="w-4 h-4 bg-black rounded-sm" />
                <div className="w-2 h-2 bg-black rounded-sm" />
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Public Verification URL</span>
              <span className="font-mono text-xs font-bold text-[#2563EB] break-all block mt-0.5">
                {verifyUrl}
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">
                Scan QR or enter ID in public verifier to check validity.
              </span>
            </div>
          </div>
        </div>

        {/* Cryptographic Footer */}
        <div className="pt-4 border-t border-gray-200 text-[10.5px] font-mono text-gray-500 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span>Payload Hash: {cert.payloadHash}</span>
            <span>Sig Mode: {cert.signatureMode}</span>
          </div>
          <div className="truncate">
            HMAC Signature: {cert.signature}
          </div>
          <div className="pt-2 text-center text-xs font-sans text-gray-600 font-medium">
            Mandatory Integrity Notice: <strong>{ATTEST_SIGNATURE_DISCLAIMER}</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
