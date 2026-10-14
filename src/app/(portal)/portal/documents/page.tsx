import React from "react";
import Link from "next/link";
import { FileText, Shield, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatEnumLabel, formatShortHash } from "@/lib/labels";
import { StatusPill } from "@/components/ui/StatusPill";
import { CopyButton } from "@/components/ui/CopyButton";

export default async function DocumentsPage() {
  const org = await prisma.organization.findFirst({
    where: { isDemo: true },
    include: {
      sourceDocuments: {
        include: { uploadedBy: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const docs = org?.sourceDocuments || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-[#0F172A]">
            Source Financial Documents
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Cryptographic storage with SHA-256 integrity verification since upload.
          </p>
        </div>

        <Link
          href="/portal/sources"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Upload Workspace</span>
        </Link>
      </div>

      {/* Integrity Transparency Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#2563EB] mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">Cryptographic Integrity Notice</span>
          <span className="leading-relaxed">
            A cryptographic SHA-256 hash proves <strong>integrity-since-upload</strong>, meaning the file has not been altered or tampered with since ingestion. It does not certify the legal provenance or veracity of the original source.
          </span>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F8FA] text-[#64748B] font-semibold border-b border-[#E6E9EF]">
              <tr>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Parse Status</th>
                <th className="py-3 px-4 text-right">Size</th>
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
                        <div className="text-[10px] text-[#64748B]">Uploaded by {doc.uploadedBy?.name || "System"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-[#0F172A]">
                    {formatEnumLabel(doc.type)}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#0F172A]">
                    {doc.period}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200">
                      {formatEnumLabel(doc.tier)}
                    </span>
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
