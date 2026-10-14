import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SourceUploadClient } from "./upload-client";
import { Shield, FileText, CheckCircle2, Download, AlertTriangle } from "lucide-react";

export default async function SourcesPage() {
  const session = await getServerSession(authOptions);
  const orgId = session?.user?.orgId;

  const docs = await prisma.sourceDocument.findMany({
    where: { orgId: orgId || undefined },
    include: {
      uploadedBy: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const processingRuns = await prisma.processingRun.findMany({
    where: { orgId: orgId || undefined },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1220]">
          Source Documents & Ingestion Workspace
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Upload bank statements (.pdf, .csv), general ledger books (.csv), and invoice registers (.csv).
        </p>
      </div>

      {/* Upload Client Component */}
      <SourceUploadClient />

      {/* Cryptographic Integrity Notice adhering to Honesty Rules */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#2456E6] mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">Cryptographic Integrity Notice</span>
          <span>
            A cryptographic SHA-256 hash proves <strong>integrity-since-upload</strong>, meaning the file has not been altered or tampered with since ingestion. It does not certify the legal provenance or veracity of the original source.
          </span>
        </div>
      </div>

      {/* Ingested Source Documents List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:px-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0B1220]">Ingested Documents Repository</h2>
            <p className="text-xs text-gray-500">{docs.length} documents securely stored</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Type / Tier</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Parse Status</th>
                <th className="py-3 px-4 text-right">Size</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                      <div>
                        <span className="font-semibold text-[#0B1220]">{doc.filename}</span>
                        <div className="text-[10px] text-gray-400">By {doc.uploadedBy?.name || "System"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-gray-800 font-semibold">{doc.type}</div>
                    <span className="text-[10px] uppercase font-bold text-gray-400">{doc.tier}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">{doc.period}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                    <span className="bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate inline-block max-w-[160px]">
                      {doc.sha256}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {doc.parseStatus === "PARSED" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        PARSED
                      </span>
                    ) : doc.parseStatus === "NEEDS_OCR" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        NEEDS_OCR
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                        {doc.parseStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-500">
                    {(doc.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-3 px-4 text-center">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      download
                      className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:text-black hover:bg-gray-100 inline-flex items-center"
                      title="Download original file"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Processing Runs (Audit trail) */}
      {processingRuns.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#0B1220]">
            Deterministic Processing Runs History ({processingRuns.length})
          </h3>
          <div className="space-y-2">
            {processingRuns.map((run) => {
              let stats: any = {};
              try {
                stats = JSON.parse(run.statsJson);
              } catch (e) {}

              return (
                <div key={run.id} className="p-3 rounded-lg border border-gray-200 bg-[#FAF9F7] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0B1220]">Run {run.id.substring(0, 10)}...</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-800">
                        {run.period}
                      </span>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          run.status === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      Tx Count: {stats.totalBankTransactions ?? "—"} &bull; R1 Balance: {stats.r1BalanceReconciliation?.passed ? "Passed ✓" : "Mismatch ✗"} &bull; R2 Chain: {stats.r2RunningBalancesChain?.passed ? "Passed ✓" : "Broken ✗"}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-gray-400">
                    {run.createdAt.toISOString().replace("T", " ").substring(0, 19)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
