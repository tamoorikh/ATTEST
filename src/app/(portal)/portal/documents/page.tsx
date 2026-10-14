import React from "react";
import { FileText, Shield, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";

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
          <h1 className="text-xl font-bold tracking-tight text-[#0B1220]">
            Source Financial Documents
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Cryptographic storage with SHA-256 integrity verification since upload.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0B1220] hover:bg-black text-white text-xs font-medium shadow-sm transition-colors"
        >
          <FileText className="w-4 h-4" />
          Upload New Statement
        </button>
      </div>

      {/* Integrity Transparency Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Shield className="w-4 h-4 text-[#2456E6] mt-0.5 shrink-0" />
        <div>
          <span className="font-semibold block mb-0.5">Cryptographic Integrity Notice</span>
          <span>
            A cryptographic SHA-256 hash proves <strong>integrity-since-upload</strong>, meaning the file has not been altered or tampered with since ingestion. It does not certify the legal provenance or veracity of the original source.
          </span>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F7F5] text-gray-600 font-semibold border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Document Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Tier</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
                <th className="py-3 px-4">Parse Status</th>
                <th className="py-3 px-4 text-right">Size</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/70">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-[#0B1220]">{doc.filename}</span>
                        <div className="text-[10px] text-gray-400">Uploaded by {doc.uploadedBy?.name || "System"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600 font-medium">
                    {doc.type}
                  </td>
                  <td className="py-3 px-4 font-mono text-gray-600">
                    {doc.period}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700">
                      {doc.tier}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                    <span className="bg-gray-50 px-2 py-1 rounded border border-gray-200 truncate inline-block max-w-[180px]">
                      {doc.sha256}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {doc.parseStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-500">
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
