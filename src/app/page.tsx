"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraffitiBackdrop } from "@/components/ui/GraffitiBackdrop";
import { SealBadge } from "@/components/ui/SealBadge";

export default function HomePage() {
  const router = useRouter();

  // Word-by-word reveal
  const [wordIndices, setWordIndices] = useState<number[]>([]);
  const words = ["Can", "you", "believe", "these", "numbers?"];

  useEffect(() => {
    words.forEach((_, idx) => {
      const timer = setTimeout(() => {
        setWordIndices((prev) => [...prev, idx]);
      }, 220 + idx * 95);
      return () => clearTimeout(timer);
    });
  }, []);

  // Daily run clock & next run countdown
  const [liveClock, setLiveClock] = useState("06:00:00");
  const [nextRunText, setNextRunText] = useState("14h 30m");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const p2 = (n: number) => (n < 10 ? "0" : "") + n;
      setLiveClock(`${p2(now.getHours())}:${p2(now.getMinutes())}:${p2(now.getSeconds())}`);

      const next = new Date();
      next.setHours(6, 0, 0, 0);
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      const diffSec = Math.floor((next.getTime() - now.getTime()) / 1000);
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      setNextRunText(`${hours}h ${mins}m`);
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3D Tilt card
  const certRef = useRef<HTMLDivElement>(null);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = certRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    const max = 6;
    el.style.transform = `perspective(1000px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)`;
  };

  const handleMouseLeave = () => {
    const el = certRef.current;
    if (el) {
      el.style.transform = "";
    }
  };

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#17161A] overflow-x-hidden">
      {/* Decorative Whisper Graffiti Layer */}
      <GraffitiBackdrop />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/85 backdrop-blur-md border-b border-[#E9E6DF]">
        <div className="max-w-[1120px] mx-auto px-6 h-[66px] flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 font-extrabold text-[19px] tracking-tight">
            <span className="w-[33px] h-[33px] rounded-[10px] bg-[#4F46E5] grid place-items-center text-white shrink-0 shadow-sm">
              <svg width="17" height="17" viewBox="0 0 32 32">
                <path d="M11 16.5l4 4 9.5-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Attest</span>
          </Link>

          <div className="hidden md:flex items-center gap-6 ml-auto text-sm font-medium text-[#6E6A61]">
            <a href="#how" className="hover:text-[#17161A] transition-colors">How it works</a>
            <a href="#who" className="hover:text-[#17161A] transition-colors">Who it&apos;s for</a>
            <Link href="/verify" className="hover:text-[#17161A] transition-colors">Verify</Link>
          </div>

          <div className="flex items-center gap-3 ml-auto md:ml-0">
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-[13.5px] font-semibold bg-white border border-[#E9E6DF] rounded-[10px] hover:border-[#D5D0C6] transition-all hover:-translate-y-0.5"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signin"
              className="px-4 py-2 text-[13.5px] font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-[10px] shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all hover:-translate-y-0.5"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-[72px] pb-[78px] z-10">
        <div className="max-w-[1120px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-[1.06fr_0.94fr] gap-12 lg:gap-[60px] items-center">
          {/* Left Column: Hero Text */}
          <div>
            <div className="inline-flex items-center gap-2 bg-white/85 backdrop-blur-md border border-[#E9E6DF] rounded-full px-4 py-1.5 text-[13px] font-semibold text-[#6E6A61] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] rise">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l7 4v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V7l7-4z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
              <span>Verify once. Trusted by every bank.</span>
            </div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-[64px] font-extrabold tracking-[-0.03em] leading-[1.08] my-5">
              <span className={`inline-block mr-3 transition-all duration-500 ${wordIndices.includes(0) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>Can</span>
              <span className={`inline-block mr-3 transition-all duration-500 ${wordIndices.includes(1) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>you</span>
              <span className={`inline-block mr-3 transition-all duration-500 ${wordIndices.includes(2) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>believe</span>
              <br className="hidden sm:inline" />
              <span className={`inline-block mr-3 transition-all duration-500 ${wordIndices.includes(3) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>these</span>
              <span className={`inline-block bg-gradient-to-r from-[#4F46E5] to-[#7C5CFF] bg-clip-text text-transparent transition-all duration-500 ${wordIndices.includes(4) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>
                numbers?
              </span>
            </h1>

            <p className="text-[17.5px] text-[#6E6A61] max-w-[520px] mb-7 leading-relaxed">
              Attest checks a company&apos;s financial records <strong className="text-[#17161A] font-bold">every day</strong> — every transaction, across bank, books and invoices. A licensed chartered accountant signs. Anyone can verify the result in seconds.
            </p>

            <div className="flex gap-3 flex-wrap">
              <Link
                href="/auth/signin"
                className="inline-flex items-center gap-2 font-semibold text-[14.5px] px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all hover:-translate-y-0.5"
              >
                Get started &rarr;
              </Link>
              <Link
                href="/verify/ATTEST-PK-2026-406434-0A"
                className="inline-flex items-center gap-2 font-semibold text-[14.5px] px-6 py-3 rounded-xl bg-white text-[#17161A] border border-[#E9E6DF] hover:border-[#D5D0C6] transition-all hover:-translate-y-0.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Verify a sample</span>
              </Link>
            </div>

            <div className="flex gap-2.5 flex-wrap mt-7">
              <span className="text-[12.5px] font-semibold bg-white/80 backdrop-blur-md border border-[#E9E6DF] rounded-full px-3.5 py-1.5 text-[#57534E]">
                ✓ Signed by a licensed CA
              </span>
              <span className="text-[12.5px] font-semibold bg-white/80 backdrop-blur-md border border-[#E9E6DF] rounded-full px-3.5 py-1.5 text-[#57534E]">
                ✓ 100% of transactions, not a sample
              </span>
              <span className="text-[12.5px] font-semibold bg-white/80 backdrop-blur-md border border-[#E9E6DF] rounded-full px-3.5 py-1.5 text-[#57534E]">
                ✓ Live — refreshed daily
              </span>
            </div>
          </div>

          {/* Right Column: 3D Interactive Certificate Card */}
          <div className="relative pt-6 lg:pt-0">
            {/* Floating Chip 1 */}
            <div className="absolute -top-3 -left-3 sm:-left-6 z-20 bg-white/92 backdrop-blur-md border border-[#DCD9F8] rounded-[11px] px-3.5 py-2 text-xs font-bold text-[#3F3C55] shadow-[0_12px_30px_-12px_rgba(23,22,26,.22)] animate-[floatY_5s_ease-in-out_infinite]">
              ✓ Bank ↔ Ledger matched
            </div>

            {/* Floating Chip 2 */}
            <div className="absolute bottom-[28%] -right-2 sm:-right-6 z-20 bg-white/92 backdrop-blur-md border border-[#DCD9F8] rounded-[11px] px-3.5 py-2 text-xs font-bold text-[#3F3C55] shadow-[0_12px_30px_-12px_rgba(23,22,26,.22)] animate-[floatY_5s_ease-in-out_infinite_1.3s]">
              ✓ CA signature verified
            </div>

            {/* Floating Chip 3 */}
            <div className="absolute -bottom-3 left-4 sm:left-8 z-20 bg-white/92 backdrop-blur-md border border-[#DCD9F8] rounded-[11px] px-3.5 py-2 text-xs font-bold text-[#3F3C55] shadow-[0_12px_30px_-12px_rgba(23,22,26,.22)] animate-[floatY_5s_ease-in-out_infinite_2.5s]">
              ✓ <strong className="text-[#188A54]">Zero</strong> open exceptions
            </div>

            {/* Tiltable Certificate Surface */}
            <div
              ref={certRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative bg-white/92 backdrop-blur-md border border-[#E9E6DF] rounded-[22px] p-6 sm:p-7 shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-transform duration-200 ease-out"
              style={{ transformStyle: "preserve-3d" }}
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="text-[10.5px] font-bold tracking-[1.4px] uppercase text-[#A8A296]">
                    Trust Certificate
                  </div>
                  <div className="font-heading font-bold text-[19px] tracking-tight mt-0.5 text-[#17161A]">
                    Meridian Textiles (Pvt) Ltd
                  </div>
                  <div className="font-mono text-[11.5px] text-[#A8A296] mt-0.5">
                    ATTEST-PK-2026-406434-0A
                  </div>
                </div>

                {/* Rotating Circular Seal Badge */}
                <SealBadge size={76} />
              </div>

              {/* Rows */}
              <div className="mt-[18px] grid gap-2">
                <div className="flex items-center justify-between bg-[#FAF9F6]/85 border border-[#F1EFE9] rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold">
                  <span>Bank ↔ Ledger reconciliation</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7F5EE] text-[#188A54]">
                    ✓ PASS · 100%
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#FAF9F6]/85 border border-[#F1EFE9] rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold">
                  <span>Revenue ↔ FBR e-invoices</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7F5EE] text-[#188A54]">
                    ✓ PASS · 3-way
                  </span>
                </div>
                <div className="flex items-center justify-between bg-[#FAF9F6]/85 border border-[#F1EFE9] rounded-xl px-3.5 py-2.5 text-[13.5px] font-semibold">
                  <span>Open exceptions</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7F5EE] text-[#188A54]">
                    0
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex justify-between items-center mt-4 text-[12.5px] text-[#6E6A61]">
                <span>
                  Signed: <strong className="text-[#17161A] font-semibold">Ayesha Siddiqui, FCA</strong>
                </span>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7F5EE] text-[#188A54]">
                  Valid
                </span>
              </div>

              {/* Live Run Bar */}
              <div className="mt-3.5 bg-[#FAF9F6]/85 border border-[#F1EFE9] rounded-[11px] px-3.5 py-2 text-[11.5px] text-[#6E6A61] flex items-center gap-2 font-semibold font-mono">
                <span className="w-[7px] h-[7px] rounded-full bg-[#4F46E5] animate-[blink_2s_infinite]" />
                <span className="font-bold text-[#17161A] font-sans">Daily run</span>
                <span>{liveClock}</span>
                <span className="ml-auto font-sans text-[#6E6A61]">
                  next in <strong className="text-[#17161A] font-mono">{nextRunText}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Marquee Band */}
      <div className="relative z-10 overflow-hidden border-y border-[#E9E6DF] bg-[#F4F2ED]/75 backdrop-blur-md py-3 select-none">
        <div className="flex gap-[52px] w-max animate-[mq_34s_linear_infinite] text-[11.5px] font-bold tracking-[1.8px] text-[#A8A296] whitespace-nowrap">
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>100% POPULATION TESTED</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>BANK ↔ LEDGER RECONCILED</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>CA-SIGNED CERTIFICATE</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>VERIFY IN SECONDS — NO LOGIN</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>TAMPER-EVIDENT AUDIT TRAIL</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>REFRESHED DAILY</span>
          {/* Duplicate set for smooth infinite loop */}
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>100% POPULATION TESTED</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>BANK ↔ LEDGER RECONCILED</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>CA-SIGNED CERTIFICATE</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>VERIFY IN SECONDS — NO LOGIN</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>TAMPER-EVIDENT AUDIT TRAIL</span>
          <span><strong className="text-[#4F46E5] mr-2">✓</strong>REFRESHED DAILY</span>
        </div>
      </div>

      {/* Section 1: How It Works */}
      <section className="relative z-10 py-[92px]" id="how">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-xs font-bold tracking-[1.8px] uppercase text-[#4F46E5] mb-3">
            How it works
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold mb-3">
            Three steps. <span className="text-[#4F46E5]">No spreadsheets.</span>
          </h2>
          <p className="text-[#6E6A61] max-w-[600px] text-[16.5px] leading-relaxed">
            From shoebox documents to a signed certificate — the machine does the reading, a professional does the judging.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-11">
            {/* Step 1 */}
            <div className="bg-white/90 backdrop-blur-md border border-[#E9E6DF] rounded-[18px] p-[26px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] hover:-translate-y-1 hover:border-[#DCD9F8] hover:shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mb-4">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 0 10h-2M8 12h8" />
                </svg>
              </div>
              <div className="text-[11px] font-bold tracking-[1.6px] text-[#4F46E5] uppercase mb-1.5">
                Step 1
              </div>
              <h3 className="font-heading text-[17px] font-bold mb-1.5 text-[#17161A]">
                Connect sources
              </h3>
              <p className="text-[13.5px] text-[#6E6A61] leading-relaxed">
                Bank statements, your books and FBR e-invoices — read-only, consented, fingerprint-sealed on arrival.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/90 backdrop-blur-md border border-[#E9E6DF] rounded-[18px] p-[26px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] hover:-translate-y-1 hover:border-[#DCD9F8] hover:shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mb-4">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
                </svg>
              </div>
              <div className="text-[11px] font-bold tracking-[1.6px] text-[#4F46E5] uppercase mb-1.5">
                Step 2
              </div>
              <h3 className="font-heading text-[17px] font-bold mb-1.5 text-[#17161A]">
                AI checks 100% daily
              </h3>
              <p className="text-[13.5px] text-[#6E6A61] leading-relaxed">
                Every transaction compared across sources. AI proposes; deterministic code validates; mismatches become simple questions.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/90 backdrop-blur-md border border-[#E9E6DF] rounded-[18px] p-[26px] shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] hover:-translate-y-1 hover:border-[#DCD9F8] hover:shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all">
              <div className="w-[42px] h-[42px] rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mb-4">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6M9 15l2 2 4-4" />
                </svg>
              </div>
              <div className="text-[11px] font-bold tracking-[1.6px] text-[#4F46E5] uppercase mb-1.5">
                Step 3
              </div>
              <h3 className="font-heading text-[17px] font-bold mb-1.5 text-[#17161A]">
                CA signs &rarr; live certificate
              </h3>
              <p className="text-[13.5px] text-[#6E6A61] leading-relaxed">
                A licensed chartered accountant reviews the evidence and signs. Any bank verifies the result in seconds — no login.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Portals (Trust Triangle) */}
      <section className="relative z-10 py-[70px]" id="who">
        <div className="max-w-[1120px] mx-auto px-6">
          <div className="text-xs font-bold tracking-[1.8px] uppercase text-[#4F46E5] mb-3">
            One certificate, three sides of the table
          </div>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold mb-3">
            Built for the <span className="text-[#4F46E5]">whole</span> trust triangle.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-11">
            {/* Client Portal */}
            <div className="bg-white/90 backdrop-blur-md border border-[#E9E6DF] rounded-[18px] p-7 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] hover:-translate-y-1 hover:border-[#DCD9F8] hover:shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
                  </svg>
                </div>
                <div className="text-[10.5px] font-bold tracking-[1.4px] text-[#A8A296] uppercase">
                  For businesses
                </div>
                <h3 className="font-heading text-lg font-bold mt-1 mb-2 text-[#17161A]">
                  Client Portal
                </h3>
                <p className="text-sm text-[#6E6A61] mb-4 leading-relaxed">
                  See your verdict in plain language, answer questions, share one certificate with every lender.
                </p>
              </div>
              <Link href="/portal" className="text-[13.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA]">
                Open portal &rarr;
              </Link>
            </div>

            {/* CA Console */}
            <div className="bg-white/90 backdrop-blur-md border border-[#E9E6DF] rounded-[18px] p-7 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] hover:-translate-y-1 hover:border-[#DCD9F8] hover:shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" />
                    <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
                  </svg>
                </div>
                <div className="text-[10.5px] font-bold tracking-[1.4px] text-[#A8A296] uppercase">
                  For accounting firms
                </div>
                <h3 className="font-heading text-lg font-bold mt-1 mb-2 text-[#17161A]">
                  CA Console
                </h3>
                <p className="text-sm text-[#6E6A61] mb-4 leading-relaxed">
                  Review exceptions with evidence attached, sign certificates and serve more clients.
                </p>
              </div>
              <Link href="/ca" className="text-[13.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA]">
                Open console &rarr;
              </Link>
            </div>

            {/* Public Verifier */}
            <div className="bg-white/90 backdrop-blur-md border border-[#E9E6DF] rounded-[18px] p-7 shadow-[0_1px_2px_rgba(23,22,26,.04),0_10px_30px_-14px_rgba(23,22,26,.12)] hover:-translate-y-1 hover:border-[#DCD9F8] hover:shadow-[0_24px_60px_-26px_rgba(23,22,26,.25)] transition-all flex flex-col justify-between">
              <div>
                <div className="w-11 h-11 rounded-xl bg-[#EEEDFB] text-[#4F46E5] grid place-items-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M4 18h16M6 18v-7M10 18v-7M14 18v-7M18 18v-7M4 11l8-6 8 6" />
                  </svg>
                </div>
                <div className="text-[10.5px] font-bold tracking-[1.4px] text-[#A8A296] uppercase">
                  For banks — no login
                </div>
                <h3 className="font-heading text-lg font-bold mt-1 mb-2 text-[#17161A]">
                  Public Verifier
                </h3>
                <p className="text-sm text-[#6E6A61] mb-4 leading-relaxed">
                  Enter a certificate ID and confirm status, scope and signer in seconds.
                </p>
              </div>
              <Link href="/verify/ATTEST-PK-2026-406434-0A" className="text-[13.5px] font-semibold text-[#4F46E5] hover:text-[#4338CA]">
                Verify a certificate &rarr;
              </Link>
            </div>
          </div>

          {/* CTA Band */}
          <div className="mt-14 bg-gradient-to-br from-[#F1E9FC]/90 to-[#FDF4EC]/90 backdrop-blur-md border border-[#DCD9F8] rounded-[26px] p-10 sm:p-14 text-center">
            <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[#17161A] mb-2.5">
              Stop being a stranger <span className="text-[#4F46E5]">to your own bank.</span>
            </h2>
            <p className="text-[#6E6A61] max-w-[500px] mx-auto mb-6 text-[15px] leading-relaxed">
              Join the pilot cohort. Your first verified certificate takes 48 hours — and it&apos;s yours to carry anywhere.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 font-semibold text-[14.5px] px-6 py-3 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white shadow-[0_8px_20px_-10px_rgba(79,70,229,.6)] transition-all hover:-translate-y-0.5"
            >
              Get your company verified &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Honest Footer */}
      <footer className="relative z-10 border-t border-[#E9E6DF] py-7 text-[13px] text-[#A8A296]">
        <div className="max-w-[1120px] mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-[#17161A]">
            <span className="w-[26px] h-[26px] rounded-[8px] bg-[#4F46E5] grid place-items-center text-white shrink-0">
              <svg width="13" height="13" viewBox="0 0 32 32">
                <path d="M11 16.5l4 4 9.5-11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <span>Attest</span>
          </div>
          <div className="text-center sm:text-right">
            Limited assurance. Not a statutory audit. &middot; Demo — all data fictional.
          </div>
        </div>
      </footer>
    </div>
  );
}
