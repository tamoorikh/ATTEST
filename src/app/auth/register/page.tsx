"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraffitiBackdrop } from "@/components/ui/GraffitiBackdrop";

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
    } catch (err: unknown) {
      setError("An unexpected error occurred during registration.");
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#17161A] flex items-center justify-center p-5 overflow-hidden">
      <GraffitiBackdrop />

      <div className="relative z-10 w-full max-w-[460px] bg-white/94 backdrop-blur-md border border-[#E9E6DF] rounded-[22px] p-8 sm:p-9 shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] rise">
        <div className="flex justify-center mb-3.5">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[19px] tracking-tight">
            <span className="w-8 h-8 rounded-[10px] bg-[#4F46E5] grid place-items-center text-white shrink-0 shadow-sm">
              <svg width="16" height="16" viewBox="0 0 32 32">
                <path d="M11 16.5l4 4 9.5-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Attest</span>
          </Link>
        </div>

        <h1 className="font-heading text-[23px] font-extrabold text-center tracking-tight text-[#17161A]">
          Create your workspace
        </h1>
        <p className="text-center text-[#6E6A61] text-[13.5px] mt-1 mb-5">
          Free during the pilot — your first certificate in 48 hours
        </p>

        {success ? (
          <div className="bg-[#E7F5EE] border border-[#CBE6D8] rounded-xl p-5 text-center text-[#188A54] space-y-2">
            <div className="w-10 h-10 rounded-full bg-[#188A54] text-white grid place-items-center mx-auto text-lg font-bold">
              ✓
            </div>
            <h2 className="font-bold text-sm">Account Created Successfully</h2>
            <p className="text-xs text-[#188A54]">
              Redirecting you to sign in to your new workspace...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <div className="bg-[#FBECEA] border border-[#F2CBC8] text-[#C0362C] rounded-xl p-3 text-xs font-semibold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tariq Mahmood"
                className="w-full px-3.5 py-2.5 rounded-[11px] border border-[#E9E6DF] bg-white text-[#17161A] text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tariq@meridian.pk"
                className="w-full px-3.5 py-2.5 rounded-[11px] border border-[#E9E6DF] bg-white text-[#17161A] text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-[11px] border border-[#E9E6DF] bg-white text-[#17161A] text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
                Organization / Company legal name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Meridian Textiles (Pvt) Ltd"
                className="w-full px-3.5 py-2.5 rounded-[11px] border border-[#E9E6DF] bg-white text-[#17161A] text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all font-sans"
              />
            </div>

            <div>
              <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
                Primary role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-[11px] border border-[#E9E6DF] bg-white text-[#17161A] text-sm focus:outline-none focus:border-[#4F46E5] font-sans"
              >
                <option value="Owner">Business Owner / Director</option>
                <option value="FinanceManager">Finance Manager</option>
                <option value="Accountant">Accountant / Bookkeeper</option>
                <option value="CA-reviewer">Chartered Accountant (CA)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 flex items-center justify-center gap-2 font-semibold text-[14.5px] py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
            >
              {loading ? "Creating workspace..." : "Create workspace &rarr;"}
            </button>
          </form>
        )}

        <div className="text-center mt-5 text-[13px] text-[#6E6A61]">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-[#4F46E5] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
