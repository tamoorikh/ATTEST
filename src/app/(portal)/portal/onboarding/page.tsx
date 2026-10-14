"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  Database,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  FileCheck2,
  Lock,
  Info,
} from "lucide-react";

export default function OnboardingWizardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form states
  const [legalName, setLegalName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [city, setCity] = useState("Lahore");
  const [address, setAddress] = useState("");
  const [jurisdiction, setJurisdiction] = useState("PK");

  // Step 2: Sources
  const [primaryBank, setPrimaryBank] = useState("Habib Bank Limited (HBL)");
  const [accountNumber, setAccountNumber] = useState("00427901842003");
  const [accountingSystem, setAccountingSystem] = useState("Excel / Manual Spreadsheets");
  const [statementFrequency, setStatementFrequency] = useState("Monthly");

  // Step 3: Consent checkboxes
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentAccuracy, setConsentAccuracy] = useState(false);
  const [consentCAReview, setConsentCAReview] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/onboarding");
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setLegalName(data.profile.legalName || "");
            setRegistrationNumber(data.profile.registrationNumber || "");
            setTaxId(data.profile.taxId || "");
            setCity(data.profile.city || "Lahore");
            setAddress(data.profile.address || "");
            setJurisdiction(data.profile.jurisdiction || "PK");
            if (data.profile.onboardingStep) {
              setCurrentStep(data.profile.onboardingStep);
            }
            if (data.profile.sourcesDeclared) {
              try {
                const s = JSON.parse(data.profile.sourcesDeclared);
                if (s.primaryBank) setPrimaryBank(s.primaryBank);
                if (s.accountNumber) setAccountNumber(s.accountNumber);
                if (s.accountingSystem) setAccountingSystem(s.accountingSystem);
                if (s.statementFrequency) setStatementFrequency(s.statementFrequency);
              } catch (e) {}
            }
            if (data.profile.authorizedAt) {
              setConsentPrivacy(true);
              setConsentAccuracy(true);
              setConsentCAReview(true);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function saveStep(nextStep: number, isFinal = false) {
    setSaving(true);
    setSavedSuccess(false);

    try {
      const payload = {
        step: nextStep,
        legalName,
        registrationNumber,
        taxId,
        city,
        address,
        jurisdiction,
        sourcesDeclared: {
          primaryBank,
          accountNumber,
          accountingSystem,
          statementFrequency,
        },
        authorized: isFinal || (consentPrivacy && consentAccuracy && consentCAReview),
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setCurrentStep(nextStep);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-gray-500">
        Loading onboarding workspace...
      </div>
    );
  }

  const steps = [
    { num: 1, title: "Entity Profile", icon: Building2 },
    { num: 2, title: "Sources Declared", icon: Database },
    { num: 3, title: "Authorizations", icon: Lock },
    { num: 4, title: "Readiness Summary", icon: ShieldCheck },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#0B1220]">
          Client Assurance Onboarding Wizard
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Complete the 4-step setup to establish your organization&apos;s continuous financial verification boundary.
        </p>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-4 gap-2">
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = currentStep > s.num;
          const isCurrent = currentStep === s.num;

          return (
            <button
              key={s.num}
              type="button"
              onClick={() => setCurrentStep(s.num)}
              className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                isCurrent
                  ? "border-[#2456E6] bg-blue-50/40 ring-1 ring-[#2456E6]"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/30 text-emerald-800"
                  : "border-gray-200 bg-white opacity-70"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`w-4 h-4 ${isCurrent ? "text-[#2456E6]" : isDone ? "text-emerald-600" : "text-gray-400"}`} />
                <span className="font-mono text-[10px] font-bold text-gray-400">0{s.num}</span>
              </div>
              <div className="mt-2 font-semibold text-[#0B1220] truncate">{s.title}</div>
            </button>
          );
        })}
      </div>

      {/* Step Contents */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        {/* STEP 1: Company Profile */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1220]">Step 1: Legal Entity Profile</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Declare your registered company credentials and taxation details.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700">Legal Company Name</label>
              <input
                type="text"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="e.g. Meridian Textiles (Pvt) Ltd"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">SECP / Reg Number</label>
                  <span className="text-[10px] font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    user-provided — not independently verified
                  </span>
                </div>
                <input
                  type="text"
                  value={registrationNumber}
                  onChange={(e) => setRegistrationNumber(e.target.value)}
                  placeholder="e.g. 0094182-LHR"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6] font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-gray-700">National Tax Number (NTN / STRN)</label>
                  <span className="text-[10px] font-mono font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                    user-provided — not independently verified
                  </span>
                </div>
                <input
                  type="text"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder="e.g. NTN-4892184-7"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Jurisdiction</label>
                <select
                  value={jurisdiction}
                  onChange={(e) => setJurisdiction(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                >
                  <option value="PK">Pakistan (SECP / FBR)</option>
                  <option value="AE">United Arab Emirates (FTA)</option>
                  <option value="UK">United Kingdom (Companies House)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">City / Commercial Center</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Lahore"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Registered Office Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Plot 42, Quaid-e-Azam Industrial Estate"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => saveStep(2)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#0B1220] hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Save & Continue to Step 2</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Sources Declared */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1220]">Step 2: Declared Data Sources</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Specify primary banking institutions and accounting books used in your assurance cycle.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Primary Bank Institution</label>
                <select
                  value={primaryBank}
                  onChange={(e) => setPrimaryBank(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                >
                  <option value="Habib Bank Limited (HBL)">Habib Bank Limited (HBL)</option>
                  <option value="Meezan Bank Limited">Meezan Bank Limited</option>
                  <option value="MCB Bank Limited">MCB Bank Limited</option>
                  <option value="Standard Chartered Bank (SCB)">Standard Chartered Bank (SCB)</option>
                  <option value="Bank Alfalah">Bank Alfalah</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Primary Operational Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="00427901842003"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6] font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700">Internal Accounting Book System</label>
                <select
                  value={accountingSystem}
                  onChange={(e) => setAccountingSystem(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                >
                  <option value="Excel / Manual Spreadsheets">Excel / Manual Spreadsheets (.xlsx, .csv)</option>
                  <option value="QuickBooks Online / Desktop">QuickBooks (General Ledger Export)</option>
                  <option value="Xero Cloud Accounting">Xero (Bank Ledger Export)</option>
                  <option value="SAP Business One">SAP Business One</option>
                  <option value="Odoo ERP">Odoo ERP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700">Reconciliation Statement Cadence</label>
                <select
                  value={statementFrequency}
                  onChange={(e) => setStatementFrequency(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2456E6]"
                >
                  <option value="Monthly">Monthly Assurance Cycle (Default)</option>
                  <option value="Bi-Weekly">Bi-Weekly Reconciliation</option>
                  <option value="Quarterly">Quarterly Review</option>
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#2456E6] shrink-0 mt-0.5" />
              <span>
                These declared parameters configure the deterministic parsing engine rules for statement file types and account number cross-matching.
              </span>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => saveStep(3)}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#0B1220] hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                <span>Save & Continue to Step 3</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Authorizations */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1220]">Step 3: Authorizations & Consent Declarations</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Strict legal and professional authorizations required for licensed CA assurance sign-off.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={consentPrivacy}
                  onChange={(e) => setConsentPrivacy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2456E6] focus:ring-[#2456E6]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-900 block">Financial Data Protection & Privacy Consent</span>
                  <span className="text-gray-500 mt-0.5 block">
                    I authorize Attest to process raw bank statements and accounting ledgers exclusively within tenant-isolated environments for deterministic reconciliation.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={consentAccuracy}
                  onChange={(e) => setConsentAccuracy(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2456E6] focus:ring-[#2456E6]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-900 block">Declaration of Authenticity & Truthfulness</span>
                  <span className="text-gray-500 mt-0.5 block">
                    I declare under penalty of perjury that all uploaded bank statements and general ledger exports represent true and un-doctored records of financial transactions.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 bg-gray-50/70 hover:bg-white cursor-pointer transition-all">
                <input
                  type="checkbox"
                  checked={consentCAReview}
                  onChange={(e) => setConsentCAReview(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2456E6] focus:ring-[#2456E6]"
                />
                <div className="text-xs">
                  <span className="font-semibold text-gray-900 block">Chartered Accountant Independent Access Authorization</span>
                  <span className="text-gray-500 mt-0.5 block">
                    I authorize licensed Chartered Accountants on the Attest network to review uploaded evidence, inspect discrepancy logs, and certify Trust Certificates.
                  </span>
                </div>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
              <button
                type="button"
                disabled={saving || !consentPrivacy || !consentAccuracy || !consentCAReview}
                onClick={() => saveStep(4, true)}
                className="px-5 py-2.5 rounded-xl bg-[#0B1220] hover:bg-black text-white text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40"
              >
                <span>Authorize & View Readiness</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Readiness Summary */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-gray-100 pb-3">
              <h2 className="text-base font-bold text-[#0B1220]">Step 4: Onboarding Readiness Summary</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Your workspace is ready. You can now proceed to upload bank statements and accounting books.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  100%
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-900">Onboarding Configuration Complete</div>
                  <div className="text-[11px] text-emerald-700">All mandatory company and source declarations established.</div>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Legal Entity</span>
                <span className="font-semibold text-gray-900 mt-0.5 block">{legalName}</span>
                <span className="font-mono text-[11px] text-gray-500">{taxId}</span>
              </div>
              <div className="p-3 rounded-lg border border-gray-200 bg-gray-50">
                <span className="text-gray-400 block text-[10px] uppercase font-semibold">Declared Sources</span>
                <span className="font-semibold text-gray-900 mt-0.5 block">{primaryBank}</span>
                <span className="font-mono text-[11px] text-gray-500">{accountNumber}</span>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Authorizations
              </button>
              <Link
                href="/portal/sources"
                className="px-5 py-2.5 rounded-xl bg-[#2456E6] hover:bg-[#1d45bc] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <span>Proceed to Source Upload Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
