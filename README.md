# Panel Flyer Studio

Create professional promotional banners for panel events across multiple verticals.

## Quick Start (for team members)

1. **Visit the app** → [your-deployed-url.vercel.app]
2. **Click the ⚙️ gear icon** (top-right) → Enter your Claude API key
   - Get one at [console.anthropic.com](https://console.anthropic.com)
   - This is optional — banners work without AI
3. **Connect Google Drive** → Click "Connect Google Drive" and sign in
4. **Select your vertical** → VET / Dental / Law / Aesthetics
5. **Select panelist count** → 2 / 3 / 4
6. **Paste your Drive event folder URL** → Click "Import & Generate"
7. **Download banners** → Click individual downloads or "Download All"

## Features

- 🐾 **4 Verticals** — VET, Dental, Law, Aesthetics (each with unique branding)
- 📁 **Google Drive Import** — Paste a folder URL, auto-detect panelists & event details
- 🎨 **5 Banner Types** — Intro, Panel 1, Panel 2, One More Day, Happening Today
- 🤖 **AI Enhance** (optional) — Claude suggests better topic wording
- 📥 **1080×1080 PNG Export** — Download individual or all banners
- 👥 **Multi-user** — Each team member uses their own Google & Claude accounts

## Local Development

```bash
npm install
npm run dev
```

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo to Vercel for auto-deployments.

**After deploying**, add your Vercel URL to:
- Google Cloud Console → OAuth consent screen → Authorized domains
- Google Cloud Console → Credentials → OAuth Client → Authorized JavaScript origins
- Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs

## Tech Stack

- React + TypeScript + Vite
- TailwindCSS
- html2canvas (PNG export)
- Google Drive & Docs API (OAuth)
- Claude API (optional, via Vercel serverless proxy)
