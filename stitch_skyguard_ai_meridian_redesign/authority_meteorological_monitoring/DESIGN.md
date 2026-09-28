---
name: Authority Meteorological Monitoring
colors:
  surface: '#fdf8f5'
  surface-dim: '#ded9d6'
  surface-bright: '#fdf8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f7f3ef'
  surface-container: '#f2ede9'
  surface-container-high: '#ece7e4'
  surface-container-highest: '#e6e2de'
  on-surface: '#1c1b19'
  on-surface-variant: '#594138'
  inverse-surface: '#32302e'
  inverse-on-surface: '#f5f0ec'
  outline: '#8d7166'
  outline-variant: '#e1bfb2'
  surface-tint: '#a43d00'
  primary: '#a03b00'
  on-primary: '#ffffff'
  primary-container: '#c94c00'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb597'
  secondary: '#712edd'
  on-secondary: '#ffffff'
  secondary-container: '#8b4ef7'
  on-secondary-container: '#fffbff'
  tertiary: '#006a35'
  on-tertiary: '#ffffff'
  tertiary-container: '#008645'
  on-tertiary-container: '#f6fff4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcd'
  primary-fixed-dim: '#ffb597'
  on-primary-fixed: '#360f00'
  on-primary-fixed-variant: '#7d2d00'
  secondary-fixed: '#ebddff'
  secondary-fixed-dim: '#d3bbff'
  on-secondary-fixed: '#250059'
  on-secondary-fixed-variant: '#5b00c5'
  tertiary-fixed: '#86faa7'
  tertiary-fixed-dim: '#6add8d'
  on-tertiary-fixed: '#00210c'
  on-tertiary-fixed-variant: '#005228'
  background: '#fdf8f5'
  on-background: '#1c1b19'
  surface-variant: '#e6e2de'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 2rem
    fontWeight: '600'
    lineHeight: 2.5rem
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: 2rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: '400'
    lineHeight: 1.5rem
  body-md:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  body-sm:
    fontFamily: Inter
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
  label-lg:
    fontFamily: Inter
    fontSize: 0.875rem
    fontWeight: '500'
    lineHeight: 1.25rem
  label-sm:
    fontFamily: Inter
    fontSize: 0.6875rem
    fontWeight: '600'
    lineHeight: 0.875rem
    letterSpacing: 0.04em
  telemetry-lg:
    fontFamily: JetBrains Mono
    fontSize: 1.25rem
    fontWeight: '500'
    lineHeight: 1.5rem
    letterSpacing: -0.02em
  telemetry-md:
    fontFamily: JetBrains Mono
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
  telemetry-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-dense: 0.5rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system delivers an authority-grade, mission-critical operational workspace engineered for meteorologists, utility grid operators, and climate compliance auditors. The visual language rejects decorative trends in favor of institutional precision, rapid ocular scanning, and low cognitive fatigue under prolonged high-stress conditions. 

The aesthetic fuses Swiss modernist structure with the functional rigor of precision aerospace telemetry: crisp architectural hairlines, pure neutral surfaces with warm mineral undertones, and unambiguous chromatic signal mapping. The interface must communicate unquestioned empirical accuracy, high data integrity, and deterministic system state. Micro-interactions are deliberate and crisp, avoiding buoyant or playful kinematics to preserve spatial stability during severe weather crises.

## Colors

The palette relies on a clinical light mode architecture engineered for maximum legibility in ambient control rooms.

### Base Canvas & Surfaces
- **Canvas (`#FFFFFF`)**: Pure white base viewport.
- **Surface (`#FFFFFF`)**: Primary foreground for cards, docked monitoring docks, and contextual flyouts.
- **Surface Muted (`#FAF9F7`)**: Warm stone tint used strictly for secondary sidebars, dense data table striping, inactive panel headers, and canvas grouping backdrops.
- **Border (`#E9E5DF`)**: Subdued structural hairline divider. Never exceed 1px solid.

### Typography & Ink
- **Primary Ink (`#1B1A18`)**: Warm obsidian. Eliminates harsh high-contrast ocular vibration caused by `#000000` while preserving strict WCAG AAA compliance.
- **Muted Ink (`#716C64`)**: Desaturated slate-stone for secondary telemetry labels, metadata, ISO-8601 timestamps, and inactive field boundaries.

### Brand & Operations
- **Accent (`#E1590C`)**: High-visibility solar orange-red for primary callouts, selected states, and active telemetry streams.
- **Accent Hover (`#C24A08`)**: Deepened burnt umber for interacted states.
- **Accent Soft (`#FDEDE1`)**: Tonal orange wash reserved for active table row highlights, live stream notification badges, and selected controls.

### Signals & Machine Intelligence
- **Signal Green (`#1F9D55`)**: Nominal sensor connectivity, nominal grid frequency, cleared conditions.
- **Signal Amber (`#E8A317`)**: Meteorological advisory, convective threshold warning, elevated attention.
- **Signal Red (`#D6483F`)**: Sensor telemetry loss, critical flash warning, infrastructure trip alert.
- **xAI Violet (`#6D28D9`)**: Strictly fenced for synthetic intelligence, machine-learning spatial consensus, and neural forecasting attribution surfaces. Do not use for generic UI actions.

## Typography

The typographic engine enforces a dual-hierarchy architecture:
1. **Interface & Prose (`Inter`)**: Deployed across system structure, dialogs, form fields, and analytical assessments. Tuned for structural clarity using Medium (500) and SemiBold (600) weights.
2. **Operational Telemetry (`JetBrains Mono`)**: Mandatory for all quantitative readouts, including barometric pressures (hPa), wind vectors, geo-spatial coordinates, epoch/UTC timestamps, and model variance metrics.

Numbers displayed in `Inter` must always enforce tabular sizing (`font-variant-numeric: tabular-nums`) to prevent layout shifts during live data re-renders. Labels at or below `0.75rem` (`label-sm`) default to uppercase treatment with tracking expanded to `+0.04em` for scan-ability in high-density multi-monitor command views.

## Layout & Spacing

The layout is an uncompromising full-bleed operations console. Centered viewports, decorative letterboxing, and arbitrary fixed `max-width` wrappers are prohibited. 

- **Edge Bounds**: The root viewport attaches directly to browser borders with a locked outer padding (`margin`) of `1.5rem` (24px).
- **Grid Structure**: 100% fluid operational canvas configured around a 12-column foundation or continuous nested multi-panel splits. 
- **Column Gap (`gutter`)**: Standardized to `1rem` (16px) for high-level module segregation, shifting to `gutter-dense` (`0.5rem` / 8px) within telemetry toolbars, radar controls, and sub-metric grids.
- **Density Adaptation**: Responsive breakdown drops column count but never reduces information density. Tablets and secondary operational monitors collapse tertiary analytical inspector panels into overlay drawers while pinning primary radar feeds and tabular streams to 100% width.

## Elevation & Depth

This design system uses a strict non-skeuomorphic, low-elevation philosophy. Visual hierarchy is established via line discipline and tonal stacking rather than heavy atmospheric shadows.

- **Static Surfaces & Panels**: Zero elevation. Static cards, data tables, map containers, and splitters rely solely on a 1px continuous hairline border (`#E9E5DF`). Drop shadows on flat structural panels are forbidden to maintain screen rendering performance and high data density.
- **Z-Index Layering via Tones**: Depth is generated through surface juxtaposition: baseline `#FFFFFF` containers resting over `#FAF9F7` structural backdrops.
- **Floating Overlays & Menus**: Ephemeral elements—including contextual dropdowns, flyout inspector menus, predictive model popovers, and sticky countdown pills—leverage a low-diffusion, shadow: `0 4px 16px -2px rgba(27, 26, 24, 0.08), 0 1px 3px 0 rgba(27, 26, 24, 0.04)`.
- **Modals**: Centered system alerts maintain a hairline border (`#E9E5DF`), a crisp high-focus perimeter shadow: `0 12px 32px -4px rgba(27, 26, 24, 0.12)`, supported by an ambient backdrop scrim of `rgba(27, 26, 24, 0.32)`.

## Shapes

The geometric architecture follows deliberate mathematical constraints:

- **Interactive Nodes (`8px` / 0.5rem)**: Standardized corner radius for all functional controls, buttons, text inputs, segmented button segments, and table filter menus.
- **Structural Modules (`12px` / 0.75rem)**: Base corner radius for all parent cards, charts, visual radar containers, modals, and operational side panels.
- **Status Pills & Context Badges (`999px`)**: Fully rounded geometry reserved for state indicators, system operational counters, risk category labels, and coordinate markers.
- **Internal Elements**: Child containers nested inside parent cards must adopt an inner radius offset formula (`radius_inner = radius_outer - padding`) to ensure clean concentric perimeters without corner distortion.

## Components

### Buttons
- **Primary**: Solid `#E1590C` background, `#FFFFFF` text (`label-lg`), 8px border radius, 0px border. Hover transitions to `#C24A08`. Active compression: scale 0.99.
- **Secondary**: `#FFFFFF` background, 1px solid `#E9E5DF`, `#1B1A18` text. Hover transitions to `#FAF9F7` with `#1B1A18` border.
- **xAI Predictive Action**: `#6D28D9` background, `#FFFFFF` text, paired with a subtle leading model confidence icon. Hover states use `#5B21B6`.

### Inputs & Selection Controls
- **Input Fields**: Height locked to 36px or 40px, `#FFFFFF` surface, 1px solid `#E9E5DF`, 8px radius. Text in `Inter` 14px (`body-md`). Focused state transitions border to `#E1590C` with an outline ring: `0 0 0 1px #E1590C`.
- **Checkboxes & Radios**: 16px precision boxes, 4px border radius for checkboxes, 50% for radios. Border is 1.5px `#716C64` when unchecked; fills with `#E1590C` when selected.

### Chips, Badges & Indicators
- **State Badges**: Pill-shaped (`999px`), 4px vertical by 8px horizontal padding. Composed of an `accentSoft` or signal-tinted background, paired with high-contrast text and a 6px status dot.
- **Live Stream Pill**: Outer badge in `#FDEDE1` holding a solid 6px `#E1590C` pulsing point alongside uppercase mono-spaced tracking text: `LIVE: 120Hz`.

### Data Tables & Sensor Lists
- Headers use uppercase `label-sm` in `#716C64`, anchored by a 1px solid `#E9E5DF` lower border.
- Row heights pegged at 36px (dense) or 44px (default). Alternating row striping leverages `#FAF9F7`. Hover creates an instant switch to `#FDEDE1` (at 40% alpha).
- Numerical outputs are right-aligned, rendering in `telemetry-md` with strict tabular spacing.

### Explainability Panels (xAI Surfaces)
- Dedicated surfaces visualizing consensus confidence, neural ensemble variance, and sensor weightings.
- Framed with a 1px border tinted in `#6D28D9` (at 20% opacity) on a `#FFFFFF` surface, accented with an authoritative `#6D28D9` status ribbon and monospaced attribution scores.