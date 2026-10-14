"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Building2,
  UserCheck,
  CheckCircle2,
  Lock,
} from "lucide-react";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    authError ? "Authentication failed. Please verify credentials." : ""
  );

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
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo Mark */}
        <div className="flex justify-center items-center gap-2.5 mb-3">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#2563EB] shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Attest
          </span>
        </div>
        <h1 className="text-center text-xl font-bold tracking-tight text-[#0F172A]">
          Sign in to your assurance workspace
        </h1>
        <p className="mt-1 text-center text-xs text-[#64748B]">
          Continuous financial verification for clients and licensed auditors
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Quick Demo Personas Box — Gated behind DEMO_MODE */}
        {isDemoMode && (
          <div className="mb-6 bg-white border border-[#E6E9EF] rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
                Demo Persona Quick-Login
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-mono font-semibold border border-blue-200">
                Auto-fill
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("demo@attest.pk", "Demo1234!")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                  email === "demo@attest.pk"
                    ? "border-[#2563EB] bg-blue-50/60 ring-2 ring-[#2563EB]/20"
                    : "border-[#E6E9EF] hover:border-gray-300 hover:bg-[#F7F8FA]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                    <Building2 className="w-4 h-4 text-[#2563EB]" />
                    Client Owner
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                    Upload statements &amp; manage exceptions
                  </p>
                </div>
                <div className="font-mono text-[10px] text-[#2563EB] font-medium mt-2 pt-2 border-t border-gray-100">
                  demo@attest.pk
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ca@attest.pk", "Demo1234!")}
                className={`p-3 rounded-xl border text-left transition-all text-xs flex flex-col justify-between ${
                  email === "ca@attest.pk"
                    ? "border-[#2563EB] bg-blue-50/60 ring-2 ring-[#2563EB]/20"
                    : "border-[#E6E9EF] hover:border-gray-300 hover:bg-[#F7F8FA]"
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-[#0F172A]">
                    <UserCheck className="w-4 h-4 text-[#2563EB]" />
                    Chartered Acct
                  </div>
                  <p className="text-[11px] text-[#64748B] mt-1 leading-snug">
                    Review evidence &amp; sign certificates
                  </p>
                </div>
                <div className="font-mono text-[10px] text-[#2563EB] font-medium mt-2 pt-2 border-t border-gray-100">
                  ca@attest.pk
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Centered Sign-In Card */}
        <div className="bg-white py-7 px-6 border border-[#E6E9EF] rounded-xl shadow-sm sm:px-8">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A]">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="mt-1 block w-full px-3.5 py-2.5 border border-[#E6E9EF] rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-mono text-[#0F172A]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-[#0F172A]">
                  Password
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-3.5 py-2.5 border border-[#E6E9EF] rounded-lg text-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent font-mono text-[#0F172A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl shadow-sm text-sm font-semibold text-white bg-[#2563EB] hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2563EB] disabled:opacity-50 transition-colors"
            >
              {loading ? "Authenticating..." : "Sign In to Workspace"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6E9EF] text-center">
            <p className="text-xs text-[#64748B]">
              New organization?{" "}
              <Link
                href="/auth/register"
                className="font-semibold text-[#2563EB] hover:underline"
              >
                Create business account
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/verify"
            className="text-xs text-[#64748B] hover:text-[#0F172A] font-medium inline-flex items-center gap-1"
          >
            <span>Verifying a public certificate?</span>{" "}
            <span className="text-[#2563EB] underline font-semibold">
              Go to Public Verifier &rarr;
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center text-xs text-[#64748B]">
          Loading sign in...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
