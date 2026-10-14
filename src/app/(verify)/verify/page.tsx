"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, Lock, HelpCircle, XCircle } from "lucide-react";

export default function PublicVerifySearchPage() {
  const router = useRouter();
  const [certId, setCertId] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (certId.trim()) {
      router.push(`/verify/${encodeURIComponent(certId.trim())}`);
    }
  }

  return (
    <div className="py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
          <ShieldCheck className="w-4 h-4" />
          Public Assurance Verifier &bull; Zero Login Required
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
          Verify Financial Trust Certificates
        </h1>
        <p className="text-sm text-[#64748B] max-w-xl mx-auto leading-relaxed">
          Independently verify continuous assurance certificates issued by licensed Chartered Accountants on the Attest network. Anyone can verify validity and cryptographic integrity using a certificate ID.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl border border-[#E6E9EF] shadow-sm flex items-center gap-2">
        <div className="pl-3 text-[#64748B]">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          id="txtPublicCertSearch"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Enter Certificate Public ID (e.g. ATTEST-PK-2026-XXXXXX-XX)"
          className="flex-1 px-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 font-mono text-[#0F172A] placeholder-gray-400"
        />
        <button
          type="submit"
          id="btnSearchSubmit"
          className="px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <span>Verify</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* What Verification DOES and DOES NOT Establish */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-5 rounded-2xl bg-white border border-[#E6E9EF] space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>What Verification Establishes</span>
          </div>
          <ul className="space-y-2 text-[#64748B] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">&bull;</span>
              <span><strong>Arithmetic continuity:</strong> Bank statement running balances and closing figures strictly obey Rules R1–R4.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">&bull;</span>
              <span><strong>Deterministic reconciliation:</strong> Multi-way matching between bank statements and books without AI fabrication.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">&bull;</span>
              <span><strong>Professional sign-off:</strong> Reviewed and signed by a licensed Chartered Accountant with ICAP license attribution.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 font-bold">&bull;</span>
              <span><strong>Cryptographic integrity:</strong> SHA-256 canonical hashing and HMAC digital signature.</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E6E9EF] space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>What Verification Does NOT Establish</span>
          </div>
          <ul className="space-y-2 text-[#64748B] leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">&bull;</span>
              <span><strong>Not a statutory audit:</strong> This is a continuous assurance engagement on specified reconciliation procedures, not a statutory audit under Companies Act.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">&bull;</span>
              <span><strong>No creditworthiness representation:</strong> Does not represent or guarantee solvency, credit rating, or future commercial performance.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-600 font-bold">&bull;</span>
              <span><strong>Procedures and results &mdash; not opinions:</strong> Reports deterministic computational facts, not qualitative subjective opinions.</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Strict Privacy Note */}
      <div className="p-4 rounded-xl bg-[#F7F8FA] border border-[#E6E9EF] text-xs text-[#64748B] flex items-start gap-3">
        <Lock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-[#0F172A] block uppercase text-[10px] tracking-wider">
            Strict Confidentiality &amp; Privacy Shield
          </span>
          <p className="mt-0.5 leading-relaxed text-[11.5px]">
            Attest protects corporate confidentiality. The public verifier NEVER exposes bank transaction lines, counterparty names, individual amounts, or internal accounting ledgers. Only cryptographic verification parameters and assurance conclusions are displayed.
          </p>
        </div>
      </div>
    </div>
  );
}
