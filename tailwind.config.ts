import type { Config } from "tailwindcss";

/**
 * Linear marketing design system — encoded as Tailwind tokens.
 * Dark-canvas system: #010102 anchor, four-step surface ladder, hairline borders,
 * scarce lavender accent (#5e6ad2). See DESIGN spec in the project plan.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface ladder
        canvas: "#010102",
        "surface-1": "#0c0d0f",
        "surface-2": "#141518",
        "surface-3": "#1a1c20",
        "surface-4": "#22242a",
        // Hairlines
        hairline: "#23252a",
        "hairline-strong": "#34373d",
        "hairline-tertiary": "#1b1d22",
        // Brand / accent (lavender-blue) — scarce
        primary: "#5e6ad2",
        "primary-hover": "#828fff",
        "primary-focus": "#5e69d1",
        "on-primary": "#ffffff",
        "brand-secure": "#7a7fad",
        // Text
        ink: "#f7f8f8",
        "ink-muted": "#d0d6e0",
        "ink-subtle": "#8a8f98",
        "ink-tertiary": "#62666d",
        // Inverse
        "inverse-canvas": "#ffffff",
        "inverse-ink": "#08090a",
        // Semantic — success is the only marketing-chrome semantic color.
        // bull/bear live INSIDE product/data surfaces (documented exception).
        success: "#27a644",
        bull: "#27a644",
        bear: "#d65a5a",
        warning: "#c2a73e",
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "24px",
        pill: "9999px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "24px",
        xl: "32px",
        xxl: "48px",
        section: "96px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "SF Pro Display", "-apple-system", "system-ui", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SF Mono", "Menlo", "monospace"],
      },
      fontSize: {
        // token: [size, { lineHeight, letterSpacing, fontWeight }]
        "display-xl": ["80px", { lineHeight: "1.05", letterSpacing: "-3px", fontWeight: "600" }],
        "display-lg": ["56px", { lineHeight: "1.1", letterSpacing: "-1.8px", fontWeight: "600" }],
        "display-md": ["40px", { lineHeight: "1.15", letterSpacing: "-1px", fontWeight: "600" }],
        headline: ["28px", { lineHeight: "1.2", letterSpacing: "-0.6px", fontWeight: "600" }],
        "card-title": ["22px", { lineHeight: "1.25", letterSpacing: "-0.4px", fontWeight: "500" }],
        subhead: ["20px", { lineHeight: "1.4", letterSpacing: "-0.2px", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.5", letterSpacing: "-0.1px", fontWeight: "400" }],
        body: ["16px", { lineHeight: "1.5", letterSpacing: "-0.05px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.4", letterSpacing: "0", fontWeight: "400" }],
        button: ["14px", { lineHeight: "1.2", letterSpacing: "0", fontWeight: "500" }],
        eyebrow: ["13px", { lineHeight: "1.3", letterSpacing: "0.4px", fontWeight: "500" }],
        mono: ["13px", { lineHeight: "1.5", letterSpacing: "0", fontWeight: "400" }],
      },
      maxWidth: {
        content: "1280px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
