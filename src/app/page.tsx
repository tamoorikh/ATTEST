import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  UserCheck,
  Search,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  GitCommit,
  Cpu,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0B1220] flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5 text-[#2456E6]" />
            </div>
            <span className="font-bold text-base tracking-tight text-[#0B1220]">Attest</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="text-xs font-semibold text-gray-600 hover:text-black px-3 py-1.5"
            >
              Public Verifier
            </Link>
            <Link
              href="/auth/signin"
              className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#0B1220] hover:bg-black text-white transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2456E6]">
          <span className="w-2 h-2 rounded-full bg-[#2456E6] animate-pulse"></span>
          Financial Verification & Continuous Assurance Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0B1220] max-w-3xl mx-auto leading-[1.15]">
          Continuous financial truth you can verify anywhere.
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Businesses upload bank statements and accounting books. A deterministic engine reconciles them with zero hallucinations. Licensed Chartered Accountants review and sign live, tamper-evident trust certificates.
        </p>

        {/* Three Interface Entrances */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Client Portal Card */}
          <Link
            href="/portal"
            className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#0B1220] group-hover:text-white flex items-center justify-center text-gray-700 transition-colors mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-[#0B1220] group-hover:text-[#2456E6] transition-colors">
                Client Portal
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Upload bank statements, inspect running balance continuity, and resolve exceptions with verifiable evidence.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-gray-700 group-hover:text-[#2456E6]">
              <span>Enter as Owner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* CA Console Card */}
          <Link
            href="/ca"
            className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#0B1220] group-hover:text-white flex items-center justify-center text-gray-700 transition-colors mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-[#0B1220] group-hover:text-[#2456E6] transition-colors">
                CA Console
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Licensed Chartered Accountant workspace. Review client resolution evidence, inspect audit hash chains, and sign off.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-gray-700 group-hover:text-[#2456E6]">
              <span>Enter as CA Reviewer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Public Verifier Card */}
          <Link
            href="/verify"
            className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover:bg-[#2456E6] group-hover:text-white flex items-center justify-center text-[#2456E6] transition-colors mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-[#0B1220] group-hover:text-[#2456E6] transition-colors">
                Public Verifier
              </h2>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                Public trust verification. Lenders, vendors, and partners verify certificate authenticity by public ID with zero login.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#2456E6]">
              <span>Verify by ID</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Architectural Pillars */}
        <div className="pt-12 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-left text-xs">
          <div>
            <div className="font-bold text-[#0B1220] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Deterministic Core
            </div>
            <p className="text-gray-500 mt-1">Rule-based validation with 100% mathematical precision.</p>
          </div>
          <div>
            <div className="font-bold text-[#0B1220] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2456E6]" />
              Authority Rule
            </div>
            <p className="text-gray-500 mt-1">AI proposes. Deterministic code validates. Humans approve.</p>
          </div>
          <div>
            <div className="font-bold text-[#0B1220] flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-gray-700" />
              Append-Only Auditing
            </div>
            <p className="text-gray-500 mt-1">Every state transition linked via cryptographic SHA-256 hash chains.</p>
          </div>
          <div>
            <div className="font-bold text-[#0B1220] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              Tenant Isolation
            </div>
            <p className="text-gray-500 mt-1">Org-scoped database boundaries with zero cross-tenant leakage.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-6 text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Attest Assurance Platform. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="hover:text-black">
              Sign In
            </Link>
            <Link href="/verify" className="hover:text-black">
              Public Verification
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
