# Panel Flyer Studio — Design System

## Company

**Panel Flyer Studio by Veterinary Business Institute** — internal tool for producing 1080×1080 social-promo banners for expert panel events across four verticals (Veterinary, Dental, Legal, Aesthetics). Each event ships a standard 5-banner set (Intro, Panel One, Panel Two, One More Day, Happening Today) generated from Google Drive folder data via AI extraction, then rendered as HTML/CSS posters that export to PNG.

---

## Format & Grid

- All banners are exactly **1080 × 1080 px** (Instagram/LinkedIn square)
- Two available template systems:
  - **Classic** — bold, high-contrast, marketing-forward
  - **Modern** — editorial, serif-led, asymmetric
- Banners are always rendered as self-contained HTML with inline CSS (must be single-file portable for html-to-image export)

---

## Typography

### Classic set
- `Montserrat` (400, 600, 700, 800, 900) for everything
- Uppercase eyebrows use 0.5–1px letter-spacing
- Headlines use 900 weight

### Modern set
- `Playfair Display` (700, 800, 900) for headlines
- `Inter` (300–900) for body and eyebrows
- Uppercase eyebrows use 4–5px letter-spacing, 600 weight
- Large serif headlines use `-0.5px` to `-1px` negative letter-spacing, `line-height: 1.02–1.08`

---

## Color Theming

Themes are **orthogonal to layout** — 13 color palettes can be applied to either template system. Layout picks the composition; theme picks the palette.

Each theme defines these tokens:

| Token | Purpose |
|---|---|
| `bgGradient` | Full-canvas background (usually radial or linear gradient) |
| `accent` | Primary accent color (circular ring borders, small decorative elements) |
| `lime` | High-contrast secondary accent (eyebrows, small divider strips, highlight text) |
| `headerBg` | Background for header bar (Classic) or CTA ribbon (Modern) |
| `headerTextColor` | Text color inside header bar |
| `darkBg` | Dark neutral used for QR borders, buttons on light CTAs |
| `neonBorder` | Soft halo ring around circular portraits |
| `subtitleColor` | Body subtitle text color on dark backgrounds |
| `subtitleColorLight` | Body subtitle text color on light backgrounds (B3 only) |
| `b3TextColor` | Main text color for the light-bg B3 banner |
| `ctaBg` | Register-button background |
| `ctaText` | Register-button text |
| `accentGradient` | Linear gradient used in Classic B1's subtitle pill |
| `gridLineColor` | Faint grid lines behind the Classic background |

### Default Veterinary theme (reference)
```ts
{
  bgGradient: 'radial-gradient(ellipse at 68% 42%, #0a4a44 0%, #0d3530 22%, #0b2820 48%, #071510 78%, #050e0a 100%)',
  accent: '#00b09b',        // teal
  lime: '#DDE821',          // signature lime-yellow
  headerBg: '#DDE821',
  headerTextColor: '#000000',
  darkBg: '#050e0a',
  neonBorder: '#C6F800',
  subtitleColor: '#c8f0a0',
  b3TextColor: '#0a4a44',
}
```

### Shared palette characteristics
All themes share the same visual DNA:
- Dark/saturated background gradient (never flat)
- One bright accent (often a yellow-green or white)
- One secondary accent (often a teal/blue)
- High contrast — accent-on-dark always meets WCAG AA (lime `#DDE821` on dark teal `#0a4a44` ≈ 11:1 contrast ratio)

---

## Component Vocabulary

### Circular portrait
Used for every panelist photo in every banner.
```css
width: {size}px; height: {size}px;
border-radius: 50%;
border: 5px solid {accent};
overflow: hidden;
background: url('{headshotUrl}') center 15%/cover no-repeat;
box-shadow: 0 0 0 2px {neonBorder}60, 0 10px 30px rgba(0,0,0,0.35);
```
**Why `center 15%`** — headshots crop better 15% from the top; faces stay centered after the circular mask.

### Eyebrow label
Small uppercase sans-serif, 4–5px letter-spacing, 12–14px, accent color. Goes above headlines and in the top-right of the canvas.
```css
font-family: Inter;
font-weight: 600;
letter-spacing: 4px;
text-transform: uppercase;
font-size: 14px;
color: {lime};
```

### Divider strip
3px tall × 56px wide, accent color — used between eyebrow and headline.
```html
<div style="width:56px;height:3px;background:{lime};margin:16px auto 22px;"></div>
```

### Accent top strip
6px tall accent bar along the full top of every Modern banner.
```css
position: absolute; top: 0; left: 0; right: 0;
height: 6px; background: {lime};
```

### CTA ribbon (Modern)
Full-width bar at bottom, 180px tall, flex layout:
```
[QR 144×144] [eyebrow "Register Now" + serif date + time/url] [REGISTER solid button]
```
Uses `theme.headerBg` as ribbon background, `theme.darkBg` as text color inside the ribbon.

### CTA block (Classic)
Centered column inside a ~140px footer strip:
- Pill-shaped REGISTER NOW button (40px border-radius, 2px accent border)
- Date line with 📅 emoji
- Time line with 🕐 emoji (in `lime` color)
- Optional website URL in 45% white

### Register button
- **Classic**: pill — `border-radius: 40px`, `padding: 12px 48px`, `font-weight: 900`
- **Modern**: solid rectangle — no border-radius, `padding: 18px 36px`, `font-weight: 800`, uppercase, 3px letter-spacing

### QR code
120 × 120px, white background, 3px solid border in `darkBg`, always bottom-left of CTA. When missing, renders as a dashed outline placeholder with a small grid icon.

---

## Layout Patterns (per banner type)

### B1 "The Intro" (per-panelist)
Asymmetric split:
- Left column (60px from edge, 480–540px wide): accent divider → panelName eyebrow → serif topic headline → "FEATURING" divider → panelist name/title/org
- Right column (70–80px from right edge): circular portrait 400–420px diameter with soft radial accent halo

### B2 "Introduction to Panel One"
Centered title up top, row of circular portraits below.
- Top-right: `headerText` eyebrow
- Center: panelName eyebrow + divider + serif topic headline
- Bottom: flex row of panelist cards (photo + name + title + org), sizes scale down by panelist count (see table below)
- Bottom: full CTA ribbon

### B3 "Introduction to Panel Two"
Identical structure to B2 but on **white background** with a dark header band (140px tall) at the top.
- Only banner with light-bg — uses `b3TextColor` for headline
- Panelist titles use `subtitleColorLight` for readability

### B4 "One More Day" (per-panelist)
Countdown layout:
- Left column: "DON'T MISS IT" eyebrow → giant countdown text → panelist block
  - Classic: "1 MORE DAY TO GO" in bold sans
  - Modern: "ONE / MORE / DAY" stacked in 110px serif, middle word in lime
- Right column: circular portrait 400px with accent halo
- Bottom: CTA ribbon

### B5 "Happening Today" (all panelists)
Urgency + panel row:
- Red `#ff3333` pill top-right with "HAPPENING TODAY" + pulse dot
- Center: panelName eyebrow + divider + topic headline
- Panelist row (same scaling as B2/B3 but photos sized smaller to guarantee fit above CTA)
- Bottom: CTA ribbon

---

## Panelist Count Scaling (both template sets)

Photos and text scale down as panelist count grows, preserving the row layout without wrapping.

| Count | Photo | Name | Title | Gap | Max col width |
|-------|-------|------|-------|-----|--------------|
| 2     | 260–340px | 24–32 | 16–20 | 80px | 380–420px |
| 3     | 220–260px | 22–26 | 15–18 | 40–48px | 280–290px |
| 4     | 185–200px | 19–22 | 14–16 | 28–32px | 220–230px |
| 5     | 155–165px | 17–19 | 13–14 | 20–22px | 180–190px |
| 6     | 130–140px | 15–17 | 11–12 | 16–18px | 145–160px |

B5 uses slightly smaller photos than B2/B3 to leave room for the CTA ribbon.

---

## Content Rules

### Field semantics (from upstream AI extraction)
- `headerText` → top-right eyebrow on every banner (series name, e.g. "Veterinary Business Institute Expert Panel")
- `panelName` → body eyebrow above the headline (e.g. "Veterinary Client Experience Panel") — formal panel series name, never a marketing headline
- `panelTopic` + `panelSubtitle` → concatenated as `"Topic: Subtitle"` for the main serif headline
- `panelistName`, `panelistTitle`, `panelistOrg` → featured panelist block (B1, B4)
- `allPanelists[]` → row of cards (B2, B3, B5)

### Text cleaning
- Titles are cleaned of credential suffixes (`DVM`, `DDS`, `DMD`, `MD`, `JD`, `PhD`, `MBA`, `CPA`, `DACVIM`, `DACVS`, `CVT`, `RVT`, `BVSc`, `MRCVS`, etc.) via regex before rendering
- Names preserve credentials exactly as written in source docs
- Dates always spelled out: **"Wednesday, June 24th, 2026"** (Title Case + ordinal day)
- Times formatted as `"8:00 PM EST"` or `"8:00 PM – 9:00 PM EST"`

### Dedup logic
When `panelName` and `panelTopic` are identical (common in promotional doc extractions), `panelTopic` is shifted from `panelSubtitle` if available, otherwise cleared to avoid echo.

---

## Brand Voice

- **Clinical / authoritative / credential-forward** — these are professional panels for practice owners and decision-makers
- Never cute, never playful, never emoji-heavy
- Urgency words limited to a short approved list: `"HAPPENING TODAY"`, `"ONE MORE DAY"`, `"TOMORROW"`, `"DON'T MISS IT"`
- Panel topics read as thematic statements (`"Leading Through Change"`, `"Cost-Based Anger in Veterinary Clients"`), never imperative advice (`"Fix X"`, `"Stop Y"`) — those are per-speaker session titles, not panel topics

---

## Accessibility / Contrast

- All accent-on-dark text meets **WCAG AA** (lime `#DDE821` on dark teal `#0a4a44` ≈ 11:1)
- White headline text always placed on gradient regions ≥ 70% darkness
- B3 is the only light-bg banner — text uses `b3TextColor` (usually the theme's `darkBg`) for contrast
- Minimum body text size: 15px
- Minimum title text size: 32px for panelist names on cards

---

## Files to reference in this repo

Point at these files for the full source of truth:

| File | Role |
|------|------|
| `src/utils/bannerTemplates.ts` | Classic B1–B5 layout generators + `BANNER_THEMES` color token definitions + all shared helpers (`formatDateTitleCase`, `cleanTitle`, `getPanelistVariant`, etc.) |
| `src/utils/bannerTemplateSets.ts` | Modern B1–B5 generators + pluggable template-set architecture + `BANNER_TEMPLATE_SETS` registry |
| `src/components/flyer/TemplateSetPicker.tsx` | Picker UI pattern: visual card grid with radio-group semantics, accent ring on selected |
| `src/utils/verticalConfig.ts` | Vertical-to-theme mapping (Vet, Dental, Legal, Aesthetics) |
| `src/components/FlyerApp.tsx` | Main app wiring — how data flows from form/Drive → `BannerData` → generators → iframe previews |

For a frontend-focused subfolder upload, send: `src/utils/` + `src/components/flyer/` — that's the visual core without the Drive integration and AI extraction plumbing.

---

## Example: Minimal Modern B1 structure

```html
<div class="poster" style="width:1080px;height:1080px;position:relative;
  background:{bgGradient};font-family:Inter,sans-serif;">

  <!-- accent top strip -->
  <div style="position:absolute;top:0;left:0;right:0;height:6px;background:{lime}"></div>

  <!-- logo top-left, eyebrow top-right -->
  <div style="position:absolute;top:40px;left:60px;">{logoSVG}</div>
  <div style="position:absolute;top:54px;right:60px;" class="eyebrow">
    <span style="color:{lime}">{headerText}</span>
  </div>

  <!-- LEFT: editorial headline -->
  <div style="position:absolute;left:60px;top:170px;width:480px;">
    <div style="width:56px;height:3px;background:{lime};margin-bottom:20px"></div>
    <div class="eyebrow" style="color:{lime};font-size:13px;margin-bottom:14px">
      {panelName}
    </div>
    <div class="serif" style="font-size:64px;font-weight:700;color:#fff;
      line-height:1.04;letter-spacing:-0.8px">
      {panelTopic}
    </div>
    <div style="margin-top:28px;padding-top:18px;border-top:1px solid {lime}40">
      <div class="eyebrow" style="color:{lime};font-size:12px">Featuring</div>
      <div style="font-size:34px;font-weight:800;color:#fff">{panelistName}</div>
      <div style="font-size:18px;color:{lime}">{panelistTitle}</div>
      <div style="font-size:15px;color:rgba(255,255,255,0.75)">{panelistOrg}</div>
    </div>
  </div>

  <!-- RIGHT: circular portrait -->
  <div style="position:absolute;right:70px;top:240px">
    <div style="position:absolute;inset:-30px;border-radius:50%;
      background:radial-gradient(circle,{accent}55 0%,transparent 70%);z-index:-1"></div>
    <div style="width:400px;height:400px;border-radius:50%;
      border:5px solid {accent};overflow:hidden;
      background:url('{headshotUrl}') center 15%/cover no-repeat;
      box-shadow:0 0 0 2px {neonBorder}60,0 10px 30px rgba(0,0,0,0.35)"></div>
  </div>

  <!-- CTA ribbon bottom -->
  <div style="position:absolute;left:0;right:0;bottom:0;height:180px;
    background:{headerBg};display:flex;align-items:center;padding:0 60px;gap:28px">
    <div><!-- QR 120×120 --></div>
    <div style="flex:1;display:flex;justify-content:space-between;align-items:center">
      <div>
        <div class="eyebrow" style="color:{darkBg};opacity:0.7">Register Now</div>
        <div class="serif" style="font-size:36px;font-weight:700;color:{darkBg}">
          {formattedDate}
        </div>
        <div style="font-size:20px;color:{darkBg}">{formattedTime} · {websiteUrl}</div>
      </div>
      <div style="background:{darkBg};color:{lime};padding:18px 36px;
        font-weight:800;letter-spacing:3px;text-transform:uppercase">Register</div>
    </div>
  </div>
</div>
```
