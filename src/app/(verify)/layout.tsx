import React from "react";
import Link from "next/link";
import { ShieldCheck, Search, LogIn, ExternalLink } from "lucide-react";

export default function PublicVerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/verify" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0B1220] flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-[#2456E6]" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-[#0B1220]">Attest</span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">
                  Public Verifier
                </span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-xs text-gray-500 font-mono">
                No Login Required &bull; Public Trust Network
              </span>
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-xs font-medium text-gray-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-gray-400" />
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
      <footer className="border-t border-gray-200 bg-white py-6 text-xs text-gray-500 text-center">
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
