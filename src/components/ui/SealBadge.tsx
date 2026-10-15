import React, { useId } from "react";

interface SealBadgeProps {
  size?: number; // default 76
  className?: string;
  text?: string;
}

export function SealBadge({
  size = 76,
  className = "",
  text = "CA SIGNED · VERIFIED · ATTEST · LIVE ·",
}: SealBadgeProps) {
  const uniqueId = useId().replace(/:/g, "_");
  const pathId = `seal_circ_${uniqueId}`;

  return (
    <div
      className={`relative shrink-0 select-none ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
      aria-label="Verified CA Seal"
    >
      {/* Rotating Circular Text */}
      <svg
        viewBox="0 0 76 76"
        className="absolute inset-0 w-full h-full animate-[spinSlow_18s_linear_infinite]"
        aria-hidden="true"
      >
        <defs>
          <path
            id={pathId}
            d="M38,38 m-32,0 a32,32 0 1,1 64,0 a32,32 0 1,1 -64,0"
          />
        </defs>
        <text
          style={{
            fontSize: "8.2px",
            fontWeight: 700,
            letterSpacing: "1.6px",
            fill: "var(--acc, #4F46E5)",
          }}
        >
          <textPath href={`#${pathId}`}>{text}</textPath>
        </text>
      </svg>

      {/* Central Core Emblem */}
      <div
        className="absolute rounded-full grid place-items-center text-white shadow-[0_6px_16px_-6px_rgba(79,70,229,.6)] bg-[#4F46E5]"
        style={{
          inset: `${Math.round((size * 14) / 76)}px`,
        }}
      >
        <svg
          width={Math.round((size * 20) / 76)}
          height={Math.round((size * 20) / 76)}
          viewBox="0 0 32 32"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 16.5l4 4 9.5-11" />
        </svg>
      </div>
    </div>
  );
}

export default SealBadge;
