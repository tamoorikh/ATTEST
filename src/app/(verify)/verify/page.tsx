"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ShieldCheck, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";

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
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2456E6]">
          <ShieldCheck className="w-4 h-4" />
          Public Assurance Verifier
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#0B1220] sm:text-4xl">
          Verify Financial Trust Certificates
        </h1>
        <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
          Anyone can independently verify financial statements and assurance certificates issued by licensed Chartered Accountants on the Attest network. No login required.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl border border-gray-300 shadow-sm flex items-center gap-2">
        <div className="pl-3 text-gray-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Enter Certificate Public ID (e.g. CERT-2026-04-MTL-001)"
          className="flex-1 px-3 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 font-mono text-[#0B1220] placeholder-gray-400"
        />
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-[#0B1220] hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
        >
          <span>Verify</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      {/* Sample Certificate Quick Link */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="font-semibold text-[#0B1220] block">Featured Sample Certificate</span>
          <span className="font-mono text-gray-500 text-[11px]">CERT-2026-04-MTL-001 &bull; Meridian Textiles (Pvt) Ltd</span>
        </div>
        <button
          type="button"
          onClick={() => router.push("/verify/CERT-2026-04-MTL-001")}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2456E6] hover:underline"
        >
          <span>View Sample Certificate</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="font-bold text-[#0B1220] mb-1">Deterministic Proof</div>
          <p className="text-gray-500">
            Every transaction is verified using deterministic reconciliation rules with zero AI guesswork.
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="font-bold text-[#0B1220] mb-1">Human CA Accountability</div>
          <p className="text-gray-500">
            No certificate is ever issued without explicit sign-off by a licensed Chartered Accountant.
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200">
          <div className="font-bold text-[#0B1220] mb-1">Append-Only Audit Trail</div>
          <p className="text-gray-500">
            Cryptographically chained SHA-256 state transitions guarantee complete tamper resistance.
          </p>
        </div>
      </div>
    </div>
  );
}
