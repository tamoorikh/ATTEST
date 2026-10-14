"use client";

import React, { useState } from "react";
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
  Menu,
  X,
  ChevronRight,
  FolderOpen,
  ArrowUpRight,
} from "lucide-react";
import { DemoBanner } from "@/components/common/DemoBanner";
import { NotificationBell } from "@/components/notifications/NotificationBell";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: "OVERVIEW",
    items: [
      { label: "Dashboard", href: "/portal", icon: LayoutDashboard },
    ],
  },
  {
    group: "VERIFICATION",
    items: [
      { label: "Sources & Upload", href: "/portal/sources", icon: FileText },
      { label: "Bank Transactions", href: "/portal/transactions", icon: ReceiptText },
      { label: "General Ledger", href: "/portal/ledger", icon: BookOpen },
      { label: "Document Store", href: "/portal/documents", icon: FolderOpen },
    ],
  },
  {
    group: "WORKFLOW",
    items: [
      { label: "Exceptions", href: "/portal/exceptions", icon: AlertOctagon, badge: 2 },
      { label: "Trust Certificate", href: "/portal/certificate", icon: Award },
    ],
  },
  {
    group: "SETTINGS",
    items: [
      { label: "Onboarding Wizard", href: "/portal/onboarding", icon: Building },
    ],
  },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isDemo = session?.user?.isDemo ?? true;
  const orgName = session?.user?.orgName || "Meridian Textiles (Pvt) Ltd";
  const userRole = session?.user?.role || "Owner";
  const userEmail = session?.user?.email || "demo@attest.pk";
  const userName = session?.user?.name || "Tariq Mahmood";

  const getPageTitle = () => {
    for (const group of navGroups) {
      const match = group.items.find((i) => i.href === pathname);
      if (match) return match.label;
    }
    if (pathname.includes("/transactions")) return "Bank Transactions";
    if (pathname.includes("/exceptions")) return "Exceptions Resolution";
    if (pathname.includes("/sources")) return "Sources & Ingestion";
    return "Portal";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white border-r border-[#E6E9EF]">
      {/* Brand & Organization Top */}
      <div className="p-4 border-b border-[#E6E9EF]">
        <Link href="/portal" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2563EB] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-[15px] tracking-tight text-[#0F172A] leading-none">
              Attest
            </span>
            <span className="text-[10.5px] uppercase font-mono tracking-wider text-[#64748B] mt-0.5">
              Client Portal
            </span>
          </div>
        </Link>

        {/* Company Badge */}
        <div className="mt-3.5 pt-3 border-t border-[#E6E9EF] flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
            <span className="text-xs font-semibold text-[#0F172A] truncate">
              {orgName}
            </span>
          </div>
          {isDemo && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-[#D97706] border border-amber-200 font-bold shrink-0 ml-1">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-2.5 text-[10.5px] font-bold uppercase tracking-wider text-[#64748B]">
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
                        ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-[#2563EB]" : "text-[#64748B]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-[#2563EB] text-white"
                            : "bg-amber-100 text-[#D97706]"
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

      {/* User Footer */}
      <div className="p-3 border-t border-[#E6E9EF] bg-[#F7F8FA]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#0F172A] truncate">
                {userName}
              </span>
              <span className="text-[11px] text-[#64748B] truncate">
                {userRole}
              </span>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            title="Sign Out"
            className="p-1.5 rounded-md text-[#64748B] hover:text-[#DC2626] hover:bg-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F172A]">
      {/* Fixed Desktop Sidebar (240px) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-60 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Wrapper (shifted left 240px on desktop) */}
      <div className="md:pl-60 flex flex-col min-h-screen">
        {/* Slim Top Navigation Bar */}
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
              <span className="text-xs font-medium text-[#64748B]">Portal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span className="text-sm font-semibold text-[#0F172A]">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#64748B] hover:text-[#2563EB] font-medium"
            >
              <span>Public Verifier</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <NotificationBell />

            {userRole === "CA-reviewer" && (
              <Link
                href="/ca"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F172A] text-white text-xs font-medium hover:bg-slate-800 transition-colors"
              >
                <span>CA Console</span>
              </Link>
            )}
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
