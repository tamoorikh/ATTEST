import React from "react";
import Link from "next/link";
import { Award, ShieldCheck, ExternalLink, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";

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
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Assurance Trust Certificate
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Live cryptographic certificate publicly verifiable by unique ID without credentials.
          </p>
        </div>

        {cert?.publicId && (
          <Link
            href={`/verify/${cert.publicId}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <span>Public Verifier Link</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {/* Certificate Card */}
      <div className="bg-white border border-[#E6E9EF] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
                {formatEnumLabel(cert?.level || "LEVEL_2")}
              </div>
              <div className="text-lg font-bold text-[#0F172A]">
                {org?.name || "Meridian Textiles (Pvt) Ltd"}
              </div>
            </div>
          </div>

          <div className="text-right">
            <StatusPill rawValue={cert?.status || "PENDING_REVIEW"} type="status" />
            <div className="font-mono text-xs text-[#64748B] mt-1">v{cert?.version}.0</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-[#E6E9EF] text-xs">
          <div>
            <span className="text-[#64748B] block uppercase tracking-wider font-semibold text-[10px]">
              Assurance Period
            </span>
            <span className="font-mono text-sm font-semibold text-[#0F172A] mt-1 block">
              01 April 2026 &mdash; 30 April 2026
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block uppercase tracking-wider font-semibold text-[10px]">
              Public Certificate Identifier
            </span>
            <span className="font-mono text-sm font-bold text-[#2563EB] mt-1 block">
              {cert?.publicId}
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block uppercase tracking-wider font-semibold text-[10px]">
              Legal Entity &amp; Tax ID
            </span>
            <span className="font-medium text-[#0F172A] mt-1 block">
              {profile?.legalName} &bull; <span className="font-mono">{profile?.taxId}</span>
            </span>
          </div>
          <div>
            <span className="text-[#64748B] block uppercase tracking-wider font-semibold text-[10px]">
              Assurance Standard
            </span>
            <span className="font-medium text-[#0F172A] mt-1 block">
              Deterministic Rule Engine &bull; IFRS for SMEs
            </span>
          </div>
        </div>

        <div className="pt-6">
          <div className="text-xs font-semibold text-[#0F172A] mb-2">Scope &amp; Reconciliation Coverage</div>
          <div className="border border-[#E6E9EF] bg-[#F7F8FA] rounded-xl p-4 font-mono text-xs text-[#0F172A] space-y-2">
            <div>
              <span className="text-[#64748B]">Included Accounts:</span> Habib Bank Limited (HBL) - 00427901842003
            </div>
            <div>
              <span className="text-[#64748B]">Deterministic Match Rules:</span> Exact Amount &amp; Date Match, Invoice Reference Match
            </div>
            <div>
              <span className="text-[#64748B]">Resolution Status:</span> 2 Exceptions Open (Pending CA Review)
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E6E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#64748B]">
          <span>Authority Rule: LLM never approves; licensed human CA sign-off required for final issuance.</span>
          <Link
            href={`/verify/${cert?.publicId}`}
            className="text-[#2563EB] font-semibold hover:underline"
          >
            Verify in Public Verifier &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
