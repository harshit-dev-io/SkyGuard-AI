/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Strict - AI Design System Tokens
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        surfaceMuted: 'var(--color-surface-muted)',
        border: 'var(--color-border)',
        ink: 'var(--color-ink)',
        inkMuted: 'var(--color-ink-muted)',
        accent: 'var(--color-accent)',
        accentSoft: 'var(--color-accent-soft)',
        accentSoftBorder: 'var(--color-accent-soft-border)',
        accentText: 'var(--color-accent-text)',
        signalGreen: '#1F9D55',
        signalGreenLight: 'var(--color-signal-green-light)',
        signalAmber: '#E8A317',
        signalAmberLight: 'var(--color-signal-amber-light)',
        signalRed: '#D6483F',
        signalRedLight: 'var(--color-signal-red-light)',
        xaiViolet: '#6D28D9',
        xaiVioletLight: 'var(--color-xai-violet-light)',

        // Stitch - AI code.html Utility Aliases
        brandDark: 'var(--color-ink)',
        panelBg: 'var(--color-surface-muted)',
        cardBorder: 'var(--color-border)',
        brandAccent: 'var(--color-accent)',

        // Backward compatibility mappings for legacy references
        canopy: {
          DEFAULT: 'var(--color-ink)',
          dark: '#15130F',
          light: '#26211A',
        },
        mint: {
          DEFAULT: '#1F9D55',
          pulse: '#1F9D55',
          hover: '#168045',
        },
        orb: {
          violet: '#6D28D9',
          lavender: '#F3E8FF',
        },
        creamPaper: {
          DEFAULT: 'var(--color-surface-muted)',
          dark: '#15130F',
        },
        cream: {
          DEFAULT: 'var(--color-surface-muted)',
          dark: '#15130F',
        },
        graphite: {
          DEFAULT: 'var(--color-ink-muted)',
          dark: '#9A938A',
        },
        darkMuted: {
          DEFAULT: 'var(--color-ink-muted)',
          dark: '#9A938A',
        },
        sunshine: {
          DEFAULT: '#E8A317',
          dark: '#E8A317',
        },
        sheetWhite: {
          DEFAULT: 'var(--color-surface)',
          dark: '#1E1A15',
        },
        bark: {
          DEFAULT: 'var(--color-ink)',
          light: 'var(--color-ink)',
          dark: '#F3EFE8',
        },
        slate: {
          DEFAULT: 'var(--color-ink-muted)',
          muted: 'var(--color-ink-muted)',
          charcoal: 'var(--color-ink)',
          light: 'var(--color-ink-muted)',
          dark: '#9A938A',
        },
        sage: {
          mist: 'var(--color-border)',
          pale: 'var(--color-border)',
          tint: '#F3E8FF',
          dark: '#332C23',
        },
        field: {
          DEFAULT: 'var(--color-surface-muted)',
          dark: '#1E1A15',
        },
        hairline: {
          DEFAULT: 'var(--color-border)',
          soft: 'var(--color-border)',
          dark: '#332C23',
          darkSoft: '#332C23',
        },
        borderMuted: {
          DEFAULT: 'var(--color-border)',
          light: 'var(--color-border)',
          dark: '#332C23',
        },
        paper: {
          DEFAULT: 'var(--color-surface-muted)',
          light: 'var(--color-surface-muted)',
          dark: '#15130F',
        },
      },
      fontFamily: {
        sans: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      borderRadius: {
        cards: "12px",
        buttons: "8px",
        tags: "9999px",
        pills: "9999px",
        images: "12px",
        inputs: "8px",
        squircle: "12px",
      },
      boxShadow: {
        soft: "none",
        card: "none",
        cardDark: "none",
        elevation: "0 4px 16px -2px rgba(27, 26, 24, 0.08), 0 1px 3px 0 rgba(27, 26, 24, 0.04)",
      },
    },
  },
  plugins: [],
};