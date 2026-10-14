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
          bg: "#F7F7F5",
          ink: "#0B1220",
          blue: "#2456E6",
          blueHover: "#1d45bc",
          amber: "#D97706",
          red: "#DC2626",
          surface: "#FFFFFF",
          border: "#E5E7EB",
          muted: "#6B7280",
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
