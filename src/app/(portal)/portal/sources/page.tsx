import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SourceUploadClient } from "./upload-client";
import { Shield, FileText, CheckCircle2, Download, AlertTriangle } from "lucide-react";
import { formatEnumLabel, formatShortHash } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyButton } from "@/components/ui/CopyButton";

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
        <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
          Source Documents &amp; Ingestion Workspace
        </h1>
        <p className="text-xs text-[#64748B] mt-1">
          Upload bank statements (.pdf, .csv), general ledger books (.csv), and invoice registers (.csv).
        </p>
      </div>

      {/* Upload Client Component */}
      <SourceUploadClient />

      {/* Cryptographic Integrity Notice adhering to Honesty Rules */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">Cryptographic Integrity Notice</span>
          <span className="leading-relaxed">
            A cryptographic SHA-256 hash proves <strong>integrity-since-upload</strong>, meaning the file has not been altered or tampered with since ingestion. It does not certify the legal provenance or veracity of the original source.
          </span>
        </div>
      </div>

      {/* Ingested Source Documents List */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:px-6 border-b border-[#E6E9EF] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A]">Ingested Documents Repository</h2>
            <p className="text-xs text-[#64748B]">{docs.length} documents securely stored</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#64748B] font-semibold border-b border-[#E6E9EF]">
              <tr>
                <th className="py-3 px-4">Filename</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Parse Status</th>
                <th className="py-3 px-4 text-right">Size</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E6E9EF]">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#64748B] shrink-0" />
                      <div>
                        <span className="font-semibold text-[#0F172A]">{doc.filename}</span>
                        <div className="text-[10px] text-[#64748B]">By {doc.uploadedBy?.name || "System"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">
                    {formatEnumLabel(doc.type)}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] uppercase font-bold text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {formatEnumLabel(doc.tier)}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#0F172A]">{doc.period}</td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center gap-1.5 bg-[#F7F8FA] px-2 py-0.5 rounded border border-[#E6E9EF]">
                      <span className="font-mono text-xs font-semibold text-[#2563EB]">
                        {formatShortHash(doc.sha256, 8)}
                      </span>
                      <CopyButton value={doc.sha256} label="Copy SHA-256 hash" />
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusPill rawValue={doc.parseStatus} type="status" />
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#64748B]">
                    {(doc.size / 1024).toFixed(1)} KB
                  </td>
                  <td className="py-3 px-4 text-center">
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      download
                      className="p-1.5 rounded-lg border border-[#E6E9EF] text-[#64748B] hover:text-[#0F172A] hover:bg-[#F7F8FA] inline-flex items-center transition-colors"
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
        <div className="bg-white border border-[#E6E9EF] rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-[#0F172A]">
            Deterministic Processing Runs History ({processingRuns.length})
          </h3>
          <div className="space-y-2">
            {processingRuns.map((run) => {
              let stats: any = {};
              try {
                stats = JSON.parse(run.statsJson);
              } catch (e) {}

              return (
                <div
                  key={run.id}
                  className="p-3.5 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F172A]">
                        Run {formatShortHash(run.id, 8)}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white text-[#0F172A] border border-[#E6E9EF]">
                        {run.period}
                      </span>
                      <StatusPill rawValue={run.status} type="status" />
                    </div>
                    <div className="text-[11px] text-[#64748B] mt-1">
                      Bank Transactions: {stats.totalBankTransactions ?? "—"} &bull; R1 Balance: {stats.r1BalanceReconciliation?.passed ? "Passed ✓" : "Mismatch ✗"} &bull; R2 Chain: {stats.r2RunningBalancesChain?.passed ? "Passed ✓" : "Broken ✗"}
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-[#64748B]">
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
