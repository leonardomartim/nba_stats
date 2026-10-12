/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#090a11",
        surface: {
          50: "#1a1d29",
          100: "#141722",
          200: "#11131c",
          300: "#0c0e15",
        },
        border: "#1f2438",
        nba: {
          red: "#ee1a3b",
          blue: "#1d70b8",
          gold: "#fdb927",
          dark: "#08090f",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        display: ["Barlow Condensed", "Inter", "sans-serif"],
      },
      animation: {
        "pulse-fast": "pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "score-bump": "bump 0.4s ease-out",
        "live-glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        bump: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.15)", color: "#ee1a3b" },
          "100%": { transform: "scale(1)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(238, 26, 59, 0.3)" },
          "100%": { boxShadow: "0 0 15px rgba(238, 26, 59, 0.8)" },
        },
      },
    },
  },
  plugins: [],
};
