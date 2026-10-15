"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GraffitiBackdrop } from "@/components/ui/GraffitiBackdrop";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/portal";
  const authError = searchParams.get("error");

  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("demo@attest.pk");
  const [password, setPassword] = useState("Demo1234!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    authError ? "Authentication failed. Please verify credentials." : ""
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (tab === "signup") {
      router.push("/auth/register");
      return;
    }

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
    } catch (err: unknown) {
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
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#17161A] flex items-center justify-center p-5 overflow-hidden">
      {/* Whisper decorative art backdrop */}
      <GraffitiBackdrop />

      {/* Centered Auth Card */}
      <div className="relative z-10 w-full max-w-[430px] bg-white/94 backdrop-blur-md border border-[#E9E6DF] rounded-[22px] p-8 sm:p-9 shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] rise">
        {/* Logo */}
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
          {tab === "signup" ? "Create your workspace" : "Welcome back"}
        </h1>
        <p className="text-center text-[#6E6A61] text-[13.5px] mt-1 mb-5">
          {tab === "signup"
            ? "Free during the pilot — your first certificate in 48 hours"
            : "Sign in to your assurance workspace"}
        </p>

        {/* Tabs */}
        <div className="grid grid-cols-2 bg-[#F1EFE9] rounded-xl p-1 mb-5">
          <button
            type="button"
            onClick={() => setTab("login")}
            className={`py-2 rounded-[9px] font-semibold text-[13.5px] transition-all ${
              tab === "login"
                ? "bg-white text-[#17161A] shadow-[0_1px_4px_rgba(23,22,26,.1)]"
                : "text-[#6E6A61] hover:text-[#17161A]"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setTab("signup")}
            className={`py-2 rounded-[9px] font-semibold text-[13.5px] transition-all ${
              tab === "signup"
                ? "bg-white text-[#17161A] shadow-[0_1px_4px_rgba(23,22,26,.1)]"
                : "text-[#6E6A61] hover:text-[#17161A]"
            }`}
          >
            Sign up
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-[#FBECEA] border border-[#F2CBC8] text-[#C0362C] rounded-xl p-3 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <div>
              <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tariq Mahmood"
                className="w-full px-3.5 py-2.5 rounded-[11px] border border-[#E9E6DF] bg-white text-[#17161A] text-sm focus:outline-none focus:border-[#4F46E5] focus:ring-4 focus:ring-[#4F46E5]/10 transition-all font-sans"
              />
            </div>
          )}

          <div>
            <label className="block text-[12.5px] font-semibold text-[#57534E] mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="demo@attest.pk"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex items-center justify-center gap-2 font-semibold text-[14.5px] py-3 px-4 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all disabled:opacity-50 hover:-translate-y-0.5 cursor-pointer"
          >
            {loading ? "Authenticating…" : tab === "signup" ? "Create account →" : "Sign in →"}
          </button>
        </form>

        {/* Demo Personas — strictly gated behind DEMO_MODE */}
        {isDemoMode && (
          <>
            <div className="flex items-center gap-3 my-5 text-[#A8A296] text-[11.5px] font-semibold">
              <span className="flex-1 h-px bg-[#E9E6DF]" />
              <span>or try a demo</span>
              <span className="flex-1 h-px bg-[#E9E6DF]" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin("demo@attest.pk", "Demo1234!")}
                className="bg-white border border-[#E9E6DF] rounded-[14px] p-3.5 text-center hover:border-[#4F46E5] transition-all hover:-translate-y-0.5 cursor-pointer group"
              >
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mx-auto mb-1.5 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                  </svg>
                </div>
                <div className="font-bold text-[13px] text-[#17161A]">Business Owner</div>
                <div className="text-[11px] text-[#6E6A61] mt-0.5">Meridian Textiles</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin("ca@attest.pk", "Demo1234!")}
                className="bg-white border border-[#E9E6DF] rounded-[14px] p-3.5 text-center hover:border-[#4F46E5] transition-all hover:-translate-y-0.5 cursor-pointer group"
              >
                <div className="w-[34px] h-[34px] rounded-[10px] bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mx-auto mb-1.5 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </div>
                <div className="font-bold text-[13px] text-[#17161A]">CA Reviewer</div>
                <div className="text-[11px] text-[#6E6A61] mt-0.5">Licensed professional</div>
              </button>
            </div>
          </>
        )}

        <div className="text-center mt-5 text-[13px] text-[#6E6A61]">
          <Link href="/" className="text-[#A8A296] hover:text-[#17161A] transition-colors">
            &larr; Back to site
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
        <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center text-xs text-[#6E6A61]">
          Loading workspace...
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
