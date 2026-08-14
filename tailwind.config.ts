import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        coral: {
          50: "#fdf8f6",
          100: "#fbf0ec",
          200: "#f7ddce",
          300: "#f1c3aa",
          400: "#e89e7a",
          500: "#d97757", // CodeMorph Brand Coral
          600: "#c96442", // Brand Coral Hover
          700: "#aa4e33",
          800: "#89402c",
          900: "#703728",
          950: "#3d1b13",
        },
        terracotta: {
          50: "#fdf8f6",
          100: "#fbf0ec",
          200: "#f7ddce",
          300: "#f1c3aa",
          400: "#e89e7a",
          500: "#d97757",
          600: "#c96442",
          700: "#aa4e33",
          800: "#89402c",
          900: "#703728",
          950: "#3d1b13",
        },
        neutral: {
          950: "#000000", // True Black Canvas
          900: "#121212", // Card Surface
          850: "#161616", // Elevated Surface
          800: "#1a1a1a",
          750: "#222222",
          700: "#262626", // Border Subtle
          600: "#333333", // Border Elevated
          400: "#b6b6b6", // Text Muted
          100: "#f2f2f2", // Text Primary
        },
        sand: {
          50: "#ffffff",
          100: "#f2f2f2", // Text Primary
          200: "#e5e5e5",
          300: "#cccccc",
          400: "#b6b6b6", // Text Muted
          500: "#8c8c8c",
          600: "#666666",
          700: "#444444",
          800: "#333333",
          900: "#1a1a1a",
          950: "#121212",
        },
        charcoal: {
          800: "#262626",
          850: "#1a1a1a",
          900: "#121212",
          950: "#000000",
        },
        sage: {
          400: "#74c69d",
          500: "#52b788", // Verified / Passed
          600: "#40916c",
          950: "#0d2818",
        },
        rust: {
          400: "#f28482",
          500: "#e05353", // Vulnerability / Critical
          600: "#c1121f",
          950: "#2b0a0a",
        },
        amber: {
          400: "#f59e0b",
          500: "#e09f3e", // Self-Healing / Retrying
          600: "#d97706",
          950: "#291800",
        },
        link: {
          DEFAULT: "#82b6ff",
          hover: "#a4c9ff",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontSize: {
        'display-h1': ['40px', { lineHeight: '50px', fontWeight: '600' }],
        'heading-h2': ['24px', { lineHeight: '30px', fontWeight: '600' }],
        'body': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body-compact': ['16px', { lineHeight: '18.4px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '18px', fontWeight: '400' }],
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Helvetica Neue'",
          "Arial",
          "sans-serif"
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "'Courier New'",
          "monospace"
        ],
      },
      boxShadow: {
        'flat': '0 1px 2px 0 rgba(0, 0, 0, 0.5)',
        'coral': '0 2px 12px -2px rgba(217, 119, 87, 0.25)',
      }
    },
  },
  plugins: [],
}
export default config
