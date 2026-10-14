import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        attest: {
          bg: "#F7F8FA",
          ink: "#0F172A",
          blue: "#2563EB",
          blueHover: "#1D4ED8",
          amber: "#D97706",
          red: "#DC2626",
          green: "#16A34A",
          surface: "#FFFFFF",
          border: "#E6E9EF",
          muted: "#64748B",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
