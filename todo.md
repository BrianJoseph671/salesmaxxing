# SalesMAXXing Agent

## Problem

Sales reps struggle to close obvious opportunities.

## Solution

Any rep can qualify with confidence using the SalesMAXXing Agent.

---

## Product: Chrome Extension + Web App

A Chrome extension that lives alongside LinkedIn. Click the extension icon, sign in
once with LinkedIn, and immediately get AI-qualified leads from your own network —
ranked by fit, with context on why they match, and a one-click InMail draft.

Two qualification modes:
- **Automatic**: AI reviews your profile + job to surface the 5-10 best leads
- **Custom**: You provide keywords, URLs, and criteria for targeted qualification

---

## Competitive Context

**Apollo.io** (primary reference) — Chrome extension with LinkedIn side panel overlay.
Shows enriched contact info, company data, email/phone lookup, "Add to Sequence"
workflows. Relies on their own 265M+ contact database for enrichment.

**Our differentiation:**
- AI-first: Claude does the qualification reasoning, not just data enrichment
- Automated qualification: Apollo makes you search. We surface leads proactively
- Beautiful, opinionated UI: Not a data dump. A curated, justified recommendation
- Lightweight: No massive backend database. Uses the rep's own network + AI judgment

---

## Stack (Shared with yenchat/deathnote)

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Package Manager | Bun |
| Auth | Supabase LinkedIn OIDC (pattern from deathnote) |
| Database | Supabase (Postgres) |
| AI | Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) → Claude |
| Hosting | Vercel |
| Extension | Chrome Manifest V3 |

---

## Architecture

```
Chrome Extension (Manifest V3)
├── Popup (entry point)
│   ├── Not logged in → Opens web app auth flow
│   └── Logged in → Shows onboarding or leads view
├── Content Script (linkedin.com/*)
│   ├── Extracts user's own profile data (first run)
│   ├── Reads connections page (scrolls + captures)
│   ├── Extracts lead profile data on profile pages
│   └── MutationObserver for Ember.js SPA navigation
├── Side Panel (React + Tailwind)
│   ├── Onboarding: Automatic vs Custom qualification
│   ├── Lead cards (5-10) with expandable context/justification
│   ├── InMail draft generator per lead
│   └── Settings / re-qualification trigger
└── Background Service Worker
    ├── Coordinates content script ↔ side panel messaging
    ├── Manages auth token from Supabase session
    └── Caches extracted data in chrome.storage

Next.js Web App (Vercel)
├── / — Landing page
├── /auth/callback — Supabase LinkedIn OIDC callback
├── /api/qualify — Vercel AI SDK → Claude (lead qualification + ranking)
├── /api/generate-intro — Vercel AI SDK → Claude (InMail draft)
├── /api/leads — CRUD for qualified leads
└── Supabase
    ├── auth.users — LinkedIn OIDC identity
    ├── user_profiles — Rep meta, job context, selling points
    ├── leads — Qualified lead profiles + scores
    ├── intros — Generated InMail drafts
    └── qualification_configs — Custom keyword/URL criteria
```

---

## MVP User Flow

### Step 1: Click Extension Icon

```
┌─────────────────────────┐
│   SalesMAXXing Agent    │
│                         │
│   [Sign in with         │
│    LinkedIn]            │
│                         │
│   Qualify leads from    │
│   your network with AI  │
└─────────────────────────┘
```

If not authenticated → opens web app in new tab → LinkedIn OIDC via Supabase →
callback → session stored → extension detects auth → shows onboarding.

### Step 2: Onboarding (first time only)

Extension content script silently extracts the user's own LinkedIn profile data
(navigates to their profile if needed, reads DOM). This becomes the AI context
for what the rep is selling.

Then the user chooses:

```
┌──────────────────────────────────────────┐
│  How should we find your best leads?     │
│                                          │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │  Automatic   │  │  Custom          │  │
│  │              │  │                  │  │
│  │  AI reviews  │  │  You provide     │  │
│  │  your profile│  │  keywords, URLs, │  │
│  │  and finds   │  │  and criteria    │  │
│  │  the best    │  │  to filter by    │  │
│  │  matches     │  │                  │  │
│  └──────────────┘  └──────────────────┘  │
└──────────────────────────────────────────┘
```

### Step 3a: Automatic Qualification

1. Content script navigates to user's connections page
2. Scrolls through connections, extracting profile cards (name, headline, company)
3. Batches connections → sends to `/api/qualify` with user's profile context
4. Claude analyzes: "Given this rep sells X at Y company, which connections are
   the highest-value leads and why?"
5. Returns top 5-10 ranked leads with justification

### Step 3b: Custom Qualification

User inputs:
- Target keywords (e.g., "VP Engineering", "Series B", "fintech")
- Target company URLs or names
- Ideal customer profile notes (free text)
- Industry filters

Same flow as automatic, but Claude uses the custom criteria as the primary filter
instead of inferring from the user's profile.

### Step 4: Lead Results View

```
┌─────────────────────────────────────────────┐
│  Your Top Leads                    Refresh  │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 1. Sarah Chen                       │    │
│  │    VP Engineering @ Stripe     [98] │    │
│  │    ▸ Why: Mutual connection via...  │    │
│  │    ▸ 2nd degree · SF Bay Area       │    │
│  │    [Draft InMail]  [View Profile]   │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 2. Marcus Johnson              [94] │    │
│  │    Director of Sales @ Datadog      │    │
│  │    ▸ Why: His team just expanded... │    │
│  │    ▸ 1st degree · NYC               │    │
│  │    [Draft InMail]  [View Profile]   │    │
│  └─────────────────────────────────────┘    │
│  ...                                        │
└─────────────────────────────────────────────┘
```

Each lead card expands to show:
- Full qualification reasoning from Claude
- Key profile highlights (experience, mutual connections, shared interests)
- Compatibility score with explanation
- Recent activity signals (if visible)

### Step 5: Draft InMail

Click "Draft InMail" on any lead card → Claude generates a personalized message
using both profiles as context → user can edit → one-click copy to clipboard →
paste into LinkedIn's message composer.

---

## Technical Feasibility: LinkedIn + Chrome Extension

### How Apollo/Lusha Do It (Proven Pattern)

1. Content script injected on `linkedin.com/*` via manifest matches
2. MutationObserver detects page renders (LinkedIn uses Ember.js SPA)
3. DOM parsing extracts profile data using CSS selectors (`pv-top-card`, `pvs-list__*`)
4. Data sent to their backend for enrichment
5. UI injected as side panel or overlay

### LinkedIn DOM Data Available

| Page | Data Extractable |
|---|---|
| Profile (`/in/*`) | Name, headline, location, about, experience, education, skills, connection degree |
| Connections (`/mynetwork/invite-connect/connections/`) | Name, headline, profile URL (capped at 1,000 via UI) |
| Search results (`/search/results/people/`) | Name, title, company, location, degree (limited by commercial search cap) |
| Company pages (`/company/*`) | Company name, industry, size, about |

### LinkedIn DOM Specifics

- **Ember.js framework**: Dynamic `ember####` IDs — never use as selectors
- **ArtDeco design system**: Stable class prefixes: `artdeco-`, `pv-`, `pvs-`
- **JSON-LD**: Some pages include `<script type="application/ld+json">` with structured data
- **Stable selectors**: Prefer `data-*` attributes and `aria-label` over class names
- **Lazy rendering**: Profile sections render on scroll. Must wait for content.
- **SPA navigation**: URL changes don't reload page. Use MutationObserver or History API override.
- **Virtual scrolling**: Connections/search only keep ~40 items in DOM. Capture during scroll.

### Anti-Scraping Measures

| Measure | Impact | Mitigation |
|---|---|---|
| Extension fingerprinting (2,953 extensions probed) | HIGH | `"use_dynamic_url": true` in manifest `web_accessible_resources` |
| Behavioral rate limiting | MEDIUM | Human-speed scroll intervals, randomized delays |
| Commercial search limits (free accounts) | MEDIUM | Focus on connections page, not search |
| DOM class name changes | MEDIUM | Resilient selectors, versioned extraction module, `data-*` attributes |
| Account restriction triggers | LOW-MED | Read-only behavior, no automated actions, respect rate limits |

### Risk Assessment

| Approach | Feasibility | Detection Risk | Notes |
|---|---|---|---|
| Read own profile from DOM | HIGH | LOW | Lowest risk — it's your own page |
| Scroll connections page | HIGH | MEDIUM | 1,000 cap, need human-speed scrolling |
| Read profile pages user visits | HIGH | LOW | Same as what Apollo does |
| LinkedIn People Search via DOM | HIGH | MEDIUM | Commercial search limits apply |
| Voyager API interception | HIGH | HIGH | Not recommended — structured but risky |

### Bottom Line

Fully feasible. Apollo, Lusha, and dozens of others prove the pattern works at scale.
Key mitigations: dynamic URL in manifest, human-speed interactions, read-only behavior.

---

## Tasks

### Setup
- [ ] Initialize Next.js 16 project with Bun, Biome, Tailwind 4
- [ ] Configure Supabase project (reuse existing or new)
- [ ] Set up Vercel project + deployment
- [ ] Create Chrome extension scaffold (Manifest V3)
- [ ] Configure `"use_dynamic_url": true` in manifest web_accessible_resources

### Auth
- [ ] Implement Supabase LinkedIn OIDC sign-in (port from deathnote)
- [ ] OAuth callback route with redirect back to extension
- [ ] Store user profile meta in Supabase on first login
- [ ] Auth state sync between web app and Chrome extension (token in chrome.storage)
- [ ] Extension popup: login state detection + redirect to auth

### Chrome Extension — Content Script
- [ ] LinkedIn profile page detection (URL pattern + MutationObserver)
- [ ] DOM data extraction module (name, headline, company, about, experience, education)
- [ ] Resilient selector system (data-*, aria-label, partial class match)
- [ ] Own-profile extraction (first-run onboarding step)
- [ ] Connections page crawler (scroll + capture, human-speed delays)
- [ ] Message passing to background service worker

### Chrome Extension — Side Panel UI
- [ ] Side panel registration and shell
- [ ] Onboarding flow: Automatic vs Custom qualification choice
- [ ] Custom qualification form (keywords, URLs, ICP notes, industry filters)
- [ ] Lead card component (score badge, expandable justification, profile highlights)
- [ ] Lead list view (5-10 cards, ranked by qualification score)
- [ ] InMail draft view (generated message, edit, copy to clipboard)
- [ ] Loading/qualification-in-progress state (beautiful animation)
- [ ] Empty states and error handling

### Chrome Extension — Background Worker
- [ ] Message routing between content script ↔ side panel
- [ ] Auth token management (read from chrome.storage)
- [ ] Data caching in chrome.storage.local
- [ ] Coordination of multi-page extraction (profile + connections)

### AI — Lead Qualification
- [ ] Vercel AI SDK setup with @ai-sdk/anthropic
- [ ] `/api/qualify` route (auth-gated, rate-limited)
- [ ] System prompt: sales qualification methodology (BANT, MEDDIC, or custom)
- [ ] Automatic mode: user profile → infer what they sell → rank connections
- [ ] Custom mode: user criteria + connections → filtered + ranked results
- [ ] Response schema: lead name, score, justification, key signals, talking points
- [ ] Streaming response for real-time UI updates

### AI — InMail Draft Generation
- [ ] `/api/generate-intro` route (auth-gated)
- [ ] System prompt: personalized outreach best practices
- [ ] Input: rep profile + lead profile + qualification context
- [ ] Output: ready-to-send InMail with personalization hooks
- [ ] Tone/style options (warm intro, cold outreach, mutual connection reference)

### Database (Supabase)
- [ ] `user_profiles` table (rep meta, job context, value prop, LinkedIn data)
- [ ] `qualification_configs` table (custom keywords, URLs, ICP, industry)
- [ ] `leads` table (extracted profile data, score, justification, status)
- [ ] `intros` table (generated InMails, lead FK, version history)
- [ ] RLS policies (users only see their own data)
- [ ] Indexes on leads.user_id, leads.score

### UI/UX Design
- [ ] Design language: dark/premium aesthetic that makes Apollo look dated
- [ ] Side panel: lead card design with score visualization
- [ ] Side panel: expandable justification with smooth animations
- [ ] Side panel: InMail composer with real-time AI streaming
- [ ] Side panel: onboarding screens (auth, mode selection, loading)
- [ ] Micro-interactions: hover states, transitions, loading skeletons
- [ ] Extension popup: minimal, branded entry point

---

## Key Decisions

- **Content script over LinkedIn API**: Richer data, no partner approval needed,
  works immediately. Proven by Apollo, Lusha, and others at scale.
- **Vercel AI SDK + Claude**: Unified interface, Claude subscription via Vercel.
  Pattern proven in deathnote. Use `@ai-sdk/anthropic` directly.
- **Side panel over popup**: Always visible while browsing, persistent state,
  room for rich lead cards. Same pattern Apollo uses.
- **Connections page as primary data source**: Avoids commercial search limits.
  The user's own network is the highest-value lead pool anyway.
- **Dynamic URL in manifest**: Prevents LinkedIn's extension fingerprinting from
  detecting our extension via web_accessible_resources probing.
- **Human-speed scrolling**: Connections extraction uses randomized delays to avoid
  behavioral detection. Quality over speed.

---

## MVP Non-Goals (Phase 2+)

- Batch lead import / CSV export
- Team features / shared lead pools
- CRM integrations (Salesforce, HubSpot)
- LinkedIn API partner access
- Automated sending / connection requests
- Analytics dashboard
- Email/phone enrichment (Apollo's core — we differentiate on AI qualification)
- Multi-platform support (Firefox, Edge)
- Lead scoring model training / fine-tuning

---

## Reference Implementations

| Pattern | Source Project | Key Files |
|---|---|---|
| LinkedIn OIDC auth | deathnote | `src/app/sign-in/actions.ts`, `src/app/auth/callback/route.ts` |
| Supabase client setup | deathnote | `src/lib/supabase/auth.ts`, `src/lib/supabase/hooks.ts` |
| Vercel AI SDK + gateway | deathnote | `src/app/api/generate-eulogy/route.ts` |
| User profile extraction | deathnote | `src/lib/auth.ts` |
| Vercel deployment config | yenchat | `vercel.json` |
| Biome config | yenchat | `biome.json` |
| Competitive reference | Apollo.io | Chrome extension side panel pattern |

---

## Implementation Checklist

Step-by-step build order. Each milestone is independently shippable.
Complete each milestone fully before moving to the next.

---

### Milestone 1: Project Scaffold

Get the monorepo structure running with both the web app and extension building.

- [x] 1.1 — `bun create next-app` with TypeScript, Tailwind 4, App Router
- [x] 1.2 — Add Biome config (port from yenchat)
- [x] 1.3 — Create `/extension` directory for Chrome extension source
- [x] 1.4 — Write `extension/manifest.json` (Manifest V3, `use_dynamic_url: true`)
- [x] 1.5 — Create minimal extension popup (HTML + React shell)
- [x] 1.6 — Create minimal content script (logs "SalesMAXXing loaded" on linkedin.com)
- [x] 1.7 — Create background service worker (empty shell)
- [x] 1.8 — Add extension build script (Bun bundler, outputs to `/extension/dist`)
- [x] 1.9 — Load unpacked extension in Chrome, verify popup + content script work
- [x] 1.10 — Deploy empty Next.js app to Vercel

**Checkpoint: Extension loads in Chrome. Web app deploys to Vercel.**

---

### Milestone 2: Authentication

User can sign in with LinkedIn and the extension knows who they are.

- [x] 2.1 — Set up Supabase project (or reuse existing, decide now)
- [x] 2.2 — Enable LinkedIn OIDC provider in Supabase dashboard
- [x] 2.3 — Add env vars to Vercel (SUPABASE_URL, SUPABASE_ANON_KEY, APP_URL)
- [x] 2.4 — Port Supabase client setup from deathnote (`lib/supabase/`)
- [x] 2.5 — Build `/auth/callback` route (port from deathnote)
- [x] 2.6 — Build sign-in page with "Sign in with LinkedIn" button
- [ ] 2.7 — Store LinkedIn profile meta in `user_profiles` table on first login
- [ ] 2.8 — Extension popup: detect auth state (check Supabase session via web app)
- [ ] 2.9 — Extension popup: "Sign in with LinkedIn" button → opens web app auth
- [ ] 2.10 — After auth callback, pass session token to extension (chrome.storage)
- [ ] 2.11 — Verify: click extension → sign in → extension shows "Hello, [name]"

**Checkpoint: Full LinkedIn sign-in works from the extension.**

---

### Milestone 3: LinkedIn Data Extraction

Content script can read profile data and connections from LinkedIn pages.

- [ ] 3.1 — Content script: detect LinkedIn profile page (`/in/*` URL pattern)
- [ ] 3.2 — Build DOM extraction module with resilient selectors
- [ ] 3.3 — Extract profile fields: name, headline, location, about, experience, education
- [ ] 3.4 — Try JSON-LD extraction first (`<script type="application/ld+json">`)
- [ ] 3.5 — Fall back to DOM selectors (`pv-top-card`, `pvs-list__*`, `data-*`, `aria-label`)
- [ ] 3.6 — Add MutationObserver for SPA navigation (detect page changes)
- [ ] 3.7 — Extract authenticated user's own profile (navigate to own profile URL)
- [ ] 3.8 — Save own profile data to chrome.storage + Supabase `user_profiles`
- [ ] 3.9 — Content script: detect connections page, extract connection cards
- [ ] 3.10 — Implement human-speed auto-scroll (randomized 1-3s delays per batch)
- [ ] 3.11 — Capture connections as they scroll (name, headline, profile URL)
- [ ] 3.12 — Store extracted connections in chrome.storage.local (cache)
- [ ] 3.13 — Background worker: coordinate extraction flow (profile → connections)
- [ ] 3.14 — Verify: load extension, visit LinkedIn, confirm data extraction in devtools

**Checkpoint: Extension extracts your profile + connections from LinkedIn DOM.**

---

### Milestone 4: AI Qualification Engine

Claude analyzes the user's network and returns ranked leads.

- [ ] 4.1 — Install Vercel AI SDK: `bun add ai @ai-sdk/anthropic`
- [ ] 4.2 — Add ANTHROPIC_API_KEY to Vercel env vars
- [ ] 4.3 — Build `/api/qualify` route (POST, auth-gated via Supabase session)
- [ ] 4.4 — Write system prompt: sales qualification (what makes a good lead given the user's role)
- [ ] 4.5 — Automatic mode: send user profile + connections batch → Claude ranks top 5-10
- [ ] 4.6 — Custom mode: send user criteria + connections → Claude filters + ranks
- [ ] 4.7 — Define response schema (name, score 0-100, justification, key signals, talking points)
- [ ] 4.8 — Implement streaming with Vercel AI SDK `streamText()` for real-time results
- [ ] 4.9 — Save qualified leads to Supabase `leads` table
- [ ] 4.10 — Verify: send test data to API, get back ranked leads with justifications

**Checkpoint: API takes connections + context, returns AI-ranked leads.**

---

### Milestone 5: Side Panel UI — Onboarding + Lead Results

The beautiful, always-available side panel that makes this product special.

- [ ] 5.1 — Register side panel in manifest.json
- [ ] 5.2 — Side panel shell: React + Tailwind, dark/premium design language
- [ ] 5.3 — Onboarding screen 1: "Welcome, [name]" with LinkedIn avatar
- [ ] 5.4 — Onboarding screen 2: Automatic vs Custom qualification picker
- [ ] 5.5 — Custom qualification form: keywords, company URLs, ICP notes, industry
- [ ] 5.6 — Loading state: qualification in progress (animated, shows what's happening)
- [ ] 5.7 — Lead card component: name, title, company, score badge, connection degree
- [ ] 5.8 — Lead card expand: full justification, profile highlights, talking points
- [ ] 5.9 — Lead list view: 5-10 cards, sorted by score, smooth expand/collapse
- [ ] 5.10 — "View Profile" button: opens LinkedIn profile in main tab
- [ ] 5.11 — "Refresh" button: re-run qualification with latest data
- [ ] 5.12 — Empty state: no leads found / extraction in progress
- [ ] 5.13 — Error states: auth expired, API error, extraction failed
- [ ] 5.14 — Verify: full flow from extension click → onboarding → see ranked leads

**Checkpoint: Click extension, choose mode, see beautiful ranked lead cards.**

---

### Milestone 6: InMail Draft Generation

One-click personalized message for any qualified lead.

- [ ] 6.1 — Build `/api/generate-intro` route (POST, auth-gated)
- [ ] 6.2 — System prompt: personalized outreach (warm, relevant, not spammy)
- [ ] 6.3 — Input: rep profile + lead profile + qualification context + tone
- [ ] 6.4 — Stream response to side panel for real-time draft display
- [ ] 6.5 — "Draft InMail" button on each lead card
- [ ] 6.6 — InMail composer view: editable text area with AI-generated draft
- [ ] 6.7 — Tone selector: professional / casual / mutual connection reference
- [ ] 6.8 — "Copy to Clipboard" button with confirmation feedback
- [ ] 6.9 — Save generated intros to Supabase `intros` table
- [ ] 6.10 — Verify: click "Draft InMail" on lead → see personalized message → copy works

**Checkpoint: Full MVP flow complete. Browse → Qualify → Draft → Copy → Send.**

---

### Milestone 7: Database + Persistence

Leads and intros persist across sessions.

- [ ] 7.1 — Create Supabase migrations for all tables
- [ ] 7.2 — `user_profiles`: id, supabase_auth_id, linkedin_data, job_context, created_at
- [ ] 7.3 — `qualification_configs`: id, user_id, mode, keywords, urls, icp_notes, industry
- [ ] 7.4 — `leads`: id, user_id, linkedin_url, profile_data, score, justification, status
- [ ] 7.5 — `intros`: id, user_id, lead_id, message, tone, version, created_at
- [ ] 7.6 — RLS policies: users only access their own rows
- [ ] 7.7 — Build `/api/leads` CRUD routes (GET list, POST save, PATCH status)
- [ ] 7.8 — Side panel: load saved leads from Supabase on open
- [ ] 7.9 — Side panel: lead status tracking (new, contacted, replied, qualified)
- [ ] 7.10 — Verify: close/reopen extension, leads + intros persist

**Checkpoint: Data survives browser restarts. Leads are trackable.**

---

### Milestone 8: Polish + Ship

Make it beautiful, test it, package it.

- [ ] 8.1 — Extension icon set (16, 32, 48, 128px)
- [ ] 8.2 — Side panel: micro-interactions, hover states, transitions
- [ ] 8.3 — Side panel: loading skeletons for all async states
- [ ] 8.4 — Side panel: score visualization (gradient bar, color-coded badge)
- [ ] 8.5 — Extension popup: branded, minimal, shows quick status
- [ ] 8.6 — Error boundary for extension crashes
- [ ] 8.7 — Test on multiple LinkedIn page types (profile, company, search)
- [ ] 8.8 — Test auth flow end-to-end (fresh install → sign in → qualify → draft)
- [ ] 8.9 — Privacy policy page (required for Chrome Web Store)
- [ ] 8.10 — Chrome Web Store developer account + listing assets
- [ ] 8.11 — Web app landing page (what it does, install CTA, screenshots)
- [ ] 8.12 — Submit to Chrome Web Store (or distribute as unpacked for beta)

**Checkpoint: MVP shipped. Installable, usable, beautiful.**
