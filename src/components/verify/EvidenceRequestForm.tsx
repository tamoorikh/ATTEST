"use client";

import React, { useState } from "react";
import { FileLock2, Send, CheckCircle2, XCircle } from "lucide-react";

interface EvidenceRequestFormProps {
  certificatePublicId: string;
  period: string;
}

export function EvidenceRequestForm({ certificatePublicId, period }: EvidenceRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [org, setOrg] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [categories, setCategories] = useState<string[]>(["BANK_STATEMENT", "LEDGER"]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || purpose.trim().length < 10) {
      setErrorMsg("Please complete all required fields (purpose must be min 10 characters).");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/disclosures/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          certificatePublicId,
          requesterName: name.trim(),
          requesterOrg: org.trim() || undefined,
          requesterEmail: email.trim(),
          purpose: purpose.trim(),
          categories,
          period,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit request");

      setSuccess(true);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Error submitting request");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="border border-[#188A54]/30 rounded-2xl p-6 bg-[#188A54]/10 text-xs text-[#17161A] space-y-2">
        <div className="flex items-center gap-2 font-bold text-sm text-[#188A54]">
          <CheckCircle2 className="w-5 h-5 text-[#188A54]" />
          <span>Evidence Pack Request Submitted</span>
        </div>
        <p className="leading-relaxed text-[#6E6A63]">
          Your request for supporting evidence has been transmitted to the authorized client owner for review. If approved, a cryptographically signed, 7-day expiring download package will be delivered to <strong>{email}</strong>.
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="border border-[#E9E6DF] rounded-2xl p-6 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-[#17161A] flex items-center gap-2">
            <FileLock2 className="w-4 h-4 text-[#4F46E5]" />
            Request Supporting Evidence Package
          </h3>
          <p className="text-xs text-[#6E6A63] mt-1">
            Commercial lenders and verified counterparties may request read-only access to underlying supporting documents.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          id="btnOpenEvidenceRequest"
          className="px-4 py-2.5 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-sm shrink-0"
        >
          Request Supporting Evidence
        </button>
      </div>
    );
  }

  return (
    <div className="border border-[#E9E6DF] rounded-2xl p-6 bg-white shadow-sm space-y-4 text-xs">
      <div className="flex items-center justify-between border-b border-[#E9E6DF] pb-3">
        <div>
          <h3 className="text-sm font-bold text-[#17161A] flex items-center gap-2">
            <FileLock2 className="w-4 h-4 text-[#4F46E5]" />
            Request Supporting Evidence (Consent Charter)
          </h3>
          <p className="text-xs text-[#6E6A63] mt-0.5">
            Subject to client explicit consent. All access is logged and audited.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#6E6A63] hover:text-[#17161A]"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-lg bg-red-50 text-red-900 border border-red-200 flex items-center gap-2">
          <XCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-[#17161A] block mb-1">Your Full Name *</label>
            <input
              type="text"
              id="txtRequesterName"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tariq Khan"
              className="w-full text-xs p-2.5 rounded-xl border border-[#E9E6DF] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#17161A]"
            />
          </div>
          <div>
            <label className="font-semibold text-[#17161A] block mb-1">Your Organization / Firm</label>
            <input
              type="text"
              id="txtRequesterOrg"
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              placeholder="e.g. Habib Bank Limited / Commercial Credit"
              className="w-full text-xs p-2.5 rounded-xl border border-[#E9E6DF] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#17161A]"
            />
          </div>
        </div>

        <div>
          <label className="font-semibold text-[#17161A] block mb-1">Work Email Address *</label>
          <input
            type="email"
            id="txtRequesterEmail"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@organization.com"
            className="w-full text-xs p-2.5 rounded-xl border border-[#E9E6DF] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#17161A]"
          />
        </div>

        <div>
          <label className="font-semibold text-[#17161A] block mb-1">Commercial Purpose of Request *</label>
          <textarea
            rows={2}
            id="txtRequesterPurpose"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Explain why you need supporting documentation (e.g. credit facility underwriting, supply chain onboarding)..."
            className="w-full text-xs p-2.5 rounded-xl border border-[#E9E6DF] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] text-[#17161A]"
          />
        </div>

        <div>
          <label className="font-semibold text-[#17161A] block mb-1.5">Requested Evidence Categories:</label>
          <div className="flex flex-wrap gap-4">
            {[
              { id: "BANK_STATEMENT", label: "Bank Statements" },
              { id: "LEDGER", label: "General Ledger" },
              { id: "INVOICE_REGISTER", label: "Invoices / Registers" },
            ].map((cat) => (
              <label key={cat.id} className="flex items-center gap-1.5 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={categories.includes(cat.id)}
                  onChange={(e) => {
                    if (e.target.checked) setCategories([...categories, cat.id]);
                    else setCategories(categories.filter((c) => c !== cat.id));
                  }}
                  className="rounded text-[#4F46E5] focus:ring-[#4F46E5]"
                />
                <span className="text-[#17161A]">{cat.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-4 py-2 rounded-xl border border-[#E9E6DF] text-xs font-semibold text-[#6E6A63] hover:bg-[#FAF9F6]"
          >
            Cancel
          </button>
          <button
            type="submit"
            id="btnSubmitEvidenceRequest"
            disabled={submitting}
            className="px-5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-40"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{submitting ? "Submitting..." : "Submit Disclosure Request"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
