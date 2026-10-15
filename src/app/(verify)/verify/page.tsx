"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink, Lock, HelpCircle, XCircle } from "lucide-react";
import { GraffitiBackdrop } from "@/components/ui/GraffitiBackdrop";

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
    <div className="relative">
      <GraffitiBackdrop />

      <div className="relative z-10 py-12 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-xs font-semibold text-[#4F46E5]">
            <ShieldCheck className="w-4 h-4" />
            Public Assurance Verifier &bull; Zero Login Required
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#17161A] sm:text-4xl font-heading">
            Verify Financial Trust Certificates
          </h1>
          <p className="text-sm text-[#6E6A63] max-w-xl mx-auto leading-relaxed">
            Independently verify continuous assurance certificates issued by licensed Chartered Accountants on the Attest network. Anyone can verify validity and cryptographic integrity using a certificate ID.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="bg-white/92 backdrop-blur p-2.5 rounded-2xl border border-[#E9E6DF] shadow-sm flex items-center gap-2">
          <div className="pl-3 text-[#6E6A63]">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            id="txtPublicCertSearch"
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="Enter Certificate Public ID (e.g. ATTEST-PK-2026-XXXXXX-XX)"
            className="flex-1 px-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 font-mono text-[#17161A] placeholder-[#9E9B94]"
          />
          <button
            type="submit"
            id="btnSearchSubmit"
            className="px-5 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <span>Verify</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Example ID Helper */}
        <div className="text-center text-xs text-[#6E6A63]">
          Try demo certificate:{" "}
          <button
            type="button"
            onClick={() => setCertId("ATTEST-PK-2026-406434-0A")}
            className="font-mono text-[#4F46E5] underline hover:text-[#4338CA]"
          >
            ATTEST-PK-2026-406434-0A
          </button>
        </div>

        {/* What Verification DOES and DOES NOT Establish */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 rounded-2xl bg-white/92 backdrop-blur border border-[#E9E6DF] space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#188A54] font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>What Verification Establishes</span>
            </div>
            <ul className="space-y-2 text-[#6E6A63] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#188A54] font-bold">&bull;</span>
                <span><strong>Arithmetic continuity:</strong> Bank statement running balances and closing figures strictly obey Rules R1–R4.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#188A54] font-bold">&bull;</span>
                <span><strong>Deterministic reconciliation:</strong> Multi-way matching between bank statements and books without AI fabrication.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#188A54] font-bold">&bull;</span>
                <span><strong>Professional sign-off:</strong> Reviewed and signed by a licensed Chartered Accountant with ICAP license attribution.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#188A54] font-bold">&bull;</span>
                <span><strong>Cryptographic integrity:</strong> SHA-256 canonical hashing and HMAC digital signature.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-white/92 backdrop-blur border border-[#E9E6DF] space-y-3 shadow-sm">
            <div className="flex items-center gap-2 text-[#B45309] font-bold text-sm">
              <HelpCircle className="w-4 h-4 text-[#B45309]" />
              <span>What Verification Does NOT Establish</span>
            </div>
            <ul className="space-y-2 text-[#6E6A63] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#B45309] font-bold">&bull;</span>
                <span><strong>Not a statutory audit:</strong> This is a continuous assurance engagement on specified reconciliation procedures, not a statutory audit under Companies Act.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B45309] font-bold">&bull;</span>
                <span><strong>No creditworthiness representation:</strong> Does not represent or guarantee solvency, credit rating, or future commercial performance.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#B45309] font-bold">&bull;</span>
                <span><strong>Procedures and results &mdash; not opinions:</strong> Reports deterministic computational facts, not qualitative subjective opinions.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Strict Privacy Note */}
        <div className="p-4 rounded-xl bg-white/70 backdrop-blur border border-[#E9E6DF] text-xs text-[#6E6A63] flex items-start gap-3">
          <Lock className="w-4 h-4 text-[#4F46E5] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-[#17161A] block uppercase text-[10px] tracking-wider">
              Strict Confidentiality &amp; Privacy Shield
            </span>
            <p className="mt-0.5 leading-relaxed text-[11.5px]">
              Attest protects corporate confidentiality. The public verifier NEVER exposes bank transaction lines, counterparty names, individual amounts, or internal accounting ledgers. Only cryptographic verification parameters and assurance conclusions are displayed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
