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
        terracotta: {
          50: "#fdf8f6",
          100: "#fbf0ec",
          200: "#f7ddce",
          300: "#f1c3aa",
          400: "#e89e7a",
          500: "#d97757", // Claude Iconic Terracotta Primary
          600: "#c96442",
          700: "#aa4e33",
          800: "#89402c",
          900: "#703728",
          950: "#3d1b13",
        },
        sand: {
          50: "#faf9f6",
          100: "#f4f2eb",
          200: "#e9e5d9",
          300: "#d8d2c0",
          400: "#c2baa3",
          500: "#a89f85",
          600: "#8f856c",
          700: "#746a55",
          800: "#5e5646",
          900: "#4e473b",
          950: "#2a261f",
        },
        charcoal: {
          850: "#1e1d1b",
          900: "#191816", // Warm Card Background
          950: "#0f0f0e", // Warm Canvas Background
        },
        sage: {
          400: "#74c69d",
          500: "#52b788",
          600: "#40916c",
          950: "#0d2818",
        },
        rust: {
          400: "#f28482",
          500: "#e05353",
          600: "#c1121f",
          950: "#2b0a0a",
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
      fontFamily: {
        serif: ["Newsreader", "Lora", "Georgia", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 2px 6px -1px rgba(0, 0, 0, 0.2)',
        'warm-lg': '0 10px 30px -4px rgba(0, 0, 0, 0.5), 0 4px 12px -2px rgba(0, 0, 0, 0.3)',
        'terracotta': '0 4px 20px -2px rgba(217, 119, 87, 0.25)',
      }
    },
  },
  plugins: [],
}
export default config
