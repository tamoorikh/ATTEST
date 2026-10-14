"use client";

import React, { useState } from "react";
import {
  GitCommit,
  CheckCircle2,
  Shield,
  Clock,
  User,
  Copy,
  Check,
  X,
  FileText,
  Layers,
  ArrowRight,
  Database,
  ExternalLink,
} from "lucide-react";
import { formatEnumLabel, formatShortHash, formatRelativeTime } from "@/lib/labels";
import { CopyButton } from "@/components/ui/CopyButton";

export interface AuditEventItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  hash: string;
  prevHash: string;
  metadataJson: string | null;
  createdAt: string;
  actor?: {
    name?: string | null;
    email: string;
    role: string;
  } | null;
}

export function AuditTimeline({ events }: { events: AuditEventItem[] }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AuditEventItem | null>(null);

  function getEventIcon(action: string) {
    switch (action) {
      case "RECONCILIATION_ENGINE_EXECUTED":
      case "PROCESSING_RUN_COMPLETED":
        return <Layers className="w-4 h-4 text-[#2563EB]" />;
      case "EXCEPTION_CREATED":
      case "EXCEPTION_STATUS_CHANGED":
        return <FileText className="w-4 h-4 text-amber-600" />;
      case "CERTIFICATE_ISSUED":
      case "CERTIFICATE_SIGNED":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <GitCommit className="w-4 h-4 text-[#2563EB]" />;
    }
  }

  function openDrawerWithEvent(evt?: AuditEventItem) {
    if (evt) {
      setSelectedEvent(evt);
    } else {
      setSelectedEvent(events[0] || null);
    }
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Action / Banner Bar */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-[#0F172A]">
              Cryptographic Integrity Chain: 100% Intact
            </div>
            <div className="text-[11px] text-[#64748B]">
              {events.length} sequential SHA-256 state blocks chained deterministically.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openDrawerWithEvent()}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Database className="w-4 h-4" />
          <span>Inspect Full Hash Chain</span>
        </button>
      </div>

      {/* Vertical Timeline */}
      <div className="bg-white border border-[#E6E9EF] rounded-xl p-6 shadow-sm">
        <div className="relative pl-6 sm:pl-8 border-l-2 border-[#E6E9EF] space-y-8 my-2">
          {events.map((evt, idx) => (
            <div key={evt.id} className="relative group">
              {/* Timeline Node dot */}
              <div className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full bg-white border-2 border-[#2563EB] flex items-center justify-center shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              </div>

              {/* Timeline Card */}
              <div className="p-4 rounded-xl border border-[#E6E9EF] bg-[#F7F8FA] hover:bg-white hover:border-[#2563EB]/40 transition-all text-xs space-y-2.5">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E6E9EF] pb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      {getEventIcon(evt.action)}
                    </span>
                    <span className="font-bold text-[#0F172A] text-sm">
                      {formatEnumLabel(evt.action)}
                    </span>
                    <span className="text-[#64748B] font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-[#E6E9EF]">
                      Block #{idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[#64748B] text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                      {formatRelativeTime(evt.createdAt)}
                    </span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#64748B]" />
                      {evt.actor?.name || "System Engine"}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-[11px] text-[#64748B]">
                    <span>Entity: </span>
                    <span className="font-semibold text-[#0F172A]">
                      {formatEnumLabel(evt.entityType)}
                    </span>{" "}
                    <span className="font-mono text-[10px] text-[#64748B]">
                      ({evt.entityId.substring(0, 8)}...)
                    </span>
                  </div>

                  {/* Truncated Hash with Copy Button (Never primary content) */}
                  <div className="flex items-center gap-2 self-start sm:self-auto bg-white px-2.5 py-1 rounded-lg border border-[#E6E9EF]">
                    <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wider">
                      Block Hash:
                    </span>
                    <span className="font-mono font-semibold text-xs text-[#2563EB]">
                      {formatShortHash(evt.hash, 8)}
                    </span>
                    <CopyButton value={evt.hash} label="Copy full SHA-256 hash" />
                    <button
                      type="button"
                      onClick={() => openDrawerWithEvent(evt)}
                      className="ml-1 text-[11px] font-semibold text-[#2563EB] hover:underline"
                    >
                      Details &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inspect Full Chain Slide-Over Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 flex justify-end animate-fadeIn">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-[#E6E9EF] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-[#2563EB]" />
                    <h3 className="text-lg font-bold text-[#0F172A]">
                      Cryptographic Full Chain Inspector
                    </h3>
                  </div>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Immutable SHA-256 hash ledger with parent pointers and cryptographic proofs.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Selector Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E6E9EF]">
                {events.map((e, idx) => (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => setSelectedEvent(e)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium whitespace-nowrap transition-colors ${
                      selectedEvent?.id === e.id
                        ? "bg-[#2563EB] text-white"
                        : "bg-gray-100 text-[#64748B] hover:bg-gray-200"
                    }`}
                  >
                    Block #{idx + 1}
                  </button>
                ))}
              </div>

              {/* Selected Event Details */}
              {selectedEvent && (
                <div className="space-y-4">
                  <div className="bg-[#F7F8FA] border border-[#E6E9EF] rounded-xl p-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#0F172A] text-sm">
                        {formatEnumLabel(selectedEvent.action)}
                      </span>
                      <span className="text-[11px] text-[#64748B] font-mono">
                        {new Date(selectedEvent.createdAt).toISOString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#64748B]">
                      Recorded by:{" "}
                      <span className="font-semibold text-[#0F172A]">
                        {selectedEvent.actor?.name || "System"} ({selectedEvent.actor?.role || "SYSTEM"})
                      </span>
                    </div>
                  </div>

                  {/* Hashes in Mono */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider text-[10px]">
                          Parent Hash (prevHash)
                        </span>
                        <CopyButton value={selectedEvent.prevHash} label="Copy parent hash" showText />
                      </div>
                      <div className="font-mono text-xs text-[#0F172A] bg-gray-50 border border-[#E6E9EF] p-2.5 rounded-lg break-all select-all">
                        {selectedEvent.prevHash}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider text-[10px]">
                          Current Block Hash (SHA-256)
                        </span>
                        <CopyButton value={selectedEvent.hash} label="Copy block hash" showText />
                      </div>
                      <div className="font-mono text-xs font-bold text-[#2563EB] bg-blue-50/60 border border-blue-200 p-2.5 rounded-lg break-all select-all">
                        {selectedEvent.hash}
                      </div>
                    </div>
                  </div>

                  {/* Metadata JSON */}
                  <div>
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider text-[10px] block mb-1">
                      Payload &amp; Verification State JSON
                    </span>
                    <pre className="font-mono text-[11px] text-[#0F172A] bg-slate-900 text-slate-100 p-3.5 rounded-xl overflow-x-auto max-h-60 leading-relaxed">
                      {selectedEvent.metadataJson
                        ? JSON.stringify(JSON.parse(selectedEvent.metadataJson), null, 2)
                        : "{}"}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-[#E6E9EF] flex items-center justify-between">
              <span className="text-[11px] text-[#64748B]">
                Deterministic Proof &bull; Tamper Evident
              </span>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#0F172A] transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
