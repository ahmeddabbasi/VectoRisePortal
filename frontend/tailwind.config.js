/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        ink: "hsl(var(--foreground) / <alpha-value>)",
        paper: "hsl(var(--background) / <alpha-value>)",
        lime: "hsl(var(--accent) / <alpha-value>)",
        lavender: "hsl(var(--accent) / <alpha-value>)",
        navy: {
          DEFAULT: "#0f1c2e",
          deep: "#0a0e1a",
        },
        brand: {
          DEFAULT: "#0f7ef5",
          shader: "#1c8af2",
          logo: "#1c7fd4",
          deep: "#0a3d8f",
          muted: "#536788",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta)", "Plus Jakarta Sans", "system-ui", "sans-serif"],
        display: ["var(--font-syne)", "Syne", "sans-serif"],
        serif: ["var(--font-syne)", "Syne", "sans-serif"],
        mono: ["var(--font-space-mono)", "Space Mono", "monospace"],
      },
      borderRadius: {
        DEFAULT: "1rem",
      },
      boxShadow: {
        nav: "0 8px 30px rgba(15, 28, 46, 0.08)",
        "nav-dark": "0 8px 30px rgba(0, 0, 0, 0.35)",
        bento: "0 0 0 1px rgba(255, 255, 255, 0.08), 0 20px 50px -28px rgba(15, 28, 46, 0.55)",
      },
      transitionTimingFunction: {
        expo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};
