import React from "react";
import Link from "next/link";
import { PenTool, ShieldAlert, Award, FileCheck2, AlertTriangle, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";
import { formatEnumLabel } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";

export default async function CASignOffPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      certificates: {
        take: 1,
        orderBy: { createdAt: "desc" },
      },
      exceptions: {
        where: { status: "OPEN" },
      },
      companyProfile: true,
    },
  });

  const cert = org?.certificates[0];
  const openExceptions = org?.exceptions || [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
          CA Signing &amp; Certification Chamber
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Final professional review and cryptographic signing of continuous assurance certificate.
        </p>
      </div>

      {/* Development-mode warning banner adhering to Honesty Rules */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block uppercase tracking-wide text-[10px] text-amber-800">
            Mandatory Integrity Classification Notice
          </span>
          <span className="mt-0.5 block leading-relaxed">
            Any digital signature generated in this environment is labeled:{" "}
            <strong>&ldquo;development-mode integrity &mdash; not a qualified digital signature&rdquo;</strong>.
            Real-world qualified trust services require an ICAP-certified hardware security module (HSM) or qualified electronic signature (QES).
          </span>
        </div>
      </div>

      {/* Blocking Alert: Open Exceptions */}
      {openExceptions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-xs text-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-sm text-red-900">Sign-Off Blocked: Open Financial Exceptions</h3>
            <p className="mt-1 text-red-800 leading-relaxed">
              Under CA Assurance Rules, you cannot sign or issue a Certificate while unresolved exceptions remain active.
              Meridian Textiles currently has <strong>{openExceptions.length} open exceptions</strong> requiring resolution.
            </p>
            <div className="mt-3">
              <Link
                href="/ca/exceptions"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                Review &amp; Resolve Exceptions First &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Sign-Off Summary Box */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-3">
          <div className="font-bold text-sm text-[#0F172A]">Certificate Scope Ready for Sign-Off</div>
          <span className="font-mono text-xs text-[#2563EB] font-bold bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            {cert?.publicId}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Target Organization</span>
            <span className="font-bold text-[#0F172A] mt-0.5 block">{org?.name}</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Assurance Level</span>
            <span className="font-bold text-[#0F172A] mt-0.5 block">
              {formatEnumLabel(cert?.level || "LEVEL_2")}
            </span>
          </div>
          <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Assurance Period</span>
            <span className="font-mono font-semibold text-[#0F172A] mt-0.5 block">2026-04-01 &mdash; 2026-04-30</span>
          </div>
          <div className="p-3 bg-[#F7F8FA] rounded-lg border border-[#E6E9EF]">
            <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Workflow Status</span>
            <div className="mt-1">
              <StatusPill rawValue={cert?.status || "PENDING_REVIEW"} type="status" />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-[#E6E9EF] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs text-[#64748B]">
            Signer: <strong className="text-[#0F172A]">Ayesha Siddiqui, FCA</strong> &bull; License #ICAP-49102
          </span>
          <button
            type="button"
            disabled={openExceptions.length > 0}
            className="px-4 py-2.5 rounded-xl bg-[#2563EB] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <PenTool className="w-4 h-4" />
            Apply CA Digital Signature
          </button>
        </div>
      </div>
    </div>
  );
}
