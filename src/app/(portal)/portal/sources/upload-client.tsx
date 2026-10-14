"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { formatEnumLabel } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";

export function SourceUploadClient() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("BANK_STATEMENT");
  const [period, setPeriod] = useState("2026-04");
  const [openingBalance, setOpeningBalance] = useState("800000.00"); // 80,000,000 paise
  const [closingBalance, setClosingBalance] = useState("1636500.00"); // 163,650,000 paise
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);
    formData.append("period", period);
    formData.append("openingBalance", openingBalance);
    formData.append("closingBalance", closingBalance);
    formData.append("tier", type === "BANK_STATEMENT" ? "PRIMARY" : type === "LEDGER" ? "SECONDARY" : "CORROBORATING");

    try {
      const res = await fetch("/api/sources/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
      } else {
        setResult(data);
        setFile(null);
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred during document upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-white border border-[#E6E9EF] rounded-xl p-6 shadow-sm space-y-6">
      <div className="border-b border-[#E6E9EF] pb-4">
        <h2 className="text-base font-bold text-[#0F172A] flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-[#2563EB]" />
          Upload Financial Source Document
        </h2>
        <p className="text-xs text-[#64748B] mt-1">
          Direct ingestion with cryptographic SHA-256 hashing, duplicate prevention, and deterministic reconciliation.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-900">
          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold block">Upload Rejected</span>
            <span className="leading-relaxed block">{error}</span>
          </div>
        </div>
      )}

      {/* Result feedback */}
      {result && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
            result.parseStatus === "NEEDS_OCR"
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {result.parseStatus === "NEEDS_OCR" ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          )}
          <div className="space-y-1 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold block">
                {result.parseStatus === "NEEDS_OCR" ? "Requires OCR Processing" : "Document Successfully Ingested"}
              </span>
              <StatusPill rawValue={result.parseStatus} type="status" />
            </div>
            <p className="leading-relaxed">
              {result.message ||
                `File "${result.document?.filename}" processed and indexed.`}
            </p>
            {result.validationResult && (
              <div className="mt-2 font-mono text-[11px] space-y-0.5 text-gray-700">
                <div>Transactions Created: {result.validationResult.createdTransactionsCount}</div>
                <div>
                  Rules Passed:{" "}
                  <span className="text-emerald-700 font-bold">
                    {result.validationResult.stats?.rulesPassed?.join(", ") || "All"}
                  </span>
                </div>
                {result.validationResult.createdExceptionsCount > 0 && (
                  <div className="text-amber-800 font-bold">
                    Exceptions Created: {result.validationResult.createdExceptionsCount}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleUpload} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A]">Document Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
            >
              <option value="BANK_STATEMENT">Bank Statement (.pdf, .csv) — Primary Tier</option>
              <option value="LEDGER">General Ledger Book (.csv) — Secondary Tier</option>
              <option value="INVOICE_REGISTER">Sales / Invoice Register (.csv) — Corroborating Tier</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A]">Statement Period</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="YYYY-MM (e.g. 2026-04)"
              className="mt-1 block w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A]">Stated Opening Balance (PKR)</label>
            <input
              type="text"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="800,000.00"
              className="mt-1 block w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
            />
          </div>
        </div>

        {type === "BANK_STATEMENT" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">Stated Closing Balance (PKR)</label>
              <input
                type="text"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="1,636,500.00"
                className="mt-1 block w-full px-3 py-2 border border-[#E6E9EF] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] font-mono"
              />
              <span className="text-[10px] text-[#64748B] mt-0.5 block">
                Used for R1 statement balance reconciliation check (tolerance 0 paisa).
              </span>
            </div>
          </div>
        )}

        {/* File Picker */}
        <div className="border-2 border-dashed border-[#E6E9EF] rounded-xl p-6 text-center hover:border-blue-400 transition-colors bg-[#F7F8FA]">
          <input
            type="file"
            id="fileInput"
            accept=".csv,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
            <UploadCloud className="w-8 h-8 text-[#64748B] mb-2" />
            <span className="text-xs font-semibold text-[#0F172A]">
              {file ? file.name : "Click to select or drag and drop financial file"}
            </span>
            <span className="text-[11px] text-[#64748B] mt-1">
              Supports .csv and .pdf bank statements (max 15MB)
            </span>
            {file && (
              <span className="mt-2 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {(file.size / 1024).toFixed(1)} KB selected
              </span>
            )}
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !file}
            className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-40 transition-colors flex items-center gap-2 shadow-sm"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Hashing &amp; Validating...</span>
              </>
            ) : (
              <>
                <span>Upload &amp; Run Deterministic Validation</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
