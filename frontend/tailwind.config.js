/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Graphite/charcoal surfaces, not pure black — matches instrument
        // cluster / automotive engineering software rather than AI-SaaS dark mode.
        graphite: {
          950: "#0d0f11", // deepest background
          900: "#131619", // page background
          850: "#181c20", // primary surface
          800: "#1e2328", // raised panel
          700: "#2a3038", // borders / dividers
          600: "#3a424c", // inactive controls
          500: "#5a6570", // muted text / icons
          400: "#889199", // secondary text
        },
        // Restrained electric cyan — the single accent color, used sparingly.
        accent: {
          DEFAULT: "#3fd6e0",
          dim: "#2a9aa3",
          glow: "rgba(63, 214, 224, 0.15)",
        },
        // Status colors ONLY carry diagnostic meaning — never decorative.
        status: {
          healthy: "#3ecf8e",
          warning: "#e8a13a",
          critical: "#e5484d",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "'Roboto Mono'", "ui-monospace", "monospace"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.18em",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.02) inset, 0 24px 48px -24px rgba(0,0,0,0.6)",
      },
    },
  },
  plugins: [],
};
