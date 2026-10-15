"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyButtonProps {
  value: string;
  label?: string;
  className?: string;
  showText?: boolean;
}

export function CopyButton({
  value,
  label = "Copy hash",
  className = "",
  showText = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? "Copied to clipboard!" : label}
      aria-label={label}
      className={`inline-flex items-center gap-1 p-1 rounded-md hover:bg-[#F1EFE9] transition-colors text-[#A8A296] hover:text-[#17161A] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4F46E5] ${className}`}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#188A54]" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {showText && (
        <span className="text-[11px] font-sans font-medium">
          {copied ? "Copied" : "Copy"}
        </span>
      )}
    </button>
  );
}
