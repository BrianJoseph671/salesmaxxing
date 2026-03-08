# SalesMAXXing Agent

> **[ARCHIVED]** This project is no longer actively maintained. The hosted instance at `salesmaxxing.vercel.app` is offline (API keys removed). The codebase is fully functional — fork it and add your own API keys to run it.

AI-powered lead qualification from your LinkedIn network. A Chrome extension + Next.js web app that analyzes your connections with Claude and surfaces the best leads with justification and one-click InMail drafts.

---

## What It Does

SalesMAXXing is a Chrome extension that lives alongside LinkedIn. After sign-in, it qualifies leads from your own network, ranks the best fits, explains why they match, and drafts personalized outreach.

**Qualification modes:**
- **Automatic** — AI infers your ICP from your profile and ranks the strongest matches
- **Custom** — you define keywords, target companies, industries, and ICP notes

**End-to-end flow:**
1. Click extension icon, sign in with LinkedIn
2. Extension extracts your profile + connections from LinkedIn DOM
3. Claude analyzes your network and ranks the top 5-10 leads
4. Each lead card shows score, justification, key signals, and talking points
5. Click "Draft InMail" for a personalized message with tone selection
6. Copy to clipboard, paste into LinkedIn

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5.9 |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Package Manager | Bun |
| Auth | Supabase + LinkedIn OIDC |
| Database | Supabase PostgreSQL (with RLS) |
| AI | Vercel AI SDK + Claude (Sonnet 4) |
| Hosting | Vercel |
| Extension | Chrome Manifest V3 |

---

## Architecture

```
Chrome Extension (Manifest V3)
├── Popup (entry point)
│   ├── Not logged in → Opens web app auth flow
│   └── Logged in → Opens side panel
├── Content Script (linkedin.com/*)
│   ├── Extracts user's own profile data
│   ├── Scrolls connections page + captures cards
│   ├── MutationObserver for Ember.js SPA navigation
│   └── Resilient selectors (data-*, aria-label, ArtDeco classes)
├── Side Panel (React + Tailwind)
│   ├── Onboarding: Automatic vs Custom qualification
│   ├── Lead cards with expandable justification
│   ├── InMail draft generator per lead
│   └── Loading states, error boundaries, skeletons
└── Background Service Worker
    ├── Message routing (content script ↔ side panel)
    ├── Auth token management (chrome.storage)
    └── Data caching + extraction coordination

Next.js Web App (Vercel)
├── /                          Landing page
├── /sign-in                   Sign-in page
├── /auth/callback             Supabase LinkedIn OIDC callback
├── /extension-auth            Extension-specific auth flow
├── /privacy                   Privacy policy
├── /api/auth/status           Auth state check (CORS-enabled for extension)
├── /api/auth/extension-session Session exchange for extension
├── /api/qualify               Lead qualification (Claude, structured output, streaming)
├── /api/generate-intro        InMail draft generation (Claude, streaming text)
├── /api/leads                 Lead CRUD (GET sorted by score, POST batch, PATCH status)
├── /api/intros                Intro persistence
└── Supabase
    ├── user_profiles          Rep metadata + LinkedIn data
    ├── leads                  Qualified leads + scores + justification
    ├── intros                 Generated InMail drafts
    └── qualification_configs  Custom criteria (keywords, URLs, ICP, industries)
```

---

## Project Structure

```
salesmaxxing/
├── src/
│   ├── app/                   Next.js pages + API routes
│   │   ├── api/               All backend endpoints
│   │   ├── auth/              OAuth callback + sign-in/out
│   │   ├── dashboard/         User dashboard
│   │   ├── extension-auth/    Extension auth flow
│   │   ├── overview/          Landing page sections
│   │   ├── privacy/           Privacy policy
│   │   ├── sign-in/           Sign-in page
│   │   ├── layout.tsx         Root layout
│   │   └── page.tsx           Landing page
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── prompts.ts     System prompts for qualification + InMail
│   │   │   ├── provider.ts    AI model config (gateway or direct Anthropic)
│   │   │   └── schemas.ts     Zod schemas for requests/responses
│   │   ├── http/
│   │   │   └── cors.ts        Extension CORS helpers
│   │   ├── supabase/
│   │   │   ├── auth.ts        Dual auth (Bearer token + cookie)
│   │   │   └── user-profiles.ts
│   │   └── env.ts             Environment variable helpers
│   └── proxy.ts               Supabase proxy utilities
├── extension/
│   ├── src/
│   │   ├── background.ts      Service worker
│   │   ├── content.ts         LinkedIn content script
│   │   ├── popup.tsx          Popup entry point
│   │   ├── sidepanel.tsx      Side panel root
│   │   ├── lib/
│   │   │   ├── app-auth.ts    Extension ↔ web app auth sync
│   │   │   ├── extract-connections.ts  Human-speed connections scraping
│   │   │   ├── extract-profile.ts      Profile data extraction
│   │   │   ├── navigation.ts  SPA navigation detection
│   │   │   ├── selectors.ts   LinkedIn DOM selectors
│   │   │   ├── storage.ts     chrome.storage wrapper
│   │   │   └── types.ts       Extension types
│   │   └── sidepanel/
│   │       ├── App.tsx         Main side panel app
│   │       ├── hooks.ts       useAuth, useQualification, useLeads, etc.
│   │       └── components/    All UI components
│   ├── manifest.json          Manifest V3 config
│   ├── popup.html
│   ├── sidepanel.html
│   ├── icons/                 Extension icons (16, 32, 48, 128px)
│   └── dist/                  Built extension (gitignored)
├── supabase/
│   └── migrations/            4 SQL migrations (tables, RLS, indexes)
├── scripts/
│   ├── build-extension.ts     Bun bundler → extension/dist/
│   ├── generate-icons.ts      Icon generation
│   └── package-extension.ts   ZIP packaging
├── public/
│   ├── downloads/             Extension ZIP for distribution
│   └── logo.png
├── .env.example               Environment variable template
├── biome.json                 Linting config
├── next.config.ts             CSP headers, security config
├── tsconfig.json              TypeScript config
├── todo.md                    Implementation checklist (all complete)
└── CLAUDE.md                  AI assistant instructions
```

---

## Setup Guide

### Prerequisites

- [Bun](https://bun.sh/) (package manager + runtime)
- [Supabase](https://supabase.com/) account (free tier works)
- [Vercel](https://vercel.com/) account (for deployment)
- [Anthropic API key](https://console.anthropic.com/) or [Vercel AI Gateway](https://vercel.com/docs/ai-gateway) key
- LinkedIn app registered in [Supabase Auth providers](https://supabase.com/docs/guides/auth/social-login/auth-linkedin-oidc)

### 1. Clone and Install

```bash
git clone https://github.com/8Lee/salesmaxxing.git
cd salesmaxxing
bun install
```

### 2. Set Up Supabase

1. Create a new Supabase project
2. Enable LinkedIn OIDC provider in Authentication > Providers
3. Run the database migrations in order:

```sql
-- Run these in Supabase SQL Editor, in order:
-- supabase/migrations/20260307233000_create_user_profiles.sql
-- supabase/migrations/20260308000000_create_leads_and_configs.sql
-- supabase/migrations/20260308100000_create_intros.sql
-- supabase/migrations/20260308113000_harden_public_data_integrity.sql
```

These create 4 tables (`user_profiles`, `leads`, `qualification_configs`, `intros`) with full RLS policies, indexes, and composite foreign keys.

### 3. Configure Environment

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

```env
# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key

# App (required)
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Extension (required for CORS)
ALLOWED_EXTENSION_ORIGINS=chrome-extension://your-extension-id

# AI — pick one (required for qualification + InMail)
AI_GATEWAY_API_KEY=your-vercel-ai-gateway-key      # Preferred: Vercel AI Gateway
ANTHROPIC_API_KEY=your-anthropic-api-key            # Fallback: direct Anthropic

# AI — optional overrides
AI_GATEWAY_BASE_URL=https://ai-gateway.vercel.sh/v1  # Default gateway URL
AI_QUALIFY_MODEL=anthropic/claude-sonnet-4-20250514   # Qualification model
AI_INTRO_MODEL=anthropic/claude-sonnet-4-20250514     # InMail generation model
```

### 4. Run the Web App

```bash
bun run dev          # Next.js dev server with Turbopack
```

### 5. Build and Load the Extension

```bash
bun run ext:build    # Build extension → extension/dist/
```

1. Open `chrome://extensions`
2. Enable Developer Mode
3. Click "Load unpacked"
4. Select the `extension/dist/` folder

For development with auto-rebuild:

```bash
bun run ext:dev      # Watch mode
```

After loading, note your extension ID from `chrome://extensions` and set it in `ALLOWED_EXTENSION_ORIGINS`.

### 6. Deploy to Vercel

```bash
vercel                     # Deploy to preview
vercel --prod              # Deploy to production
```

Set all environment variables in the Vercel dashboard (Settings > Environment Variables). The same variables from `.env.local` are needed.

---

## Development Commands

```bash
bun run dev              # Next.js dev server (Turbopack)
bun run ext:build        # Build Chrome extension → extension/dist/
bun run ext:dev          # Build extension in watch mode
bun run ext:zip          # Package extension to public/downloads/*.zip

bun run lint             # Biome check + auto-fix
bun run check            # Lint + typecheck + build + extension build
bun run build            # Next.js production build (includes ext:zip)
bun run format           # Biome format

bun run deploy:prod      # Vercel production deploy
```

---

## Key Implementation Details

### Dual Auth (Web App + Extension)

API routes use `getUserFromRequest(request)` which checks Bearer token first (Chrome extension sends `Authorization: Bearer {token}`), then falls back to cookie-based auth (web app). This is in `src/lib/supabase/auth.ts`.

### Extension Auth Flow

1. Extension popup detects no session in `chrome.storage`
2. Opens web app auth flow (LinkedIn OIDC via Supabase)
3. After auth, session is passed to extension via `chrome.runtime.sendMessage`
4. Extension stores session in `chrome.storage.local` under `authSession` key
5. All API calls include `Authorization: Bearer {accessToken}` header

### LinkedIn DOM Extraction

- LinkedIn uses Ember.js — dynamic `ember####` IDs are unreliable
- Selectors use `data-*` attributes, `aria-label`, and ArtDeco class prefixes (`pv-`, `pvs-`, `artdeco-`)
- MutationObserver detects SPA navigation (no full page reloads)
- Connections page uses virtual scrolling — only ~40 items in DOM at a time
- Human-speed scrolling with randomized 1-3s delays between batches

### AI Integration

- **Qualification** (`/api/qualify`): Claude Sonnet 4, temperature 0.3, structured output via Zod schema. Returns scored leads with justification, key signals, and talking points.
- **InMail Generation** (`/api/generate-intro`): Claude Sonnet 4, temperature 0.7, streaming text. Generates personalized messages with tone selection (professional / casual / mutual connection).
- **Provider**: Vercel AI Gateway preferred (unified billing, observability). Falls back to direct `@ai-sdk/anthropic`.

### CORS for Extension

All API routes need `OPTIONS` handler with `createExtensionPreflightResponse()` and wrap responses with `applyExtensionCors()` from `src/lib/http/cors.ts`.

### Fire-and-Forget Persistence

Save to `chrome.storage` first (instant, reliable), then sync to Supabase in background (resilient to network failures). Used for leads, intros, and profile data.

---

## Database Schema

4 tables, all with Row Level Security (users only access their own data):

| Table | Purpose |
|---|---|
| `user_profiles` | User metadata from LinkedIn OIDC (name, avatar, LinkedIn data) |
| `qualification_configs` | Custom criteria: keywords, company URLs, ICP notes, industries |
| `leads` | Qualified leads: profile data, score (0-100), justification, status |
| `intros` | Generated InMail drafts: subject, body, tone, version |

Migrations are in `supabase/migrations/` and should be run in order.

---

## Security

- **No secrets in codebase** — all API keys via environment variables
- **CSP headers** — strict Content Security Policy in `next.config.ts`
- **HSTS** — 2-year HTTPS enforcement with preload
- **RLS** — all Supabase tables gated by `auth.uid() = auth_user_id`
- **Manifest V3** — latest Chrome extension security standard
- **`use_dynamic_url: true`** — prevents LinkedIn extension fingerprinting
- **No inline scripts** — XSS protection
- **X-Frame-Options: DENY** — clickjacking protection

---

## Completion Status

All 8 milestones complete. Full checklist in `todo.md`.

| Milestone | Description |
|---|---|
| 1 | Project scaffold (Next.js + extension build pipeline) |
| 2 | Authentication (LinkedIn OIDC, extension ↔ web app session sync) |
| 3 | LinkedIn data extraction (profile, connections, SPA navigation) |
| 4 | AI qualification engine (Claude, structured output, streaming) |
| 5 | Side panel UI (onboarding, lead cards, loading states) |
| 6 | InMail draft generation (tone selection, streaming, copy-to-clipboard) |
| 7 | Database + persistence (Supabase tables, RLS, CRUD endpoints) |
| 8 | Polish (icons, animations, error boundaries, landing page, privacy policy) |

Not completed (manual testing / launch tasks):
- End-to-end testing with live LinkedIn data
- Chrome Web Store submission

---

## License

MIT
