"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  Scale,
  GitCommit,
  PenTool,
  LogOut,
  Building,
  UserCheck,
} from "lucide-react";
import { DemoBanner } from "@/components/common/DemoBanner";

const caNavItems = [
  { label: "Console Overview", href: "/ca", icon: FileSearch },
  { label: "Exception Review", href: "/ca/exceptions", icon: Scale, badge: 2 },
  { label: "Reconciliation Engine", href: "/ca/reconciliation", icon: CheckCircle2 },
  { label: "Audit Hash Chain", href: "/ca/audit-trail", icon: GitCommit },
  { label: "Sign-Off Chamber", href: "/ca/sign-off", icon: PenTool },
];

export default function CALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isDemo = session?.user?.isDemo ?? true;
  const orgName = session?.user?.orgName || "Meridian Textiles (Pvt) Ltd";
  const userRole = session?.user?.role || "CA-reviewer";
  const userName = session?.user?.name || "Ayesha Siddiqui, FCA";
  const userEmail = session?.user?.email || "ca@attest.pk";

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      {/* Demo Banner */}
      {isDemo && <DemoBanner orgName={orgName} />}

      {/* CA Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#0B1220] text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & CA Console Title */}
            <div className="flex items-center gap-6">
              <Link href="/ca" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight text-white">Attest</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 font-semibold">
                    CA Assurance Console
                  </span>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-700">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-gray-200">Audit Target: {orgName}</span>
                {isDemo && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-medium">
                    DEMO AUDIT
                  </span>
                )}
              </div>
            </div>

            {/* CA Nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {caNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-300 hover:text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-400 text-[#0B1220]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* CA User & Actions */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-white flex items-center justify-end gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                  {userName}
                </div>
                <div className="text-[11px] font-mono text-gray-400 flex items-center justify-end gap-1">
                  <span className="text-emerald-400 font-semibold">{userRole}</span>
                  <span className="text-gray-500">&bull;</span>
                  <span className="truncate max-w-[120px]">{userEmail}</span>
                </div>
              </div>

              {/* Portal Switcher */}
              <Link
                href="/portal"
                className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-gray-800 text-gray-200 border border-gray-700 font-medium hover:bg-gray-700"
              >
                Client Portal &rarr;
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                title="Sign Out"
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden border-t border-gray-800 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {caNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                  isActive ? "bg-blue-600 text-white" : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-4 text-xs text-gray-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>CA Reviewer Session Authenticated &bull; ICAP Practice Standard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/verify" className="hover:text-gray-900 font-mono text-[11px] underline">
              Public Verifier
            </Link>
            <span className="font-mono text-[10px] text-gray-400">Append-Only Audit Hash Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
