"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, ArrowRight, AlertCircle, Building2, UserCheck, CheckCircle2 } from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError ? "Authentication failed. Please verify credentials." : "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        if (email.toLowerCase().includes("ca@")) {
          router.push("/ca");
        } else {
          router.push(callbackUrl);
        }
        router.refresh();
      }
    } catch (err: any) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  }

  function handleQuickLogin(userEmail: string, userPass: string) {
    setEmail(userEmail);
    setPassword(userPass);
  }

  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

  return (
    <div className="min-h-screen bg-[#F7F7F5] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#0B1220] flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="w-6 h-6 text-[#2456E6]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#0B1220]">Attest</span>
        </div>
        <h2 className="text-center text-xl font-semibold text-[#0B1220]">
          Sign in to your assurance workspace
        </h2>
        <p className="mt-1 text-center text-xs text-gray-500">
          Client Portal &bull; CA Console &bull; Continuous Financial Verification
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Logins Box — Gated behind DEMO_MODE */}
        {isDemoMode && (
          <div className="mb-6 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2456E6]" />
                Quick Demo Personas
              </span>
              <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono font-medium border border-amber-200">
                Pass: Demo1234!
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleQuickLogin("demo@attest.pk", "Demo1234!")}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                  email === "demo@attest.pk"
                    ? "border-[#2456E6] bg-blue-50/50 ring-1 ring-[#2456E6]"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-[#0B1220]">
                  <Building2 className="w-3.5 h-3.5 text-gray-600" />
                  Client Owner
                </div>
                <div className="font-mono text-[11px] text-gray-500 truncate mt-1">demo@attest.pk</div>
                <span className="text-[10px] text-blue-600 font-medium mt-1">Meridian Textiles &rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ca@attest.pk", "Demo1234!")}
                className={`p-2.5 rounded-lg border text-left transition-all text-xs flex flex-col justify-between ${
                  email === "ca@attest.pk"
                    ? "border-[#2456E6] bg-blue-50/50 ring-1 ring-[#2456E6]"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-[#0B1220]">
                  <UserCheck className="w-3.5 h-3.5 text-gray-600" />
                  Chartered Acct
                </div>
                <div className="font-mono text-[11px] text-gray-500 truncate mt-1">ca@attest.pk</div>
                <span className="text-[10px] text-blue-600 font-medium mt-1">CA Reviewer &rarr;</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white py-8 px-6 border border-gray-200 rounded-xl shadow-sm sm:px-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2456E6] focus:border-transparent font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-gray-700">Password</label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2456E6] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0B1220] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1220] disabled:opacity-50 transition-colors"
            >
              {loading ? "Authenticating..." : "Sign In"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-600">
              New business?{" "}
              <Link href="/auth/register" className="font-medium text-[#2456E6] hover:underline">
                Create new organization account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/verify"
            className="text-xs text-gray-500 hover:text-gray-900 font-medium inline-flex items-center gap-1"
          >
            Looking to verify a public trust certificate? <span className="text-[#2456E6] underline">Go to Verifier &rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F7F5] flex items-center justify-center text-xs text-gray-500">Loading sign in...</div>}>
      <SignInForm />
    </Suspense>
  );
}
