import React from "react";

export type TagVariant = "ok" | "warn" | "crit" | "mut" | "info";

interface TagProps {
  children: React.ReactNode;
  variant?: TagVariant;
  mono?: boolean;
  className?: string;
}

export function Tag({
  children,
  variant = "mut",
  mono = false,
  className = "",
}: TagProps) {
  const variantStyles: Record<TagVariant, string> = {
    ok: "bg-[#E7F5EE] text-[#188A54] border border-[#CBE6D8]",
    warn: "bg-[#FCF2E2] text-[#B45309] border border-[#F0DDBB]",
    crit: "bg-[#FBECEA] text-[#C0362C] border border-[#F2CBC8]",
    mut: "bg-[#F1EFE9] text-[#6E6A61] border border-[#E9E6DF]",
    info: "bg-[#EEEDFB] text-[#4F46E5] border border-[#DCD9F8]",
  };

  return (
    <span
      className={`inline-block text-[10.5px] font-bold tracking-[0.4px] px-2.5 py-0.5 rounded-full whitespace-nowrap ${
        mono ? "font-mono" : ""
      } ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export default Tag;
