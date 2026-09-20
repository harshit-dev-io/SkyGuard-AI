/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",

        // Mobbin Gallery-White Monochrome + Electric Blue System
        canvas: {
          DEFAULT: "#ffffff",
          soft: "#f3f3f3",
          dark: "#0e1013",
          darkSoft: "#16191f",
        },
        field: {
          DEFAULT: "#f0f0f0",
          dark: "#1c2028",
        },
        hairline: {
          DEFAULT: "#e0e0e0",
          soft: "#f0f0f0",
          dark: "#282e3a",
          darkSoft: "#1e232d",
        },
        ink: {
          DEFAULT: "#141414",
          soft: "#262626",
          dark: "#f5f5f5",
          darkSoft: "#e0e0e0",
        },
        mobbinMuted: {
          DEFAULT: "#707070",
          dark: "#9e9e9e",
        },
        mobbinFaint: {
          DEFAULT: "#adadad",
          dark: "#666666",
        },
        accent: {
          DEFAULT: "#0066ff",
          hover: "#0052cc",
          light: "#e6f0ff",
          dark: "#3385ff",
        },

        // Legacy compatibility tokens
        cream: "#ffffff", // Mobbin pure white canvas replaces cream
        graphite: "#707070",
        sunshine: "#ffda6e",
        mint: "#6ece9d",
        darkBg: "#0e1013",
        darkCard: "#16191f",
        darkBorder: "#282e3a",
        darkMuted: "#9e9e9e",

        paper: {
          light: "#ffffff",
          dark: "#0e1013",
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        serif: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"DM Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        cards: "24px",
        buttons: "9999px",
        tags: "9999px",
        pills: "9999px",
        images: "16px",
        inputs: "16px",
        squircle: "30%",
      },
      spacing: {
        "48": "48px",
        "64": "64px",
        "128": "128px",
        "192": "192px",
      },
      maxWidth: {
        page: "1200px",
      },
    },
  },
  plugins: [],
};