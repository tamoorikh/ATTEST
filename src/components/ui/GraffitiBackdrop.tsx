import React from "react";

export function GraffitiBackdrop() {
  return (
    <div className="art" aria-hidden="true">
      {/* 4 Soft Spray Washes */}
      <div className="wash w1" />
      <div className="wash w2" />
      <div className="wash w3" />
      <div className="wash w4" />

      {/* 3 Giant Ghost Graffiti Words */}
      <div className="ghostword gw1">TRUST</div>
      <div className="ghostword gw2">✓ 100%</div>
      <div className="ghostword gw3">VERIFIED</div>

      {/* 6 Hand-Drawn Doodle SVGs */}
      {/* Doodle 1: Star/burst doodle in accent indigo */}
      <svg className="doodle dl1" width="90" height="90" viewBox="0 0 90 90" fill="none">
        <path
          d="M45 8l8 22 24 2-18 16 6 24-20-13-20 13 6-24-18-16 24-2z"
          stroke="#4F46E5"
          strokeWidth="2.5"
          strokeLinejoin="round"
          opacity="0.18"
        />
      </svg>

      {/* Doodle 2: Curved arrow scribble in pink */}
      <svg className="doodle dl2" width="110" height="60" viewBox="0 0 110 60" fill="none">
        <path
          d="M4 40 C 30 10, 60 54, 106 18"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.22"
        />
        <path
          d="M96 12l10 6-12 4"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.22"
        />
      </svg>

      {/* Doodle 3: Circle with check in teal */}
      <svg className="doodle dl3" width="80" height="80" viewBox="0 0 80 80" fill="none">
        <circle cx="40" cy="40" r="30" stroke="#14B8A6" strokeWidth="2.5" opacity="0.2" />
        <path
          d="M28 41l8 8 16-18"
          stroke="#14B8A6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.28"
        />
      </svg>

      {/* Doodle 4: Undulating wave line in amber */}
      <svg className="doodle dl4" width="100" height="34" viewBox="0 0 100 34" fill="none">
        <path
          d="M3 24 C 20 4, 34 30, 50 14 S 82 6, 97 20"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.24"
        />
      </svg>

      {/* Doodle 5: Sparkle cross in accent indigo */}
      <svg className="doodle dl5" width="70" height="70" viewBox="0 0 70 70" fill="none">
        <path
          d="M35 6v14M35 50v14M6 35h14M50 35h14M14 14l10 10M46 46l10 10M56 14L46 24M24 46L14 56"
          stroke="#4F46E5"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.14"
        />
      </svg>

      {/* Doodle 6: Swooping flourish arrow in pink */}
      <svg className="doodle dl6" width="120" height="46" viewBox="0 0 120 46" fill="none">
        <path
          d="M6 36 C 26 8, 44 40, 62 20 S 98 10, 114 26"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.18"
        />
        <path
          d="M104 20l10 6-12 4"
          stroke="#EC4899"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.18"
        />
      </svg>
    </div>
  );
}

export default GraffitiBackdrop;
