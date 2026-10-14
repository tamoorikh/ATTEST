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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-[#E6E9EF] bg-white/90 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-[#0F172A]">Attest</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              className="text-xs font-semibold text-[#64748B] hover:text-[#0F172A] px-3 py-1.5 transition-colors"
            >
              Public Verifier
            </Link>
            <Link
              href="/auth/signin"
              className="text-xs font-semibold px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white transition-colors shadow-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-semibold text-[#2563EB]">
          <span className="w-2 h-2 rounded-full bg-[#2563EB] animate-pulse"></span>
          Financial Verification &amp; Continuous Assurance Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#0F172A] max-w-3xl mx-auto leading-[1.12]">
          Continuous financial truth you can verify anywhere.
        </h1>

        <p className="text-base sm:text-lg text-[#64748B] max-w-2xl mx-auto leading-relaxed">
          Businesses upload bank statements and accounting books. A deterministic engine reconciles them with zero hallucinations. Licensed Chartered Accountants review and sign live, tamper-evident trust certificates.
        </p>

        {/* Three Interface Entrances */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          {/* Client Portal Card */}
          <Link
            href="/portal"
            className="group p-6 rounded-2xl bg-white border border-[#E6E9EF] hover:border-[#2563EB]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-[#2563EB] group-hover:text-white flex items-center justify-center text-[#2563EB] transition-colors mb-4">
                <Building2 className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                Client Portal
              </h2>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Upload bank statements, inspect running balance continuity, and resolve exceptions with verifiable evidence.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
              <span>Enter as Owner</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* CA Console Card */}
          <Link
            href="/ca"
            className="group p-6 rounded-2xl bg-white border border-[#E6E9EF] hover:border-[#2563EB]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-[#2563EB] group-hover:text-white flex items-center justify-center text-[#2563EB] transition-colors mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                CA Console
              </h2>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Licensed Chartered Accountant workspace. Review client resolution evidence, inspect audit hash chains, and sign off.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#0F172A] group-hover:text-[#2563EB]">
              <span>Enter as CA Reviewer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Public Verifier Card */}
          <Link
            href="/verify"
            className="group p-6 rounded-2xl bg-white border border-[#E6E9EF] hover:border-[#2563EB]/40 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 group-hover:bg-[#2563EB] group-hover:text-white flex items-center justify-center text-[#2563EB] transition-colors mb-4">
                <Search className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-base text-[#0F172A] group-hover:text-[#2563EB] transition-colors">
                Public Verifier
              </h2>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Public trust verification. Lenders, vendors, and partners verify certificate authenticity by public ID with zero login.
              </p>
            </div>
            <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-[#2563EB]">
              <span>Verify by ID</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>

        {/* Architectural Pillars */}
        <div className="pt-12 border-t border-[#E6E9EF] grid grid-cols-2 md:grid-cols-4 gap-6 text-left text-xs">
          <div>
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-600" />
              Deterministic Core
            </div>
            <p className="text-[#64748B] mt-1">Rule-based validation with 100% mathematical precision.</p>
          </div>
          <div>
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
              Authority Rule
            </div>
            <p className="text-[#64748B] mt-1">AI proposes. Deterministic code validates. Humans approve.</p>
          </div>
          <div>
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-[#2563EB]" />
              Append-Only Auditing
            </div>
            <p className="text-[#64748B] mt-1">Every state transition linked via cryptographic SHA-256 hash chains.</p>
          </div>
          <div>
            <div className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
              Tenant Isolation
            </div>
            <p className="text-[#64748B] mt-1">Org-scoped database boundaries with zero cross-tenant leakage.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E6E9EF] bg-white py-6 text-xs text-[#64748B]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; 2026 Attest Assurance Platform. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/signin" className="hover:text-[#0F172A] transition-colors">
              Sign In
            </Link>
            <Link href="/verify" className="hover:text-[#0F172A] transition-colors">
              Public Verification
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
