import React from "react";
import Link from "next/link";
import { Award, ShieldCheck, ExternalLink, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";

export default async function CertificatePage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      certificates: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      companyProfile: true,
    },
  });

  const cert = org?.certificates[0];
  const profile = org?.companyProfile;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            Assurance Trust Certificate
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Live cryptographic certificate publicly verifiable by unique ID without credentials.
          </p>
        </div>

        {cert?.publicId && (
          <Link
            href={`/verify/${cert.publicId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2456E6] hover:bg-[#1d45bc] text-white text-xs font-medium shadow-sm transition-colors"
          >
            <span>Public Verifier Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Certificate Card */}
      <div className="bg-white border-2 border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0B1220] flex items-center justify-center text-white">
              <Award className="w-6 h-6 text-[#2456E6]" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Continuous Assurance Level 2
              </div>
              <div className="text-lg font-bold text-[#0B1220]">
                {org?.name || "Meridian Textiles (Pvt) Ltd"}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
              {cert?.status || "PENDING_REVIEW"}
            </span>
            <div className="font-mono text-xs text-gray-400 mt-1">v{cert?.version}.0</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 block uppercase tracking-wider font-semibold text-[10px]">
              Assurance Period
            </span>
            <span className="font-mono text-sm font-semibold text-[#0B1220] mt-1 block">
              01 April 2026 &mdash; 30 April 2026
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase tracking-wider font-semibold text-[10px]">
              Public Certificate Identifier
            </span>
            <span className="font-mono text-sm font-bold text-[#2456E6] mt-1 block">
              {cert?.publicId}
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase tracking-wider font-semibold text-[10px]">
              Legal Entity & Tax ID
            </span>
            <span className="font-medium text-[#0B1220] mt-1 block">
              {profile?.legalName} &bull; <span className="font-mono">{profile?.taxId}</span>
            </span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase tracking-wider font-semibold text-[10px]">
              Assurance Standard
            </span>
            <span className="font-medium text-[#0B1220] mt-1 block">
              Deterministic Rule Engine &bull; IFRS for SMEs
            </span>
          </div>
        </div>

        <div className="pt-6">
          <div className="text-xs font-semibold text-[#0B1220] mb-2">Scope & Reconciliation Coverage</div>
          <div className="bg-[#FAF9F7] border border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-700 space-y-2">
            <div>
              <span className="text-gray-400">Included Accounts:</span> Habib Bank Limited (HBL) - 00427901842003
            </div>
            <div>
              <span className="text-gray-400">Deterministic Match Rules:</span> EXACT_AMOUNT_DATE, INVOICE_REF_MATCH
            </div>
            <div>
              <span className="text-gray-400">Resolution Status:</span> 2 Exceptions Open (Pending CA Review)
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <span>Authority Rule: LLM never approves; licensed human CA sign-off required for final issuance.</span>
          <Link
            href={`/verify/${cert?.publicId}`}
            className="text-[#2456E6] font-semibold hover:underline"
          >
            Verify in Public Verifier &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
