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
          light: "#121212",
          dark: "#F3F4F6",
          soft: "#262626",
          darkSoft: "#e0e0e0",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          light: "#FFFFFF",
          dark: "#141820",
        },
        borderMuted: {
          DEFAULT: "#E5E3DC",
          light: "#E5E3DC",
          dark: "#202530",
        },
        paper: {
          DEFAULT: "#FAF8F5",
          light: "#FAF8F5",
          dark: "#0D0F12",
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
        cream: "#FAF8F5",
        graphite: "#707070",
        sunshine: "#ffda6e",
        mint: "#6ece9d",
        darkBg: "#0e1013",
        darkCard: "#16191f",
        darkBorder: "#282e3a",
        darkMuted: "#9e9e9e",
      },
      fontFamily: {
        sans: ['"DM Sans"', "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"],
        serif: ['"Instrument Serif"', "Georgia", '"DM Sans"', "serif"],
        mono: ['"JetBrains Mono"', '"DM Sans"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 10px 30px -10px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.05)",
        cardDark: "0 4px 25px -2px rgba(0, 0, 0, 0.4)",
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