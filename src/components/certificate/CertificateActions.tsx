"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Copy, Check, Download, Printer, ExternalLink } from "lucide-react";

interface CertificateActionsProps {
  publicId: string;
  jsonExportData: Record<string, unknown> | null;
}

export function CertificateActions({ publicId, jsonExportData }: CertificateActionsProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const url = `${window.location.origin}/verify/${publicId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadJson() {
    if (!jsonExportData) return;
    const blob = new Blob([JSON.stringify(jsonExportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `certificate-${publicId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Copy Public URL */}
      <button
        onClick={handleCopy}
        id="btnCopyPublicUrl"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E9EF] bg-white hover:bg-gray-50 text-xs font-semibold text-[#0F172A] transition-colors shadow-sm"
      >
        {copied ? (
          <>
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-emerald-700">Copied URL!</span>
          </>
        ) : (
          <>
            <Copy className="w-3.5 h-3.5 text-[#64748B]" />
            <span>Copy Public URL</span>
          </>
        )}
      </button>

      {/* Download JSON */}
      <button
        onClick={handleDownloadJson}
        id="btnDownloadJson"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E9EF] bg-white hover:bg-gray-50 text-xs font-semibold text-[#0F172A] transition-colors shadow-sm"
      >
        <Download className="w-3.5 h-3.5 text-[#64748B]" />
        <span>Download JSON</span>
      </button>

      {/* Download PDF / Print */}
      <Link
        href={`/portal/certificate/print`}
        id="btnDownloadPdf"
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#E6E9EF] bg-white hover:bg-gray-50 text-xs font-semibold text-[#0F172A] transition-colors shadow-sm"
      >
        <Printer className="w-3.5 h-3.5 text-[#64748B]" />
        <span>Download PDF / Print</span>
      </Link>

      {/* Public Verifier Link */}
      <Link
        href={`/verify/${publicId}`}
        target="_blank"
        id="btnPublicVerify"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-sm"
      >
        <span>Public Verifier</span>
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
