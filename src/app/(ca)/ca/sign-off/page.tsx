import React from "react";
import Link from "next/link";
import { PenTool, ShieldAlert, Award, FileCheck2, AlertTriangle, ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatPaise } from "@/lib/money";

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
        <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
          CA Signing & Certification Chamber
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Final review and cryptographic signing of continuous assurance certificate.
        </p>
      </div>

      {/* Development-mode warning banner adhering to Honesty Rules */}
      <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <span className="font-bold block uppercase tracking-wide text-[10px] text-amber-800">
            Mandatory Integrity Classification Notice
          </span>
          <span className="mt-0.5 block">
            Any digital signature generated in this environment is labeled:{" "}
            <strong>&ldquo;development-mode integrity — not a qualified digital signature&rdquo;</strong>.
            Real-world qualified trust services require an ICAP-certified hardware security module (HSM) or qualified electronic signature (QES).
          </span>
        </div>
      </div>

      {/* Blocking Alert: Open Exceptions */}
      {openExceptions.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-xs text-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <h3 className="font-bold text-sm text-red-900">Sign-Off Blocked: Open Financial Exceptions</h3>
            <p className="mt-1 text-red-800 leading-relaxed">
              Under CA Assurance Rules, you cannot sign or issue a Certificate while unresolved exceptions remain active.
              Meridian Textiles currently has <strong>{openExceptions.length} open exceptions</strong> (E-101 and E-102 totaling PKR 458,500.00).
            </p>
            <div className="mt-3">
              <Link
                href="/ca/exceptions"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                Review & Resolve Exceptions First &rarr;
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Certificate Sign-Off Summary Box */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="font-bold text-sm text-[#0B1220]">Certificate Scope Ready for Sign-Off</div>
          <span className="font-mono text-xs text-gray-500 font-semibold">{cert?.publicId}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-gray-400 block">Target Organization</span>
            <span className="font-semibold text-gray-800">{org?.name}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Assurance Level</span>
            <span className="font-semibold text-gray-800">{cert?.level}</span>
          </div>
          <div>
            <span className="text-gray-400 block">Assurance Period</span>
            <span className="font-mono text-gray-800">2026-04-01 to 2026-04-30</span>
          </div>
          <div>
            <span className="text-gray-400 block">Assurance Status</span>
            <span className="font-mono text-amber-700 font-semibold">{cert?.status}</span>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">
            Signer: Ayesha Siddiqui, FCA &bull; License #ICAP-49102
          </span>
          <button
            type="button"
            disabled={openExceptions.length > 0}
            className="px-4 py-2 rounded-lg bg-[#0B1220] text-white text-xs font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black transition-colors flex items-center gap-2"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-400" />
            Apply CA Digital Signature
          </button>
        </div>
      </div>
    </div>
  );
}
