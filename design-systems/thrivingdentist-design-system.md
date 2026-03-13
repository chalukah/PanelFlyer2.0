# Thriving Dentist — Design System

**Source:** thrivingdentist.com
**Brand:** Gary Takacs Dental Coaching
**Built by:** Ekwa Marketing (WordPress / Gutenberg)
**Aesthetic:** Professional · Clinical yet approachable · Trust-building · Warm authority

---

## 1. Color Tokens

### Blues (Brand Accent)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-blue` | Dodger Blue | `#106EEA` | Primary CTAs, links, active states |
| `--color-blue-hover` | Azure | `#1E83D0` | Button hover, interactive feedback |
| `--color-blue-deep` | Cerulean | `#0073AA` | Dark links, deep accent |
| `--color-blue-steel` | Steel Blue | `#17A2B8` | Info states, secondary accent |
| `--color-blue-tint` | Baby Blue | `#E2EEFD` | Highlighted backgrounds, tags |
| `--color-blue-bg` | Alice Blue | `#F1F6FE` | Section backgrounds, card tints |

### Darks (Primary Scale)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-black` | Black | `#000000` | Hard borders, icon fills |
| `--color-almost-black` | Almost Black | `#111111` | Hero text, high-contrast headings |
| `--color-ebony` | Ebony | `#151515` | Dark backgrounds |
| `--color-primary` | Dark Charcoal | `#121213` | Primary text, nav, headings |
| `--color-charcoal` | Charcoal | `#222222` | Body headings |
| `--color-dim-gray` | Dim Gray | `#2A2A2A` | Sub-headings, labels |
| `--color-dark-gray` | Dark Gray | `#333333` | Secondary headings |
| `--color-ash-gray` | Ash Gray | `#343A40` | Card headers, strong UI elements |

### Grays (Neutral Scale)

| Token | Name | Hex | Usage |
|---|---|---|---|
| `--color-slate-gray` | Slate Gray | `#444444` | Tertiary text |
| `--color-cool-gray` | Cool Gray | `#495057` | Body text, descriptions |
| `--color-gunmetal` | Gunmetal | `#555555` | Secondary body text |
| `--color-gray` | Gray | `#777777` | Muted text, placeholders |
| `--color-silver` | Silver | `#CED4DA` | Borders, dividers |
| `--color-light-gray` | Light Gray | `#DDDDDD` | Subtle dividers |
| `--color-platinum` | Platinum | `#EEEEEE` | Section backgrounds |
| `--color-snow` | Snow | `#EFEFEF` | Alternate backgrounds |
| `--color-whitish-gray` | Whitish Gray | `#F1F2F3` | Page backgrounds |
| `--color-light-silver` | Light Silver | `#F6F6F6` | Card backgrounds |
| `--color-white` | White | `#FFFFFF` | Backgrounds, button text |

### CSS Custom Properties

```css
:root {
  /* Blues */
  --color-blue:        #106EEA;
  --color-blue-hover:  #1E83D0;
  --color-blue-deep:   #0073AA;
  --color-blue-steel:  #17A2B8;
  --color-blue-tint:   #E2EEFD;
  --color-blue-bg:     #F1F6FE;

  /* Darks */
  --color-black:       #000000;
  --color-almost-black:#111111;
  --color-ebony:       #151515;
  --color-primary:     #121213;
  --color-charcoal:    #222222;
  --color-dim-gray:    #2A2A2A;
  --color-dark-gray:   #333333;
  --color-ash-gray:    #343A40;

  /* Neutrals */
  --color-slate-gray:  #444444;
  --color-cool-gray:   #495057;
  --color-gunmetal:    #555555;
  --color-gray:        #777777;
  --color-silver:      #CED4DA;
  --color-light-gray:  #DDDDDD;
  --color-platinum:    #EEEEEE;
  --color-snow:        #EFEFEF;
  --color-whitish-gray:#F1F2F3;
  --color-light-silver:#F6F6F6;
  --color-white:       #FFFFFF;

  /* Semantic aliases */
  --color-text-body:   #121213;   /* --color-primary */
  --color-text-muted:  #495057;   /* --color-cool-gray — 5.6:1 on white ✓ */
  --color-text-subtle: #555555;   /* --color-gunmetal — 7.4:1 on white ✓ */
  --color-border:      #CED4DA;   /* --color-silver */
  --color-bg-page:     #F1F2F3;   /* --color-whitish-gray */
  --color-bg-card:     #F6F6F6;   /* --color-light-silver */
}
```

---

## 2. Typography

### Font Stack

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
```

> No external/Google Fonts detected — relies on system font stack for performance.

### Size Scale

| Token | Size | Usage |
|---|---|---|
| `--font-size-xs` | `13px` | Captions, legal, meta |
| `--font-size-sm` | `16px` | Body text |
| `--font-size-md` | `20px` | Lead/intro text |
| `--font-size-lg` | `36px` | H2, section headings |
| `--font-size-xl` | `42px` | H1, hero headings |
| `--font-size-btn` | `1.125em` | Button labels |
| `--font-size-quote` | `1.5em` | Pullquotes, testimonials |

### CSS Custom Properties

```css
:root {
  --font-size-xs:    13px;
  --font-size-sm:    16px;
  --font-size-md:    20px;
  --font-size-lg:    36px;
  --font-size-xl:    42px;
  --font-size-btn:   1.125em;
  --font-size-quote: 1.5em;

  --line-height-base:  1.5;
  --line-height-quote: 1.6;
  --line-height-tight: 1.2;
}
```

### Heading Hierarchy

```css
h1 { font-size: 42px; line-height: 1.2; font-weight: 700; color: var(--color-primary); }
h2 { font-size: 36px; line-height: 1.3; font-weight: 700; color: var(--color-primary); }
h3 { font-size: 28px; line-height: 1.35; font-weight: 600; color: var(--color-charcoal); }
h4 { font-size: 22px; line-height: 1.4; font-weight: 600; color: var(--color-dark-gray); }
p  { font-size: 16px; line-height: 1.5; font-weight: 400; color: var(--color-cool-gray); }
```

---

## 3. Spacing Scale

8pt-based system mapped to WordPress preset tokens.

| Token | Value | px equiv | Usage |
|---|---|---|---|
| `--space-xs` | `0.44rem` | ~7px | Tight gaps, icon padding |
| `--space-sm` | `0.67rem` | ~11px | Inner component padding |
| `--space-md` | `1rem` | 16px | Base unit, standard gaps |
| `--space-lg` | `1.5rem` | 24px | Section sub-spacing |
| `--space-xl` | `2.25rem` | 36px | Card padding, section gaps |
| `--space-2xl` | `3.38rem` | ~54px | Large section spacing |
| `--space-3xl` | `5.06rem` | ~81px | Hero padding, page sections |

```css
:root {
  --space-xs:  0.44rem;
  --space-sm:  0.67rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2.25rem;
  --space-2xl: 3.38rem;
  --space-3xl: 5.06rem;
}
```

---

## 4. Shadows

```css
:root {
  --shadow-none:    none;
  --shadow-natural: 6px 6px 9px rgba(0, 0, 0, 0.2);
  --shadow-deep:    12px 12px 50px rgba(0, 0, 0, 0.4);
  --shadow-sharp:   6px 6px 0px rgba(0, 0, 0, 0.2);
  --shadow-crisp:   6px 6px 0px rgba(0, 0, 0, 1);
}
```

| Token | Use Case |
|---|---|
| `--shadow-natural` | Cards, modals, soft elevation |
| `--shadow-deep` | Hero images, featured content |
| `--shadow-sharp` | Retro/bold accents |
| `--shadow-crisp` | High-contrast graphic elements |

---

## 5. Border Radius

```css
:root {
  --radius-none: 0px;
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   16px;
  --radius-pill: 9999px;  /* Used for all buttons */
}
```

---

## 6. Components

### Button — Primary (Blue CTA)

```css
.btn-primary {
  display:          inline-flex;
  align-items:      center;
  background-color: var(--color-blue);          /* #106EEA */
  color:            var(--color-white);
  border-radius:    var(--radius-pill);
  padding:          calc(.667em + 2px) calc(1.333em + 2px);
  font-size:        var(--font-size-btn);
  font-weight:      600;
  text-decoration:  none;
  border:           none;
  cursor:           pointer;
  transition:       background-color 0.2s ease, transform 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--color-blue-hover);    /* #1E83D0 */
  transform: translateY(-1px);
}
```

### Button — Dark

```css
.btn-dark {
  background-color: var(--color-primary);       /* #121213 */
  color:            var(--color-white);
  border-radius:    var(--radius-pill);
  padding:          calc(.667em + 2px) calc(1.333em + 2px);
  font-size:        var(--font-size-btn);
  font-weight:      600;
  border:           none;
  cursor:           pointer;
}

.btn-dark:hover { background-color: var(--color-charcoal); }
```

### Button — Outline

```css
.btn-outline {
  background-color: transparent;
  color:            var(--color-blue);
  border:           2px solid var(--color-blue);
  border-radius:    var(--radius-pill);
  padding:          calc(.667em + 2px) calc(1.333em + 2px);
  font-size:        var(--font-size-btn);
  font-weight:      600;
  cursor:           pointer;
  transition:       all 0.2s ease;
}

.btn-outline:hover {
  background-color: var(--color-blue);
  color:            var(--color-white);
}
```

### Pullquote / Testimonial

```css
.pullquote {
  font-size:    var(--font-size-quote);
  line-height:  var(--line-height-quote);
  font-style:   italic;
  color:        var(--color-primary);
  border-left:  4px solid var(--color-blue);
  padding-left: var(--space-lg);
  margin:       var(--space-xl) 0;
}
```

### Card

```css
.card {
  background:    var(--color-white);
  border-radius: var(--radius-md);
  padding:       var(--space-xl);
  box-shadow:    var(--shadow-natural);
}
```

---

## 7. Layout

### Breakpoints

```css
/* Note: CSS custom properties cannot be used inside @media queries.
   These are reference values only — use the raw px values in media queries. */
--bp-sm:  640px;
--bp-md:  768px;
--bp-lg:  1024px;
--bp-xl:  1280px;
--bp-2xl: 1536px;
```

### Gap Scale

```css
:root {
  --gap-tight:  0.5em;
  --gap-md:     1.25em;
  --gap-column: 2em;
}
```

### Aspect Ratios

```css
:root {
  --ratio-square: 1 / 1;
  --ratio-video:  16 / 9;
  --ratio-photo:  3 / 2;
}
```

### Container

```css
.container {
  width:     100%;
  max-width: 1200px;
  margin:    0 auto;
  padding:   0 var(--space-lg);
}
```

---

## 8. Gradients

```css
:root {
  --gradient-brand:   linear-gradient(135deg, #106EEA 0%, #0073AA 100%);
  --gradient-dark:    linear-gradient(135deg, #121213 0%, #343A40 100%);
  --gradient-steel:   linear-gradient(135deg, #1E83D0 0%, #17A2B8 100%);
}
```

| Token | Direction | Use Case |
|---|---|---|
| `--gradient-brand` | Dodger Blue → Cerulean | Hero overlays, feature banners |
| `--gradient-dark` | Dark Charcoal → Ash Gray | Dark section backgrounds |
| `--gradient-steel` | Azure → Steel Blue | Info banners, secondary sections |

---

## 9. Motion & Animation

```css
:root {
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;
  --ease-default:  ease;
  --ease-in-out:   cubic-bezier(0.4, 0, 0.2, 1);
  --ease-spring:   cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

---

## 10. Accessibility Notes

- Minimum contrast ratio: **4.5:1** for normal text, **3:1** for large text (WCAG AA)
- `#121213` on `#FFFFFF`: ~**21:1** ✓ Excellent
- `#106EEA` on `#FFFFFF`: ~**3.5:1** — use only for large text/UI elements, not body copy
- `#0073AA` on `#FFFFFF`: ~**5.9:1** ✓ Passes AA for all text sizes
- `#495057` on `#FFFFFF`: ~**5.6:1** ✓ Safe for body text (`--color-text-muted`)
- `#555555` on `#FFFFFF`: ~**7.4:1** ✓ Safe (`--color-text-subtle`)
- `#777777` on `#FFFFFF`: ~**4.5:1** ✓ Borderline AA — avoid for small text below 16px
- `#CED4DA` on `#FFFFFF`: ~**1.6:1** ✗ **Borders/decorative only — never use as text**
- All interactive elements must have visible `:focus-visible` styles
- Motion must respect `@media (prefers-reduced-motion: reduce)`
- Interactive `div` elements require `tabindex="0"` and `role` attributes

---

## 11. Design Principles

| Principle | Application |
|---|---|
| **Trust first** | Near-black `#121213` primary, clean white space, no gimmicks |
| **Approachable authority** | Blue CTAs signal action; charcoal signals confidence |
| **Clarity over decoration** | System fonts, predictable spacing, minimal shadow use |
| **Action-oriented** | `#106EEA` Dodger Blue for all primary CTAs — never ambiguous |
| **Warm professionalism** | Blue tints (`#F1F6FE`, `#E2EEFD`) soften the dark palette |

---

*Corrected from thrivingdentist.com source — March 2026*
*Previous extraction returned WordPress Gutenberg default palette; this reflects actual brand colors.*
*Use this document as the reference when building new pages, panels, or web elements for this brand.*
