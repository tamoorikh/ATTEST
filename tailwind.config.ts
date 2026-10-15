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
        bg: "#FAF9F6",
        card: "#FFFFFF",
        line: "#E9E6DF",
        line2: "#F1EFE9",
        txt: "#17161A",
        mut: "#6E6A61",
        faint: "#A8A296",
        acc: {
          DEFAULT: "#4F46E5",
          2: "#7C5CFF",
          d: "#4338CA",
          bg: "#EEEDFB",
          line: "#DCD9F8",
        },
        good: {
          DEFAULT: "#188A54",
          bg: "#E7F5EE",
          line: "#CBE6D8",
        },
        warn: {
          DEFAULT: "#B45309",
          bg: "#FCF2E2",
          line: "#F0DDBB",
        },
        bad: {
          DEFAULT: "#C0362C",
          bg: "#FBECEA",
        },
        pink: {
          art: "#EC4899",
        },
        teal: {
          art: "#14B8A6",
        },
        attest: {
          bg: "#FAF9F6",
          ink: "#17161A",
          blue: "#4F46E5",
          blueHover: "#4338CA",
          amber: "#B45309",
          red: "#C0362C",
          green: "#188A54",
          surface: "#FFFFFF",
          border: "#E9E6DF",
          muted: "#6E6A61",
          card: "#FFFFFF",
          sidebar: "#FFFFFF",
        },
      },
      boxShadow: {
        sh: "0 1px 2px rgba(23,22,26,.04), 0 10px 30px -14px rgba(23,22,26,.12)",
        sh2: "0 24px 60px -26px rgba(23,22,26,.25)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-inter-tight)", "var(--font-inter)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "20px",
        "card-lg": "22px",
      },
      transitionTimingFunction: {
        attest: "cubic-bezier(.22,.75,.2,1)",
      },
    },
  },
  plugins: [],
};

export default config;

