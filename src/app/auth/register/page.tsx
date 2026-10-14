"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgName, setOrgName] = useState("");
  const [role, setRole] = useState("Owner");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, orgName, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to register organization.");
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/auth/signin");
        }, 1500);
      }
    } catch (err: any) {
      setError("An unexpected error occurred during registration.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5 mb-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">Attest</span>
        </div>
        <h1 className="text-center text-xl font-bold tracking-tight text-[#0F172A]">
          Register Organization &amp; Assurance Workspace
        </h1>
        <p className="mt-1 text-center text-xs text-[#64748B]">
          Continuous assurance engine with deterministic multi-tenant isolation
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-7 px-6 border border-[#E6E9EF] rounded-xl shadow-sm sm:px-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-2 text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>Workspace registered! Redirecting to sign in...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">Company / Entity Name</label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Apex Industrial Solutions (Pvt) Ltd"
                className="mt-1 block w-full px-3.5 py-2.5 border border-[#E6E9EF] rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">Your Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Tariq Mahmood"
                className="mt-1 block w-full px-3.5 py-2.5 border border-[#E6E9EF] rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">Work Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tariq@apex.pk"
                className="mt-1 block w-full px-3.5 py-2.5 border border-[#E6E9EF] rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-mono text-[#0F172A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="mt-1 block w-full px-3 py-2.5 border border-[#E6E9EF] rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB] text-[#0F172A]"
              >
                <option value="Owner">Owner / Managing Director</option>
                <option value="FinanceManager">Finance Manager</option>
                <option value="Accountant">Accountant</option>
                <option value="CA-reviewer">Chartered Accountant (CA)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="mt-1 block w-full px-3.5 py-2.5 border border-[#E6E9EF] rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-mono text-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating Organization..." : "Create Organization"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6E9EF] text-center">
            <p className="text-xs text-[#64748B]">
              Already have an account?{" "}
              <Link href="/auth/signin" className="font-semibold text-[#2563EB] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
