"use client";

import React, { useState } from "react";
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
  Menu,
  X,
  ChevronRight,
  ArrowUpRight,
  UserCheck,
} from "lucide-react";
import { DemoBanner } from "@/components/common/DemoBanner";

interface NavGroup {
  group: string;
  items: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }>;
}

const caNavGroups: NavGroup[] = [
  {
    group: "ASSURANCE REVIEW",
    items: [
      { label: "Console Overview", href: "/ca", icon: FileSearch },
      { label: "Review Queue", href: "/ca/exceptions", icon: Scale, badge: 2 },
    ],
  },
  {
    group: "VERIFICATION ENGINE",
    items: [
      { label: "Reconciliation Rules", href: "/ca/reconciliation", icon: CheckCircle2 },
      { label: "Audit Hash Chain", href: "/ca/audit-trail", icon: GitCommit },
    ],
  },
  {
    group: "CERTIFICATION",
    items: [
      { label: "Sign-Off Chamber", href: "/ca/sign-off", icon: PenTool },
    ],
  },
];

export default function CALayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDemo = session?.user?.isDemo ?? true;
  const orgName = session?.user?.orgName || "Meridian Textiles (Pvt) Ltd";
  const userRole = session?.user?.role || "CA-reviewer";
  const userName = session?.user?.name || "Ayesha Siddiqui, FCA";
  const userEmail = session?.user?.email || "ca@attest.pk";

  const getPageTitle = () => {
    for (const group of caNavGroups) {
      const match = group.items.find((i) => i.href === pathname);
      if (match) return match.label;
    }
    if (pathname.includes("/exceptions")) return "Review Queue";
    if (pathname.includes("/sign-off")) return "Sign-Off Chamber";
    return "CA Console";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-200 border-r border-slate-800">
      {/* Brand & Organization Top */}
      <div className="p-4 border-b border-slate-800">
        <Link href="/ca" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] tracking-tight text-white leading-none">
              Attest
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 mt-0.5">
              CA Console
            </span>
          </div>
        </Link>

        {/* Audit Target */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-xs font-medium text-slate-300 truncate">
              {orgName}
            </span>
          </div>
          {isDemo && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-800/50 font-bold shrink-0 ml-1">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {caNavGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">
              {group.group}
            </div>
            <div className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-[#2563EB] text-white font-semibold"
                        : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-white" : "text-slate-400"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-white text-[#2563EB]"
                            : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Reviewer Identity Footer */}
      <div className="p-3 border-t border-slate-800 bg-[#0B1220]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              CA
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-white truncate">
                {userName}
              </span>
              <span className="text-[10px] text-blue-400 font-mono truncate">
                Licensed ICAP #48921
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            title="Sign Out"
            className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F172A]">
      {/* Desktop Fixed Sidebar (240px) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-60 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content (offset left 240px on desktop) */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Slim Top Bar */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-[#E6E9EF] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-[#64748B] hover:bg-slate-100"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#64748B]">Assurance</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-sm font-semibold text-[#0F172A]">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EFF6FF] text-[#2563EB] text-xs font-semibold hover:bg-blue-100 transition-colors"
            >
              <span>Switch to Client Portal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </header>

        {/* Demo Banner */}
        {isDemo && <DemoBanner orgName={orgName} />}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
