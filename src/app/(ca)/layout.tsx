"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  FileSearch,
  Scale,
  CheckCircle2,
  GitCommit,
  PenTool,
  LogOut,
  Building,
  Menu,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { DemoBanner } from "@/components/common/DemoBanner";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GraffitiBackdrop } from "@/components/ui/GraffitiBackdrop";

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
    <div className="flex flex-col h-full bg-white/92 backdrop-blur-md border-r border-[#E9E6DF]">
      {/* Brand & Organization Top */}
      <div className="p-4 border-b border-[#E9E6DF]">
        <Link href="/ca" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-[#4F46E5] flex items-center justify-center text-white shadow-sm shrink-0">
            <svg width="16" height="16" viewBox="0 0 32 32">
              <path d="M11 16.5l4 4 9.5-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-heading font-extrabold text-[16px] tracking-tight text-[#17161A] leading-none">
              Attest
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-[#4F46E5] mt-0.5">
              CA Console
            </span>
          </div>
        </Link>

        {/* Audit Target */}
        <div className="mt-3 pt-3 border-t border-[#F1EFE9] flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Building className="w-3.5 h-3.5 text-[#A8A296] shrink-0" />
            <span className="text-xs font-semibold text-[#17161A] truncate" title={orgName}>
              {orgName}
            </span>
          </div>
          {isDemo && (
            <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-[#FCF2E2] text-[#B45309] font-mono shrink-0">
              DEMO
            </span>
          )}
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {caNavGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <span className="px-3 text-[10px] font-bold tracking-wider text-[#A8A296] uppercase block mb-1">
              {group.group}
            </span>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#EEEDFB] text-[#4F46E5] font-bold"
                        : "text-[#6E6A61] hover:text-[#17161A] hover:bg-[#F1EFE9]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-[#4F46E5]" : "text-[#A8A296]"
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-[#4F46E5] text-white"
                            : "bg-[#FCF2E2] text-[#B45309]"
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
      <div className="p-3 border-t border-[#E9E6DF] bg-white/70">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#17161A] text-white flex items-center justify-center text-xs font-bold shrink-0">
              {userName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-[#17161A] truncate">
                {userName}
              </span>
              <span className="text-[11px] text-[#6E6A61] truncate font-mono">
                {userRole}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            title="Sign Out"
            className="p-1.5 rounded-lg text-[#A8A296] hover:text-[#C0362C] hover:bg-[#FBECEA] transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#17161A]">
      {/* Decorative Whisper Graffiti Layer */}
      <GraffitiBackdrop />

      {/* Desktop Fixed Sidebar (240px) */}
      <aside className="hidden md:block fixed inset-y-0 left-0 w-60 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-[#17161A]/40 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10 shadow-2xl">
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="relative z-10 md:pl-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="sticky top-0 z-20 h-14 bg-[#FAF9F6]/85 backdrop-blur-md border-b border-[#E9E6DF] flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-1.5 rounded-lg text-[#6E6A61] hover:bg-[#F1EFE9] cursor-pointer"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#6E6A61]">CA Console</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#A8A296]" />
              <span className="text-sm font-semibold text-[#17161A]">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/verify"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-[#6E6A61] hover:text-[#4F46E5] font-semibold transition-colors"
            >
              <span>Public Verifier</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>

            <NotificationBell />

            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#E9E6DF] bg-white text-xs font-semibold text-[#17161A] hover:bg-[#F1EFE9] transition-colors"
            >
              <span>Client Portal</span>
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
