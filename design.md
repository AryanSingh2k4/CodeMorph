# CodeMorph Design System Specification

A clean, minimal, editorial design system tailored for autonomous developer tools and multi-agent remediation workflows.

---

## 🎨 1. Design Tokens & Color Palette

The CodeMorph visual system prioritizes clarity, high contrast, and serene minimalism with true black canvas and signature coral accents.

### Primary Surfaces & Canvas
- **Background / Canvas**: True Black (`#000000`)
- **Card Surface**: Dark Neutral Charcoal (`#121212`)
- **Elevated Surface**: Neutral Slate (`#161616` / `#1a1a1a`)
- **Subtle Hairline Borders**: Subtle Neutral (`#262626` / `#333333`)

### Typography & Text Colors
- **Text Primary**: Off-White (`#f2f2f2`)
- **Text Muted**: Neutral Grey (`#b6b6b6`)
- **Link Dark**: Soft Cyan-Blue (`#82b6ff`)

### Signature Brand Accents
- **Brand Coral**: `#d97757`
- **Brand Coral Hover**: `#c96442`
- **Brand Coral Soft Tint / Glow**: `rgba(217, 119, 87, 0.15)`

### Semantic Status Indicators
- **Verified / Passed**: Sage Green `#52b788` / `rgba(82, 183, 136, 0.12)`
- **Vulnerability / Critical**: Rust Crimson `#e05353` / `rgba(224, 83, 83, 0.12)`
- **Self-Healing / Retrying / Warning**: Amber Ochre `#e09f3e` / `rgba(224, 159, 62, 0.12)`

---

## ✍️ 2. Typography Scale

The typographic scale uses high-performance system-ui fonts with precise line-heights and weights for maximum legibility across dense developer dashboards:

- **display-h1**: `system-ui`, 40px, font-weight 600, line-height 50px
- **heading-h2**: `system-ui`, 24px, font-weight 600, line-height 30px
- **body**: `system-ui`, 16px, font-weight 400, line-height 24px
- **body-compact**: `system-ui`, 16px, font-weight 400, line-height 18.4px
- **caption-footer / monospace**: `system-ui` / `monospace`, 12px, font-weight 400, line-height 18px

---

## 🔲 3. Shapes & Surface Geometry

- **Minimal Flat Elevation**: Clean borders (`1px solid #262626` / `#333333`) and flat elevations without decorative neon halos or oversized glow effects.
- **Corner Radii**: Clean, subtle radii (`rounded-lg` 8px to `rounded-xl` 12px for cards, `rounded-md` 6px for tags and buttons).
- **Whitespace & Rhythm**: Balanced padding (16px–24px) for crisp scanning and rapid visual evaluation.

---

## ⚡ 4. Interactions & Motion

- **Transitions**: Snappy 150ms ease-out button and link transitions.
- **Diff Presentation**: High-contrast split and unified diff rendering with clean green/red additions and subtractions.
- **Live Agent Indicators**: Discrete pulsing status dots and spinner badges.
