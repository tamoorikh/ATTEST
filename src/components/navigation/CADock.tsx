"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  FileSearch,
  Scale,
  CheckCircle2,
  GitCommit,
  PenTool,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Dock, type DockItem } from "@/components/ui/Dock";

export function CADock() {
  const pathname = usePathname();

  const items: DockItem[] = [
    {
      label: "Console Overview",
      href: "/ca",
      icon: <FileSearch className="w-5 h-5" />,
      isActive: pathname === "/ca",
    },
    {
      label: "Review Queue",
      href: "/ca/exceptions",
      icon: <Scale className="w-5 h-5" />,
      badge: 2,
      isActive: pathname.startsWith("/ca/exceptions"),
    },
    {
      label: "Reconciliation Rules",
      href: "/ca/reconciliation",
      icon: <CheckCircle2 className="w-5 h-5" />,
      isActive: pathname === "/ca/reconciliation",
    },
    {
      label: "Audit Hash Chain",
      href: "/ca/audit-trail",
      icon: <GitCommit className="w-5 h-5" />,
      separator: true,
      isActive: pathname === "/ca/audit-trail",
    },
    {
      label: "Sign-Off Chamber",
      href: "/ca/sign-off",
      icon: <PenTool className="w-5 h-5" />,
      isActive: pathname === "/ca/sign-off",
    },
    {
      label: "Client Portal",
      href: "/portal",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: "Public Verifier",
      href: "/verify",
      icon: <ShieldCheck className="w-5 h-5" />,
      separator: true,
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
