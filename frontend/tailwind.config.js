/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Fix for the shadcn border-border rule
        border: "hsl(var(--border) / <alpha-value>)",
        
        // Editorial Palette
        paper: {
          light: "#FAF8F5",
          dark: "#0D0F12",
        },
        ink: {
          light: "#121212",
          dark: "#F3F4F6",
        },
        surface: {
          light: "#FFFFFF",
          dark: "#141820",
        },
        borderMuted: {
          light: "#E5E3DC",
          dark: "#202530",
        },
      },
      fontFamily: {
        serif: ['"Instrument Serif"', "Georgia", "serif"],
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        cardDark: "0 4px 25px -2px rgba(0, 0, 0, 0.4)",
      },
    },
  },
  plugins: [],
};