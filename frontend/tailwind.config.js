/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",

        // Arcadia — Forest Observatory at Dawn Color System
        canopy: {
          DEFAULT: "#104336",
          dark: "#0b2e25",
          light: "#175a49",
        },
        mint: {
          DEFAULT: "#0fff87",
          pulse: "#0fff87",
          hover: "#0be376",
        },
        orb: {
          violet: "#7c18d3",
          lavender: "#e8e7f5",
        },
        creamPaper: {
          DEFAULT: "#f3f1ec",
          dark: "#0b1714",
        },
        cream: {
          DEFAULT: "#f3f1ec",
          dark: "#0b1714",
        },
        graphite: {
          DEFAULT: "#535e5d",
          dark: "#8fa59e",
        },
        darkMuted: {
          DEFAULT: "#8fa59e",
          dark: "#8fa59e",
        },
        sunshine: {
          DEFAULT: "#ffda6e",
          dark: "#ffda6e",
        },
        sheetWhite: {
          DEFAULT: "#ffffff",
          dark: "#11221e",
        },
        bark: {
          DEFAULT: "#101f1e",
          light: "#101f1e",
          dark: "#e2ebe8",
        },
        ink: {
          DEFAULT: "#000000",
          light: "#101f1e",
          dark: "#ffffff",
          soft: "#333333",
          darkSoft: "#d2ddd9",
        },
        slate: {
          DEFAULT: "#535e5d",
          muted: "#798281",
          charcoal: "#333333",
          light: "#535e5d",
          dark: "#8fa59e",
        },
        sage: {
          mist: "#afc4bf",
          pale: "#c2cec8",
          tint: "#e8e7f5",
          dark: "#25423a",
        },

        // Mapped Aliases to support existing component class names
        canvas: {
          DEFAULT: "#f3f1ec",
          soft: "#eae7e0",
          dark: "#0b1714",
          darkSoft: "#11221e",
        },
        field: {
          DEFAULT: "#f3f1ec",
          dark: "#142823",
        },
        hairline: {
          DEFAULT: "#afc4bf",
          soft: "#c2cec8",
          dark: "#25423a",
          darkSoft: "#2d4f46",
        },
        surface: {
          DEFAULT: "#ffffff",
          light: "#ffffff",
          dark: "#11221e",
        },
        borderMuted: {
          DEFAULT: "#afc4bf",
          light: "#afc4bf",
          dark: "#25423a",
        },
        paper: {
          DEFAULT: "#f3f1ec",
          light: "#f3f1ec",
          dark: "#0b1714",
        },
        mobbinMuted: {
          DEFAULT: "#535e5d",
          dark: "#8fa59e",
        },
        mobbinFaint: {
          DEFAULT: "#798281",
          dark: "#708a82",
        },
        accent: {
          DEFAULT: "#104336",
          hover: "#0b2e25",
          light: "#e8f0ec",
          dark: "#0fff87",
        },
      },
      fontFamily: {
        sans: ["'DM Sans'", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "'Segoe UI'", "Roboto", "sans-serif"],
        serif: ["'DM Sans'", "Georgia", "serif"],
        mono: ["'DM Sans'", "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "none",
        card: "none",
        cardDark: "none",
      },
      borderRadius: {
        cards: "16px",
        buttons: "8px",
        tags: "9999px",
        pills: "9999px",
        images: "16px",
        inputs: "4px",
        squircle: "16px",
      },
      spacing: {
        "8": "8px",
        "16": "16px",
        "24": "24px",
        "32": "32px",
        "40": "40px",
        "48": "48px",
        "64": "64px",
        "88": "88px",
        "96": "96px",
        "120": "120px",
      },
      maxWidth: {
        page: "1200px",
        arcadia: "1200px",
      },
      backgroundImage: {
        'hero-wash': "linear-gradient(212.12deg, #afc4bf 14.83%, #e8e7f5 52.99%, #f1eee9 79.47%)",
        'isometric-wash': "linear-gradient(180deg, #e8f0ec 0%, #f1eee9 100%)",
      },
    },
  },
  plugins: [],
};