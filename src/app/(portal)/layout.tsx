"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ShieldCheck,
  LayoutDashboard,
  ReceiptText,
  BookOpen,
  AlertOctagon,
  FileText,
  Award,
  LogOut,
  Building,
  UserCheck,
} from "lucide-react";
import { DemoBanner } from "@/components/common/DemoBanner";

const navItems = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
  { label: "Bank Transactions", href: "/portal/transactions", icon: ReceiptText },
  { label: "General Ledger", href: "/portal/ledger", icon: BookOpen },
  { label: "Exceptions", href: "/portal/exceptions", icon: AlertOctagon, badge: 2 },
  { label: "Documents", href: "/portal/documents", icon: FileText },
  { label: "Trust Certificate", href: "/portal/certificate", icon: Award },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isDemo = session?.user?.isDemo ?? true;
  const orgName = session?.user?.orgName || "Meridian Textiles (Pvt) Ltd";
  const userRole = session?.user?.role || "Owner";
  const userEmail = session?.user?.email || "demo@attest.pk";

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      {/* Demo Banner */}
      {isDemo && <DemoBanner orgName={orgName} />}

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand & Organization */}
            <div className="flex items-center gap-6">
              <Link href="/portal" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#0B1220] flex items-center justify-center text-white">
                  <ShieldCheck className="w-5 h-5 text-[#2456E6]" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm tracking-tight text-[#0B1220]">Attest</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-gray-500">Client Portal</span>
                </div>
              </Link>

              <div className="hidden md:flex items-center gap-2 pl-4 border-l border-gray-200">
                <Building className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-semibold text-[#0B1220]">{orgName}</span>
                {isDemo && (
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    DEMO
                  </span>
                )}
              </div>
            </div>

            {/* Nav links */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#0B1220] text-white shadow-sm"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-amber-400 text-[#0B1220]"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User and Switchers */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-[#0B1220]">{session?.user?.name || "Tariq Mahmood"}</div>
                <div className="text-[11px] font-mono text-gray-500 flex items-center justify-end gap-1">
                  <span>{userRole}</span>
                  <span className="text-gray-300">&bull;</span>
                  <span className="truncate max-w-[120px]">{userEmail}</span>
                </div>
              </div>

              {/* Quick link to CA console if user is CA */}
              {userRole === "CA-reviewer" && (
                <Link
                  href="/ca"
                  className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-blue-50 text-[#2456E6] border border-blue-200 font-medium hover:bg-blue-100"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  CA Console
                </Link>
              )}

              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                title="Sign Out"
                className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden border-t border-gray-200 px-4 py-2 flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ${
                  isActive ? "bg-[#0B1220] text-white" : "text-gray-600 hover:bg-gray-100"
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
          <div>
            Attest Continuous Assurance Platform &bull; Deterministic Engine v1.0.0
          </div>
          <div className="flex items-center gap-4">
            <Link href="/verify" className="hover:text-gray-900 font-mono text-[11px] underline">
              Public Verifier
            </Link>
            <span className="font-mono text-[10px] text-gray-400">Strict Tenant Isolation Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
