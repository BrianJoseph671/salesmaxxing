# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

SalesMAXXing Agent — Chrome extension + Next.js web app for AI-powered lead qualification from LinkedIn. Users sign in with LinkedIn, and Claude analyzes their network to surface the best leads with justification and one-click InMail drafts.

## Commands

```bash
# Development
bun run dev              # Next.js dev server (Turbopack)
bun run ext:build        # Build Chrome extension → extension/dist/
bun run ext:dev          # Build extension in watch mode

# Quality gates (run in this order before committing)
bun run lint             # Biome check + auto-fix
bun run check            # Biome check + TypeScript noEmit
bun run build            # Next.js production build

# Formatting
bun run format           # Biome format --write
```

Load the extension: `chrome://extensions` → Developer mode → Load unpacked → select `extension/dist/`.

## Architecture

This is a hybrid project: a Next.js web app (auth, API routes, dashboard) and a Chrome extension (LinkedIn integration, side panel UI) sharing the same repo.

**Next.js web app** (`src/app/`):
- Auth via Supabase LinkedIn OIDC (pattern ported from deathnote project)
- AI routes use Vercel AI SDK with `@ai-sdk/anthropic` for Claude
- `/api/qualify` — lead qualification (streaming structured output, temperature 0.3)
- `/api/generate-intro` — InMail draft generation (streaming text, temperature 0.7)
- `/api/leads` — CRUD (GET sorted by score, POST save batch, PATCH status)
- `/api/intros` — POST to persist generated InMail drafts
- Supabase tables: `user_profiles`, `leads`, `intros`, `qualification_configs` — all with RLS
- Deployed to Vercel

**Chrome extension** (`extension/`):
- Manifest V3 with `use_dynamic_url: true` (prevents LinkedIn's extension fingerprinting)
- Content script injected on `linkedin.com/*` — extracts profile data from DOM
- Side panel — main UI surface (React), always available while browsing LinkedIn
- Popup — entry point for auth state check and quick actions
- Background service worker — coordinates messaging between content script and side panel
- Built with Bun bundler (`scripts/build-extension.ts`), outputs to `extension/dist/`

**LinkedIn DOM extraction:**
- LinkedIn uses Ember.js (not React) — dynamic `ember####` IDs are unreliable
- Use `data-*` attributes, `aria-label`, and ArtDeco class prefixes (`pv-`, `pvs-`, `artdeco-`)
- MutationObserver required for SPA navigation detection (no full page reloads)
- Connections page uses virtual scrolling — only ~40 items in DOM at a time, capture during scroll
- Human-speed scrolling with randomized delays to avoid behavioral detection

## Key Patterns

- **Supabase auth, AI SDK, Vercel config** are ported from sibling projects (`deathnote`, `yenchat`) in `~/Documents/`. Reference those for proven patterns.
- **Vercel AI SDK**: Use `generateText()` or `streamText()` from `ai` package. Structured output via `Output.object({ schema })`. Model provider configured in `src/lib/ai/provider.ts` — uses Vercel AI Gateway when `AI_GATEWAY_API_KEY` is set (preferred), falls back to direct `@ai-sdk/anthropic` otherwise.
- **Dual auth in API routes**: `getUserFromRequest(request)` in `src/lib/supabase/auth.ts` checks Bearer token first (Chrome extension), falls back to cookie-based auth (web app). All API routes serving the extension must use this, not `getUser()`.
- **Extension ↔ web app auth**: OAuth flow stores session in `chrome.storage.local` under `authSession` key (includes `accessToken`, `appUrl`, `user`). Extension sends `Authorization: Bearer {token}` on all API requests.
- **Content script data flow**: Extract DOM → message to background worker → forward to side panel or API.
- **Fire-and-forget persistence**: Save to `chrome.storage` first (instant, reliable), then sync to Supabase in background (resilient to network failures). Pattern used for leads, intros, and profile data.
- **CORS for extension**: All API routes need `OPTIONS` handler with `createExtensionPreflightResponse()` and wrap responses with `applyExtensionCors()` from `src/lib/http/cors.ts`.
- **Zod schemas**: Request/response validation in `src/lib/ai/schemas.ts`. Used by `/api/qualify` for structured AI output.

## Biome Rules

- Tab indentation, double quotes
- `noExplicitAny: error` — no `any` types
- `noConsole: warn` — use `biome-ignore` comment for intentional console usage
- `useImportType: error` — use `import type` for type-only imports
- `noNonNullAssertion: error` — no `!` assertions
- `chrome` is declared as a global (extension code)

## Extension Build

The extension has its own build pipeline separate from Next.js:
- Source in `extension/src/` (TypeScript + React)
- Build script: `scripts/build-extension.ts` (uses Bun's bundler)
- Static files (`manifest.json`, HTML, icons`) copied from `extension/` to `extension/dist/`
- Output goes to `extension/dist/` which is the loadable unpacked extension
- `extension/dist/` is gitignored — always rebuild before loading

## Implementation Plan

Full task breakdown with checkable milestones lives in `todo.md`. Consult it for current progress, MVP scope, technical feasibility notes, and reference implementations from sibling projects.
