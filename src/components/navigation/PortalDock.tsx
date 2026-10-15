"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  ReceiptText,
  BookOpen,
  AlertOctagon,
  Award,
  Share2,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Dock, type DockItem } from "@/components/ui/Dock";

export function PortalDock() {
  const pathname = usePathname();

  // If in print view, do not render dock
  if (pathname === "/portal/certificate/print") {
    return null;
  }

  const items: DockItem[] = [
    {
      label: "Dashboard",
      href: "/portal",
      icon: <LayoutDashboard className="w-5 h-5" />,
      isActive: pathname === "/portal",
    },
    {
      label: "Sources & Upload",
      href: "/portal/sources",
      icon: <FileText className="w-5 h-5" />,
      isActive: pathname === "/portal/sources",
    },
    {
      label: "Bank Transactions",
      href: "/portal/transactions",
      icon: <ReceiptText className="w-5 h-5" />,
      isActive: pathname === "/portal/transactions",
    },
    {
      label: "General Ledger",
      href: "/portal/ledger",
      icon: <BookOpen className="w-5 h-5" />,
      isActive: pathname === "/portal/ledger",
    },
    {
      label: "Exceptions Desk",
      href: "/portal/exceptions",
      icon: <AlertOctagon className="w-5 h-5" />,
      badge: 2,
      separator: true,
      isActive: pathname.startsWith("/portal/exceptions"),
    },
    {
      label: "Trust Certificate",
      href: "/portal/certificate",
      icon: <Award className="w-5 h-5" />,
      isActive: pathname === "/portal/certificate",
    },
    {
      label: "Evidence Sharing",
      href: "/portal/sharing",
      icon: <Share2 className="w-5 h-5" />,
      isActive: pathname === "/portal/sharing",
    },
    {
      label: "Public Verifier",
      href: "/verify",
      icon: <ShieldCheck className="w-5 h-5" />,
      separator: true,
      isActive: pathname.startsWith("/verify"),
    },
    {
      label: "Sign Out",
      icon: <LogOut className="w-5 h-5 text-[#C0362C]" />,
      onClick: () => signOut({ callbackUrl: "/auth/signin" }),
    },
  ];

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 pointer-events-auto max-w-[calc(100vw-2rem)]">
      <Dock
        items={items}
        magnification={1.75}
        distance={110}
        iconSize={42}
        borderRadius={20}
        className="bg-white/88 border-[#E9E6DF] shadow-[0_12px_40px_-12px_rgba(23,22,26,0.18)] backdrop-blur-xl"
      />
    </div>
  );
}
