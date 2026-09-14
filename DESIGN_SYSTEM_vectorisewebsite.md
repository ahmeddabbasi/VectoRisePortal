# VectoRise Design System & Style Guide

> **Purpose:** This document is a complete design audit of the VectoRise marketing website (`vectorise.dev`). Use it as the single source of truth when building a portal or any new product surface so typography, color, spacing, motion, and component patterns stay consistent with the existing brand.

**Source codebase:** `artifacts/northstar-agency/`  
**Brand:** VectoRise — technical B2B consultancy (custom software, AI systems, operational infrastructure)  
**Tagline motif:** *"Production systems, not prototypes. Delivered consistently."*

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [Tech Stack (for parity)](#2-tech-stack-for-parity)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing, Layout & Grid](#5-spacing-layout--grid)
6. [Border Radius & Shadows](#6-border-radius--shadows)
7. [Visual Effects & Decorative Motifs](#7-visual-effects--decorative-motifs)
8. [Navigation System](#8-navigation-system)
9. [Component Patterns](#9-component-patterns)
10. [Forms & Inputs](#10-forms--inputs)
11. [Icons](#11-icons)
12. [Motion & Animation](#12-motion--animation)
13. [Accessibility & Interaction States](#13-accessibility--interaction-states)
14. [Brand Assets](#14-brand-assets)
15. [Section Background Patterns](#15-section-background-patterns)
16. [Portal Implementation Checklist](#16-portal-implementation-checklist)
17. [CSS Token Reference (copy-paste)](#17-css-token-reference-copy-paste)
18. [Key Source Files](#18-key-source-files)

---

## 1. Design Philosophy

### Core identity

VectoRise presents as a **premium, technical B2B consultancy** — confident, precise, and production-oriented. The visual language communicates engineering credibility without corporate stiffness.

### Guiding principles

| Principle | How it shows up |
|-----------|-----------------|
| **Production over prototype** | Dark navy surfaces, monospace labels, stat grids, case-study bento — everything signals shipped systems, not pitch decks |
| **Editorial confidence** | Oversized headings with tight negative tracking; Syne italic accents on key words; generous whitespace |
| **Technical precision** | Space Mono eyebrows (`01 / The premise`), uppercase micro-labels, blueprint grid lines, flow-field SVG backgrounds |
| **Restrained motion** | Subtle scroll reveals, sheen hovers, shader backgrounds — never flashy or playful |
| **Light ↔ dark rhythm** | Pages alternate between light paper backgrounds and dark ink sections; brand blue (`lavender`/`lime`) punctuates CTAs |
| **Glass & depth** | Frosted pill navigation, hairline borders, layered shadows — depth without skeuomorphism |

### Voice → visual mapping

- **Eyebrows** = section index / category (mono, uppercase, wide tracking)
- **Display italic (Syne)** = emotional emphasis word in a headline
- **Brand blue** = action, links, focus, progress — not decoration
- **Dark ink sections** = credibility, portfolio, contact hero
- **Decorative circles** = ambient depth at section edges (never interactive)

### Naming quirks (important for developers)

The Tailwind aliases `lime` and `lavender` **both resolve to the same brand blue** (`hsl(211 92% 51%)` ≈ `#0f7ef5`). They are **not** green or purple. Usage is semantic:

- `text-lime` / `bg-lime` — accents on dark surfaces, footer links, mobile nav arrows
- `text-lavender` / `bg-lavender` — accents on light surfaces, CTA bands, focus rings, icons

Similarly:

- `ink` = foreground navy (primary text color)
- `paper` = background off-white (primary surface color)

---

## 2. Tech Stack (for parity)

If the portal should feel identical, align on these choices:

| Layer | Technology |
|-------|------------|
| Framework | React 19 (SPA) |
| Build | Vite 7 |
| Routing | wouter |
| Styling | **Tailwind CSS v4** via `@tailwindcss/vite` (tokens in `index.css`, no separate `tailwind.config`) |
| Animation | framer-motion 12 |
| Icons | lucide-react |
| Class merging | `clsx` + `tailwind-merge` → `cn()` helper |
| 3D / shaders | three, @react-three/fiber (hero backgrounds only) |

**Canonical stylesheet:** `artifacts/northstar-agency/src/index.css`

---

## 3. Color System

### 3.1 Semantic tokens (light mode — default)

Tokens store HSL components **without** the `hsl()` wrapper. Use as `hsl(var(--token))`.

| Token | HSL | Hex (approx) | Tailwind alias | Role |
|-------|-----|--------------|------------------|------|
| `--background` | `204 45% 97%` | `#f4f8fb` | `bg-background`, `bg-paper` | Page background |
| `--foreground` | `222 54% 12%` | `#0e182f` | `text-foreground`, `text-ink` | Primary text |
| `--card` | `202 50% 99%` | `#fbfdfe` | `bg-card` | Elevated surfaces |
| `--card-border` | `208 34% 86%` | `#cfdce7` | `border-card-border` | Card borders |
| `--border` / `--input` | `208 34% 82%` | `#c1d2e1` | `border-border` | Default borders |
| `--ring` | `211 92% 51%` | `#0f7ef5` | `ring-ring` | Focus ring |
| `--primary` | `222 54% 12%` | `#0e182f` | `bg-primary` | Primary actions (dark) |
| `--primary-foreground` | `204 45% 97%` | `#f4f8fb` | `text-primary-foreground` | Text on primary |
| `--secondary` | `211 92% 51%` | `#0f7ef5` | `bg-secondary`, `bg-lime` | Brand blue accent |
| `--accent` | `211 92% 51%` | `#0f7ef5` | `bg-accent`, `bg-lavender`, `text-lavender` | Brand blue accent |
| `--muted` | `204 38% 91%` | `#dfeaf1` | `bg-muted` | Subtle section backgrounds |
| `--muted-foreground` | `218 24% 43%` | `#536788` | `text-muted-foreground` | Secondary body text |
| `--destructive` | `4 64% 48%` | `#c9372c` | — | Errors (rarely used) |

### 3.2 Extended palette (hardcoded in components)

These hex values appear directly in JSX/CSS and should be preserved in the portal:

| Hex | Name | Usage |
|-----|------|-------|
| `#0a0e1a` | Deep navy | Hero backgrounds, dark cards, bento grid, article image areas, dark nav glass |
| `#0f1c2e` | Nav navy | Logo text, nav text (light mode), CTA button fills |
| `#1c7fd4` | Logo accent | "Rise" in wordmark (`mark.tsx`) |
| `#1c8af2` | Shader blue | Velaris hero, flow-field SVG strokes, grid lines |
| `#3b82f6` | Bright blue | Velaris palette, gradient orb |
| `#0a3d8f` | Deep blue | Velaris palette |
| `#050a14` | Darkest blue | Velaris palette |
| `#eef4fb` | Insights tint | Insights page background |
| `#0a0a0a` | Article black | Article card body |
| `#1f1f1f` | Article border | Article card border |

### 3.3 Velaris hero shader palette

Used on the home page full-viewport hero:

```
Background: #0a0e1a
Colors:     #1c8af2, #3b82f6, #0a3d8f, #050a14
```

### 3.4 Dark mode tokens

A `.dark` class block exists in `index.css` with inverted tokens, but the **live site does not toggle global dark mode**. Instead, individual sections use `bg-ink text-paper` and `data-nav-theme="dark"`. For the portal, follow the **section-level** approach unless you explicitly need a user theme toggle.

### 3.5 Opacity conventions

Common alpha patterns on dark surfaces:

| Class | Usage |
|-------|-------|
| `text-paper/45` | Eyebrows on dark |
| `text-paper/60`–`/65` | Body copy on dark |
| `text-paper/75` | Secondary emphasis |
| `border-paper/15`–`/20` | Subtle borders on dark |
| `bg-paper/[0.03]` | Form panel fill on dark |
| `text-white/50`–`/80` | Mega menu descriptions, mobile sub-links |

On light surfaces:

| Class | Usage |
|-------|-------|
| `text-ink/65`–`/70` | Body copy |
| `text-muted-foreground` | Secondary text |
| `border-ink/10`–`/15` | Dividers, FAQ borders |

### 3.6 Selection & focus

```css
::selection {
  background: hsl(var(--secondary));  /* brand blue */
  color: hsl(var(--foreground));
}

:focus-visible {
  outline: 2px solid hsl(var(--accent));
  outline-offset: 4px;
}
```

---

## 4. Typography

### 4.1 Font families

Loaded via Google Fonts in `index.css`:

```html
<!-- Preconnect (in index.html) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
```

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap');
```

| Role | Family | CSS variable | Utility class | Weights used |
|------|--------|--------------|---------------|--------------|
| **Body / UI** | Plus Jakarta Sans | `--app-font-sans` | `font-sans` (default on `body`) | 300–800 |
| **Display accent** | Syne | `--app-font-serif` | `.font-display` | 600, 700, 800 |
| **Labels / mono** | Space Mono | `--app-font-mono` | `.font-mono-custom` | 400, 700 |

Fallback stacks:

```css
--app-font-sans:  'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--app-font-serif: 'Syne', sans-serif;
--app-font-mono:  'Space Mono', monospace;
```

### 4.2 Type scale

#### Display headings (H1)

Fluid, oversized, tight leading, negative tracking:

| Context | Size progression | Leading | Tracking | Weight |
|---------|------------------|---------|----------|--------|
| Home hero | `2.6rem` → `3.2rem` (400px+) → `3.8rem` (sm) → `5rem` (md) → `6.8rem` (lg) | `0.96` | `-0.035em` | semibold |
| Page intro | `2.35rem` → `5xl` (sm) → `7rem` (md) | `.95` / `.9` | `-.055em` | default |
| Contact hero | `2.5rem` → `6xl` (sm) → `9xl` (md) | `.9` / `.88` | `-.055em` | default |

#### Section headings (H2)

| Context | Size progression | Leading | Tracking |
|---------|------------------|---------|----------|
| Standard section | `1.85rem`–`2.35rem` → `3xl`–`5xl` (sm) → `6xl`–`8xl` (md/lg) | `.88`–`1.02` | `-.03em` to `-.055em` |
| Page CTA band | `2.25rem` → `4xl` (sm) → `6xl` (md) → `7xl` (lg) | `.92` | `-.04em` |
| Footer CTA | `2.15rem` → `4xl` (sm) → `6xl` (md) | `.94` | default |

#### Accent words in headings

Wrap emphasis words in Syne italic with brand color:

```tsx
<span className="font-display italic text-lavender">production.</span>
<span className="font-serif italic text-lime">real world.</span>
```

Both `font-display` and `font-serif` map to Syne in this codebase.

#### Eyebrow labels

Utility class `.eyebrow`:

```css
.eyebrow {
  font-family: var(--app-font-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .25em;
  color: hsl(var(--muted-foreground));
}
```

Pattern: `{number} / {section name}` — e.g. `01 / The premise`, `02 / Systems in Production`

Inline mono labels (very common):

```
font-mono-custom text-[9px]–text-[10px] uppercase tracking-[0.12em]–tracking-[0.25em]
```

#### Body text

| Context | Classes |
|---------|---------|
| Default body | `text-base leading-relaxed` (16px) |
| Large intro | `text-lg leading-relaxed` |
| Legal / long-form | `text-base leading-[1.7] text-ink/70` |
| Muted secondary | `text-sm leading-relaxed text-muted-foreground` |

#### Blockquotes / testimonials

```
text-[1.65rem] → sm:text-3xl → md:text-5xl
leading-[1.08] tracking-tight
```

Attribution:

```
font-mono-custom text-[10px] uppercase tracking-widest
```

#### Stat values

```
text-[1.75rem] → sm:text-4xl → md:text-5xl tracking-tight
```

Stat labels:

```
font-mono-custom text-[9px] uppercase tracking-widest text-muted-foreground
```

### 4.3 Typography rules for the portal

1. **Default to Plus Jakarta Sans** for all UI text
2. **Use Syne italic sparingly** — one accent word per headline maximum
3. **All section labels** use Space Mono, uppercase, wide letter-spacing
4. **Headings always use negative tracking** (`-.03em` to `-.055em`)
5. **Never use font sizes below 9px** — `9px` is the floor for mono labels
6. Use `text-balance` on large headings for better line breaks

---

## 5. Spacing, Layout & Grid

### 5.1 Container widths

| Max width | Usage |
|-----------|-------|
| `1480px` | Home hero, bento grid, some full-bleed sections |
| `1440px` | **Primary container** — header, footer, most page sections |
| `1180px` | Article research layout |
| `720px` | Legal docs, long-form article body |

Always center with `mx-auto`.

### 5.2 Horizontal padding

| Breakpoint | Padding |
|------------|---------|
| Mobile | `px-5` or `px-6` |
| Desktop (`md+`) | `md:px-10` or `md:px-12` |

### 5.3 Vertical section padding

Common patterns:

```
py-14 md:py-18     — compact sections
py-20 md:py-28     — standard sections
py-24 md:py-32     — spacious sections (contact FAQ, legal)
pb-24 md:pb-36     — page bottom padding
```

### 5.4 Page top offset (fixed header clearance)

The header is fixed. Content sections account for it:

```
pt-28 md:pt-36     — PageIntro
pt-40 md:pt-52     — Contact hero
pt-24              — Inside Velaris hero (header floats over shader)
```

Header outer padding: `px-4 pt-4 md:px-7 md:pt-6`

### 5.5 Grid patterns

| Pattern | Classes | Usage |
|---------|---------|-------|
| Content split | `lg:grid-cols-[1.1fr_0.9fr]` | Hero, contact |
| Asymmetric | `md:grid-cols-[1fr_2fr]` | Stats, testimonials |
| Two-column | `md:grid-cols-2` | General content |
| Three-column | `md:grid-cols-3` | Contact info, footer |
| Footer | `md:grid-cols-[1.4fr_1fr_1fr]` | Footer layout |
| Stats | `grid-cols-2 md:grid-cols-4` | StatRow |
| Bento | `lg:grid-cols-6` with `col-span-4` / `col-span-2` | Case studies |
| Articles | `md:grid-cols-2 lg:grid-cols-3` | Insights grid |

### 5.6 Breakpoints

Tailwind defaults plus one custom:

| Breakpoint | Width |
|------------|-------|
| default | < 640px |
| `min-[400px]` | 400px (hero text bump) |
| `sm` | 640px |
| `md` | 768px |
| `lg` | 1024px |

### 5.7 Touch targets

**Minimum interactive height: 44px** (`min-h-11` / `h-11`)

Applied consistently to: buttons, nav links, form fields, icon buttons, footer links.

### 5.8 Body constraints

```css
html {
  scroll-behavior: smooth;
  overflow-x: clip;
}
body {
  min-width: 320px;
  overflow-x: clip;
  font-family: var(--app-font-sans);
  -webkit-font-smoothing: antialiased;
}
```

---

## 6. Border Radius & Shadows

### 6.1 Border radius

| Token / Class | Value | Usage |
|---------------|-------|-------|
| `--radius` | `1rem` (16px) | CSS variable (underused directly) |
| `rounded-full` | 9999px | Nav bar, pill buttons, icon buttons, globe |
| `rounded-2xl` | 1rem | Cards, mega menu, case media, article cards |
| `rounded-3xl` | 1.5rem | Mobile nav drawer |
| `rounded-xl` | 0.75rem | Mega menu items |

**Rule:** Interactive CTAs are always **pill-shaped** (`rounded-full`). Content cards use **`rounded-2xl`**.

### 6.2 Shadows

| Shadow | Usage |
|--------|-------|
| `shadow-[0_8px_30px_rgba(15,28,46,0.08)]` | Light nav bar |
| `shadow-[0_8px_30px_rgba(0,0,0,0.35)]` | Dark nav bar |
| `shadow-[0_0_0_1px_rgba(255,255,255,0.08)]` | Hairline ring on dark cards |
| `shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_20px_50px_-28px_rgba(15,28,46,0.55)]` | Bento cards |
| `shadow-[0_24px_80px_-32px_rgba(15,28,46,0.45)]` | Featured article |
| `shadow-2xl` | Dropdown panels |

Hairline borders (`1px rgba white/black at low opacity`) are preferred over heavy drop shadows.

---

## 7. Visual Effects & Decorative Motifs

### 7.1 Glass / frosted surfaces

| Surface | Classes |
|---------|---------|
| Light nav | `bg-white/85 backdrop-blur-2xl border-[#0f1c2e]/12` |
| Dark nav | `bg-[#0a0e1a]/75 backdrop-blur-2xl border-white/20` |
| Mega menu | `bg-ink/95 backdrop-blur-2xl border-white/20 shadow-2xl` |
| Mobile drawer | `bg-ink/95 backdrop-blur-2xl rounded-3xl` |
| Bento text overlay | `bg-[#0a0e1a]/88 backdrop-blur-md` |

### 7.2 Decorative circles (recurring motif)

Large bordered or filled circles positioned off-canvas at section edges:

```tsx
<div className="pointer-events-none absolute -right-20 top-28 h-80 w-80 rounded-full border border-lavender/30 md:h-[560px] md:w-[560px]" />
<div className="pointer-events-none absolute -bottom-40 -right-10 h-80 w-80 rounded-full border border-lavender/25 opacity-60" />
<div className="pointer-events-none absolute ... rounded-full bg-lavender/10" />
```

Always `pointer-events-none`. Use `border-lavender/20`–`/30` or `bg-lavender/10`–`/15`. Optional `blur-3xl` on filled circles.

### 7.3 Blueprint grid (`.grid-lines`)

Animated grid overlay for light sections (Insights page):

```css
background-image:
  linear-gradient(to right, rgba(22,108,214,.10) 1px, transparent 1px),
  linear-gradient(to bottom, rgba(22,108,214,.10) 1px, transparent 1px);
background-size: 5rem 5rem;
animation: grid-drift 22s linear infinite;
```

Typically applied at `opacity-30`.

### 7.4 Flow field (`.flow-field`)

SVG wave lines + radial glow on dark hero sections (Contact page). Auto-animated; blue stroke `#1c8af2` at 38% opacity.

### 7.5 Section divider (`.section-rule`)

Gradient hairline that breathes:

```css
background: linear-gradient(90deg, transparent, rgba(28,138,242,.5), transparent);
animation: rule-breathe 4s ease-in-out infinite;
```

### 7.6 Sheen hover (`.sheen`)

Horizontal light sweep on pill buttons:

```css
background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.22) 50%, transparent 65%);
transition: transform .7s cubic-bezier(.16,1,.3,1);
/* hover: translateX from -120% to 120% */
```

### 7.7 Gradients

| Type | Value |
|------|-------|
| Card image fade | `bg-gradient-to-t from-[#0a0e1a]/88 to-transparent` |
| Article card fade | `from-[#0a0a0a] via-[#0a0a0a]/65 to-transparent` |
| Flow field glow | `radial-gradient(circle at 68% 34%, rgba(31,139,242,.30), transparent 25%)` |

---

## 8. Navigation System

### 8.1 Header structure

- **Fixed** at top with `z-50`
- **Pill-shaped** container: `rounded-full border backdrop-blur-2xl`
- **Scroll progress bar:** `2px` height, `bg-lavender`, width = scroll percentage, `z-[60]`

### 8.2 Adaptive nav theming

Sections declare nav context via data attributes:

```tsx
<section data-nav-theme="light">   // or "dark"
<section data-nav-light="true">    // legacy light signal
```

The header reads scroll position and switches between:

| Mode | Nav background | Text | Contact button |
|------|----------------|------|----------------|
| **Light** (over light sections) | `bg-white/85`, dark border | `text-[#0f1c2e]` | `bg-[#0f1c2e] text-white` |
| **Dark** (over dark sections) | `bg-[#0a0e1a]/75`, white border | `text-white` | `bg-white text-[#0f1c2e]` |

### 8.3 Nav link styling

```
font-mono-custom text-[10px] uppercase tracking-[.12em]
Active: font-semibold + full opacity
Default: 75–80% opacity, hover to full
```

### 8.4 Mega menu (Services)

- Trigger: Services + `ChevronDown` (rotates 180° on open)
- Panel: `rounded-2xl`, dark glass, service links with hover `bg-white/10`
- Animation: framer-motion `opacity 0→1`, `y 8→0`

### 8.5 Mobile menu

- Toggle: `Menu` / `X` icons in circular button (same light/dark inversion as contact)
- Drawer: `rounded-3xl`, full-width below header
- Links: `text-2xl font-display` with `ArrowUpRight` in `text-lime`
- Location footer: `font-mono-custom text-[9px] uppercase tracking-widest text-white/50`

**Portal guidance:** Replicate the pill nav + scroll progress + section-aware theming for visual continuity.

---

## 9. Component Patterns

### 9.1 Logo / Mark

```
Image:  /images/v-logo.png (32×32 display: h-8 w-8)
Wordmark: "Vecto" in navy + "Rise" in #1c7fd4
Font: Plus Jakarta Sans 15px semibold tracking-tight
Light variant: all white / Rise at white/80
```

### 9.2 Primary button (`Button` / `site-button.tsx`)

Pill link with arrow icon:

| Variant | Styles |
|---------|--------|
| `dark` (default) | `bg-ink text-paper` |
| `lime` | `bg-lime text-ink` |
| `light` | `border border-paper/30 text-paper` |

Shared classes:

```
sheen group inline-flex min-h-11 items-center gap-3 rounded-full px-5 py-3
font-mono-custom text-[10px] uppercase tracking-[.14em]
transition-all hover:-translate-y-0.5
```

Icon: `ArrowUpRight` size 14, hover `translate-x-0.5 -translate-y-0.5`

### 9.3 Text link CTAs

Underline style (footer, page CTA, contact success):

```
inline-flex min-h-11 items-center gap-3
border-b border-lime (or border-ink on blue surfaces)
pb-2 font-mono-custom text-[10px] uppercase tracking-[.15em]
text-lime (or text-ink on blue surfaces)
```

### 9.4 Page intro

Standard inner-page hero:

```
Section: px-5 pt-28 pb-8 md:px-10 md:pt-36 md:pb-12
Optional: bg-ink text-paper (dark variant)
Eyebrow → H1 (fluid up to 7rem) → optional body (max-w-xl)
Dark variant adds decorative circle border top-right
```

### 9.5 Page CTA band

Full-width brand blue section:

```
bg-lavender px-5 py-20 md:px-10 md:py-28
data-nav-theme="dark"
White text, Syne italic accent in ink color
Text link CTA with border-b border-ink
```

### 9.6 Footer

```
bg-ink text-paper
3-column grid: CTA | Explore links | Contact/social
Decorative circles bottom-right
Bottom bar: mono 9px uppercase, border-t border-paper/15
Copyright + tagline + legal links
```

Link hover: `hover:text-lime`  
Social icon: `h-11 w-11 rounded-full border border-paper/20 hover:border-lime hover:text-lime`

### 9.7 Cards

#### Bento case study card

```
rounded-2xl bg-[#0a0e1a]
Hairline + deep shadow
Media top, frosted text band bottom
Mono eyebrow + semibold title + muted description
Full-card link overlay (absolute inset-0 z-30)
Image hover: scale via framer-motion parent
```

#### Article card

```
rounded-2xl border border-[#1f1f1f] bg-[#0a0a0a]
min-h-[360px] flex-col
Cover image with gradient fade + ArrowUpRight top-right
Metadata: 11px zinc-500
Title: lg/xl semibold white
Excerpt: sm zinc-400, line-clamp-2
Hover: image scale-[1.02] over 500ms
```

### 9.8 FAQ accordion

```
Container: border-t border-ink/15
Items: border-b border-ink/15
Trigger: min-h-11 py-5 text-base md:text-lg flex justify-between
Icons: Plus (closed) / Minus (open), size 17
Answer: max-w-2xl pb-6 text-muted-foreground leading-relaxed
Default open: first item (index 0)
```

### 9.9 Testimonial

```
Grid: md:grid-cols-[1fr_2fr]
Asterisk icon (size 30) in lavender or white (onAccent)
Blockquote: fluid up to text-5xl
Attribution: mono uppercase 10px
On accent (blue) surface: all white tones
```

### 9.10 Stat row

```
grid-cols-2 md:grid-cols-4
border-y border-ink/15 with internal border-l/t dividers
Value: text-[1.75rem] → md:text-5xl tracking-tight
Label: mono 9px uppercase tracking-widest muted
```

### 9.11 Reveal (scroll animation wrapper)

Wraps most section content:

```tsx
initial={{ opacity: 1, y: 16 }}
animate={inView ? { opacity: 1, y: 0 } : { opacity: 1, y: 16 }}
transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
// useInView: once: true, margin: '-8% 0px'
```

Optional `delay` prop (e.g. `0.1` for stagger).

### 9.12 Page enter

```html
<main className="page-in">
```

Fades in over 0.7s with the standard easing curve.

---

## 10. Forms & Inputs

### 10.1 Contact form (dark panel)

Form container:

```
border border-paper/15 bg-paper/[0.03] p-6 md:p-8
```

Field class (inputs + textarea):

```
w-full min-h-11 border-0 border-b border-paper/20 bg-transparent
px-0 py-3 text-base text-paper outline-none transition-colors
placeholder:text-transparent
focus:border-lavender
```

Labels:

```
font-mono-custom text-[9px] uppercase tracking-widest text-paper/45
```

Submit button:

```
h-11 border border-paper/20 bg-paper px-5
font-mono-custom text-[10px] uppercase tracking-[0.16em] text-ink
hover:bg-lavender hover:text-paper
disabled:opacity-60
```

Success state: square bordered check icon (`border border-lime text-lime`), large heading, underline "Send another" link.

Error text: `text-sm text-red-300`

### 10.2 Portal form guidance

- Prefer **underline-only inputs** on dark surfaces (no boxed inputs)
- Labels above fields in Space Mono
- Full-width submit on mobile, auto-width on desktop (`sm:w-auto sm:self-start`)
- Minimum field height 44px
- Focus state: bottom border turns brand blue (`lavender`)

---

## 11. Icons

**Library:** [Lucide React](https://lucide.dev/) exclusively — no Font Awesome, no custom SVG icon set.

### Icon inventory

| Icon | Context | Typical size |
|------|---------|--------------|
| `ArrowUpRight` | CTAs, cards, nav links, buttons | 13–18px |
| `ChevronDown` | Services dropdown | 13px |
| `Menu` / `X` | Mobile nav toggle | 17px |
| `Linkedin` | Footer social | 14px |
| `Plus` / `Minus` | FAQ accordion | 17px |
| `Asterisk` | Testimonial accent | 30px |
| `Check` | Form success | 18px |
| `Clock3` | Contact FAQ sidebar | 24px |
| `MapPin`, `Mail`, `Handshake` | Contact info | 22px |

### Icon styling conventions

- On dark surfaces: `text-lime`, `text-white/80`, or inherit from parent
- On light surfaces: `text-lavender` for feature icons
- Hover arrows: `group-hover:translate-x-0.5 group-hover:-translate-y-0.5`
- Card corner arrows: `group-hover:translate-x-1 group-hover:-translate-y-1`
- Stroke width: default Lucide (2), except Check success (`strokeWidth={2}` explicit)

---

## 12. Motion & Animation

### 12.1 Standard easing

```
cubic-bezier(0.16, 1, 0.3, 1)
```

Used in: page-in, sheen, reveal, header menus, grid-drift timing context.

Framer Motion equivalent: `ease: [0.16, 1, 0.3, 1]`

### 12.2 Duration standards

| Duration | Usage |
|----------|-------|
| 150ms | Scroll progress bar width |
| 300ms | Nav color transitions |
| 500ms | Image hover scale (article cards) |
| 700ms | Page enter, reveal, sheen |
| 4s–22s | Ambient loops (grid, flow field, glow) |

### 12.3 Hover micro-interactions

| Element | Effect |
|---------|--------|
| Pill buttons | `-translate-y-0.5` + sheen sweep |
| Arrow icons | `translate-x-0.5 -translate-y-0.5` |
| Images in cards | `scale-[1.02]` to `scale-[1.03]` |
| Nav links | opacity/color transition |
| Footer links | color to lime |

### 12.4 Framer Motion usage

- **Reveal:** scroll-triggered fade-up
- **Header menus:** AnimatePresence + opacity/y
- **Bento cards:** whileHover variant (structure for future motion)
- **Box assembly loader:** scroll-scrubbed CSS animation (home/services)

### 12.5 Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .001ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .001ms !important;
  }
}
```

Components using framer-motion should also check `useReducedMotion()`.

---

## 13. Accessibility & Interaction States

| Requirement | Implementation |
|-------------|----------------|
| Focus visible | 2px accent outline, 4px offset |
| Touch targets | Minimum 44×44px (`h-11`) |
| Screen reader | FAQ answers use `sr-only` when collapsed |
| Alt text | All images have descriptive `alt` |
| Aria | Mobile menu button has `aria-label`, FAQ buttons have `aria-expanded` |
| External links | `rel="noopener noreferrer"` on social links |
| Honeypot | Contact form includes hidden `website` field |

---

## 14. Brand Assets

### 14.1 Logos

| File | Path | Usage |
|------|------|-------|
| V logo (primary) | `public/images/v-logo.png` | Header mark, favicons, OG image |
| Vectorise logo | `public/images/vectorise-logo.png` | Alternate logo asset |
| OG / social | `https://vectorise.dev/images/v-logo.png` | Meta tags |

### 14.2 Favicons

```
public/favicon.ico
public/favicon-32.png
public/favicon-48.png
public/favicon-192.png
public/favicon.png
public/apple-touch-icon.png
```

Generated via `scripts/make-favicon.py`.

### 14.3 Decorative images

```
public/images/glass_2.png
public/images/glass_3.png  (case study fallback)
public/images/glass_4.png
```

### 14.4 Case study images

```
thirdvision-transparent.png
sk-trucking-brand.png
voice-agents-new.jpg
sk-crystals-transparent.png
```

### 14.5 Brand contact

- Email: `contact@vectorise.dev`
- Location: Chantilly, Virginia, USA
- LinkedIn: `https://www.linkedin.com/company/vectorise-llc`
- Domain: `vectorise.dev`

---

## 15. Section Background Patterns

Use this rhythm when structuring portal pages:

| Pattern | Classes | Nav theme | Example |
|---------|---------|-----------|---------|
| Default light | `bg-background` or none | `light` | Page intro, FAQ |
| Insights tint | `bg-[#eef4fb]` + grid-lines | `light` | Insights page |
| Muted band | `bg-muted` | `light` | Contact info |
| Brand blue band | `bg-lavender text-white` | `dark` | Page CTA, testimonial |
| Dark section | `bg-ink text-paper` | `dark` | Bento, stats, footer |
| Dark hero | `bg-ink` + flow-field | `dark` | Contact hero |
| Full shader hero | Velaris `#0a0e1a` | `dark` | Home hero |

Alternate light → dark → accent → dark for visual pacing.

---

## 16. Portal Implementation Checklist

When building the portal, verify each item:

### Setup
- [ ] Import Google Fonts (Plus Jakarta Sans, Syne, Space Mono)
- [ ] Copy CSS tokens from `index.css` (`:root`, `@theme inline`, utilities)
- [ ] Configure Tailwind v4 with `@theme inline` color/font mappings
- [ ] Add `cn()` utility (clsx + tailwind-merge)
- [ ] Install lucide-react and framer-motion

### Visual fidelity
- [ ] Use `#0a0e1a` / `#0f1c2e` / `#0f7ef5` palette consistently
- [ ] Pill navigation with scroll progress bar
- [ ] Section `data-nav-theme` for adaptive header
- [ ] Mono uppercase eyebrows on every major section
- [ ] Syne italic for one accent word per headline
- [ ] 44px minimum touch targets
- [ ] `rounded-full` buttons, `rounded-2xl` cards
- [ ] Frosted glass nav (`backdrop-blur-2xl`)
- [ ] ArrowUpRight on all primary actions
- [ ] Sheen hover on pill buttons
- [ ] Reveal scroll animations on section content
- [ ] Decorative circles on dark sections (optional)
- [ ] Reduced motion media query

### Typography
- [ ] Body: Plus Jakarta Sans 16px leading-relaxed
- [ ] Headings: negative tracking, fluid responsive scale
- [ ] Labels: Space Mono 9–11px uppercase wide tracking
- [ ] No fonts outside the three-family system

### Components to reuse / replicate
- [ ] Mark (logo)
- [ ] Header (pill nav)
- [ ] Footer
- [ ] Button (pill CTA)
- [ ] Text link CTA (underline style)
- [ ] PageIntro
- [ ] PageCta band
- [ ] Form fields (underline style on dark)
- [ ] FAQ accordion
- [ ] StatRow (if dashboard metrics)

---

## 17. CSS Token Reference (copy-paste)

Use this block as the starting point for a portal stylesheet:

```css
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap');

:root {
  /* Colors (HSL components) */
  --background: 204 45% 97%;
  --foreground: 222 54% 12%;
  --card: 202 50% 99%;
  --card-foreground: 222 54% 12%;
  --card-border: 208 34% 86%;
  --border: 208 34% 82%;
  --input: 208 34% 82%;
  --ring: 211 92% 51%;
  --primary: 222 54% 12%;
  --primary-foreground: 204 45% 97%;
  --secondary: 211 92% 51%;
  --secondary-foreground: 202 50% 99%;
  --muted: 204 38% 91%;
  --muted-foreground: 218 24% 43%;
  --accent: 211 92% 51%;
  --accent-foreground: 202 50% 99%;
  --destructive: 4 64% 48%;
  --destructive-foreground: 204 45% 97%;

  /* Extended palette */
  --navy-deep: #0a0e1a;
  --navy-nav: #0f1c2e;
  --blue-logo: #1c7fd4;
  --blue-shader: #1c8af2;
  --blue-bright: #3b82f6;
  --blue-deep: #0a3d8f;
  --blue-darkest: #050a14;
  --insights-bg: #eef4fb;

  /* Typography */
  --app-font-sans: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --app-font-serif: 'Syne', sans-serif;
  --app-font-mono: 'Space Mono', monospace;

  /* Radius */
  --radius: 1rem;

  /* Motion */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
}

/* Semantic aliases */
.text-ink { color: hsl(var(--foreground)); }
.text-paper { color: hsl(var(--background)); }
.bg-ink { background-color: hsl(var(--foreground)); }
.bg-paper { background-color: hsl(var(--background)); }
.text-lime, .text-lavender { color: hsl(var(--accent)); }
.bg-lime, .bg-lavender { background-color: hsl(var(--accent)); }

.font-display { font-family: var(--app-font-serif); }
.font-mono-custom { font-family: var(--app-font-mono); }

.eyebrow {
  font-family: var(--app-font-mono);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .25em;
  color: hsl(var(--muted-foreground));
}
```

---

## 18. Key Source Files

| Purpose | Path |
|---------|------|
| Design tokens & global CSS | `artifacts/northstar-agency/src/index.css` |
| Logo component | `artifacts/northstar-agency/src/components/mark.tsx` |
| Primary button | `artifacts/northstar-agency/src/components/site-button.tsx` |
| Header / nav | `artifacts/northstar-agency/src/components/header.tsx` |
| Footer | `artifacts/northstar-agency/src/components/footer.tsx` |
| Page hero | `artifacts/northstar-agency/src/components/page-intro.tsx` |
| CTA band | `artifacts/northstar-agency/src/components/page-cta.tsx` |
| Scroll reveal | `artifacts/northstar-agency/src/components/reveal.tsx` |
| Contact form | `artifacts/northstar-agency/src/pages/contact.tsx` |
| Home page (hero + sections) | `artifacts/northstar-agency/src/pages/home.tsx` |
| Bento cards | `artifacts/northstar-agency/src/components/case-study-bento.tsx` |
| Article cards | `artifacts/northstar-agency/src/components/article-card.tsx` |
| FAQ | `artifacts/northstar-agency/src/components/faq.tsx` |
| Testimonial | `artifacts/northstar-agency/src/components/testimonial.tsx` |
| Stats | `artifacts/northstar-agency/src/components/stat-row.tsx` |
| Legal template | `artifacts/northstar-agency/src/components/legal-doc.tsx` |
| Class merge utility | `artifacts/northstar-agency/src/lib/utils.ts` |
| HTML shell / meta | `artifacts/northstar-agency/index.html` |
| Static assets | `artifacts/northstar-agency/public/` |

---

*Document generated from a full codebase audit of the VectoRise marketing website. Last audited: September 2025.*
