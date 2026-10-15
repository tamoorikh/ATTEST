import React from "react";
import Link from "next/link";
import { ShieldCheck, Search, LogIn, ExternalLink } from "lucide-react";

export default function PublicVerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-[#17161A]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#E9E6DF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/verify" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-sm tracking-tight text-[#0F172A]">Attest</span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#64748B]">
                  Public Verifier
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-[#64748B] font-mono">
                No Login Required &bull; Public Trust Network
              </span>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E6E9EF] bg-white hover:bg-[#F7F8FA] text-xs font-semibold text-[#0F172A] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#64748B]" />
                <span>Portal Sign In</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E9E6DF] bg-white/80 py-6 text-xs text-[#6E6A63] text-center">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            Attest Public Financial Assurance Registry &bull; Verified via Append-Only Audit Trail
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>Deterministic SHA-256</span>
            <span className="text-gray-300">&bull;</span>
            <span>Zero-Trust Verification</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
