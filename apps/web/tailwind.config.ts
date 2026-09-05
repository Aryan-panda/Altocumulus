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
        background: "#050505", // Near-black void
        surface: "#0a0a0a",
        "surface-elevated": "#121212",
        hairline: "#1f1f1f",
        primary: "#ffffff",
        muted: "#888888",
        accent: "#1e293b", // Slate blue accent
      },
      borderRadius: {
        sm: "0px",
        md: "2px",
        lg: "4px",
        full: "9999px",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none'/%3E%3Cpath d='M0 39.5h40' stroke='%231f1f1f' stroke-width='1'/%3E%3Cpath d='M39.5 0v40' stroke='%231f1f1f' stroke-width='1'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
      }
    },
  },
  plugins: [],
};
export default config;

