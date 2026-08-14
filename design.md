# Claude Design System — CodeMorph Specification

An editorial, warm, highly polished design system inspired by Anthropic's Claude interface, tailored for autonomous developer tools.

---

## 🎨 1. Color Palette & Philosophy

Claude's aesthetic avoids cold blue/cyan tech clichés, garish neon accents, and harsh purple glows. It embraces **warmth, intelligence, humanism, and serene clarity**.

### Primary Surfaces & Canvas
- **Canvas / Background**: `hsl(30, 7%, 6%)` (`#0f0f0e`) — Deep, warm espresso black
- **Card Surface**: `hsl(30, 6%, 10%)` (`#191816`) — Warm charcoal/onyx
- **Elevated Surface**: `hsl(30, 5%, 14%)` (`#242320`) — Subtle warm slate
- **Subtle Hairline Borders**: `hsl(30, 6%, 20%)` (`#34322e`) or `rgba(255, 255, 255, 0.08)`

### Signature Accents
- **Claude Terracotta / Coral Primary**: `hsl(16, 68%, 56%)` (`#d97757`)
- **Terracotta Hover**: `hsl(16, 72%, 50%)` (`#c96442`)
- **Terracotta Glow / Soft Tint**: `rgba(217, 119, 87, 0.15)`
- **Sand / Parchment Highlights**: `hsl(40, 20%, 90%)` (`#eae7df`)
- **Muted Sand Text**: `hsl(36, 12%, 65%)` (`#a8a49a`)
- **Subtle Amber**: `hsl(38, 92%, 50%)` (`#f59e0b`)

### Semantic Indicators
- **Verified / Passed**: Sage Green `hsl(142, 40%, 55%)` (`#52b788`) / Background `rgba(82, 183, 136, 0.12)`
- **Vulnerability / Critical**: Warm Rust Crimson `hsl(0, 65%, 58%)` (`#e05353`) / Background `rgba(224, 83, 83, 0.12)`
- **Self-Healing / Retrying**: Warm Ochre / Amber `hsl(38, 80%, 55%)` (`#e09f3e`) / Background `rgba(224, 159, 62, 0.12)`
- **AST / Blueprint**: Warm Clay `hsl(24, 50%, 60%)` (`#c87d55`)

---

## ✍️ 2. Typography

- **Display / Hero Headings**: Elegant serif styling (`Newsreader`, `Georgia`, or `Charter` style with graceful curves) paired with clean geometric humanistic sans.
- **Body & Controls**: Clean, high-legibility sans (`Inter`, system UI font) with relaxed line-heights and slight letter-spacing.
- **Code & Logs**: Monospaced font (`JetBrains Mono`, `Fira Code`, `Consolas`) with soft syntax contrast.

---

## 🔲 3. Surface & Card Architecture

- Hairline 1px borders with warm subtle alpha channels (`border-[#34322e]`).
- Rounded corners (`rounded-2xl` for containers, `rounded-xl` for inner controls).
- Subtle, soft ambient shadows without hard glowing outlines.
- Ample whitespace (24px–32px container padding) to let content breathe.

---

## ⚡ 4. Interactions & Micro-Animations

- Smooth button transitions (150ms ease-out).
- Subtle scale on hover (`scale-[1.01]`).
- Gentle pulsing organic indicators for live agent execution states.
- Clean split/unified diff view with muted warm tints for additions and deletions.
