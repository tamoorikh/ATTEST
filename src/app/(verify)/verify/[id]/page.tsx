import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  FileCheck2,
  Calendar,
  Lock,
  ArrowLeft,
  FileLock2,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { DemoBanner } from "@/components/common/DemoBanner";

export default async function PublicCertificateViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cert = await prisma.certificate.findUnique({
    where: { publicId: id },
    include: {
      org: {
        include: {
          companyProfile: true,
        },
      },
      signedBy: true,
    },
  });

  if (!cert) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[#0B1220]">Certificate Not Found</h1>
        <p className="text-xs text-gray-500">
          No certificate exists with public identifier <code className="font-mono font-bold text-gray-800">{id}</code>. Please verify the ID and try again.
        </p>
        <div>
          <Link
            href="/verify"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2456E6] hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Public Search
          </Link>
        </div>
      </div>
    );
  }

  const profile = cert.org.companyProfile;
  const isDemo = cert.org.isDemo;

  let scope = { bankAccountsIncluded: [], period: "April 2026", accountingStandard: "IFRS for SMEs" };
  let coverage = { reconciledVolumePaise: 0, exceptionCount: 0 };
  try {
    if (cert.scopeJson) scope = JSON.parse(cert.scopeJson);
    if (cert.coverageJson) coverage = JSON.parse(cert.coverageJson);
  } catch (e) {
    // fallback
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Demo Warning Banner */}
      {isDemo && <DemoBanner orgName={cert.org.name} />}

      <div className="flex items-center justify-between">
        <Link
          href="/verify"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Search another certificate
        </Link>
        <span className="font-mono text-xs text-gray-400">Public Verifier &bull; ID: {cert.publicId}</span>
      </div>

      {/* Main Certificate Display Sheet */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-6 sm:p-10 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#0B1220] flex items-center justify-center text-white shrink-0">
              <Award className="w-7 h-7 text-[#2456E6]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-gray-400 block">
                Continuous Assurance Certificate
              </span>
              <h1 className="text-xl font-bold text-[#0B1220]">{cert.org.name}</h1>
              <div className="text-xs text-gray-500 font-mono mt-0.5">
                {profile?.jurisdiction || "PK"} Legal Reg: {profile?.registrationNumber || "0094182-LHR"} &bull; Tax ID: {profile?.taxId || "NTN-4892184-7"}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start sm:items-end">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                cert.status === "ISSUED"
                  ? "bg-blue-50 text-[#2456E6] border border-blue-200"
                  : "bg-amber-50 text-amber-800 border border-amber-200"
              }`}
            >
              {cert.status === "ISSUED" ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2456E6]" />
                  OFFICIALLY ISSUED
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  STATUS: {cert.status}
                </>
              )}
            </span>
            <span className="text-[10px] font-mono text-gray-400 mt-1">
              Public Ref: {cert.publicId}
            </span>
          </div>
        </div>

        {/* Certificate Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="p-4 rounded-xl bg-[#FAF9F7] border border-gray-200">
            <span className="text-gray-400 font-medium uppercase text-[10px] block">Assurance Level</span>
            <div className="font-bold text-[#0B1220] text-sm mt-1">{cert.level}</div>
            <div className="text-gray-500 text-[11px] mt-1">Tier-2 Bank Statement & Book Reconciliation</div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F7] border border-gray-200">
            <span className="text-gray-400 font-medium uppercase text-[10px] block">Period Covered</span>
            <div className="font-bold text-[#0B1220] text-sm mt-1 font-mono">
              2026-04-01 &mdash; 2026-04-30
            </div>
            <div className="text-gray-500 text-[11px] mt-1">Monthly Assurance Cycle</div>
          </div>

          <div className="p-4 rounded-xl bg-[#FAF9F7] border border-gray-200">
            <span className="text-gray-400 font-medium uppercase text-[10px] block">CA Reviewer Authority</span>
            <div className="font-bold text-[#0B1220] text-sm mt-1">
              {cert.signedBy?.name || "Ayesha Siddiqui, FCA"}
            </div>
            <div className="text-gray-500 text-[11px] mt-1">Chartered Accountant (ICAP Licensed)</div>
          </div>
        </div>

        {/* Mandatory Development-Mode Integrity Disclaimer */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600 space-y-1">
          <span className="font-semibold text-gray-900 block flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-gray-500" />
            Integrity Classification Notice
          </span>
          <p className="text-[11px] leading-relaxed">
            This certificate operates under{" "}
            <span className="font-mono font-medium text-gray-800">development-mode integrity — not a qualified digital signature</span>.
            Cryptographic hashes certify data immutability within the Attest deterministic engine.
          </p>
        </div>

        {/* Request Detailed Disclosure Box */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0B1220] flex items-center gap-1.5">
              <FileLock2 className="w-4 h-4 text-[#2456E6]" />
              Need Full Transaction Ledger Disclosure?
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Qualified lenders and commercial counterparties may request read access to the underlying verified ledger.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-[#0B1220] hover:bg-black text-white text-xs font-semibold whitespace-nowrap transition-colors"
          >
            Request Ledger Disclosure
          </button>
        </div>
      </div>
    </div>
  );
}
