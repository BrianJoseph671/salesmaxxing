# SalesMAXXing Agent

AI-powered lead qualification from your LinkedIn network.

**Problem:** Sales reps struggle to close obvious opportunities.

**Solution:** Any rep can qualify with confidence using the SalesMAXXing Agent.

## What It Does

Chrome extension that sits alongside LinkedIn. Sign in with LinkedIn, and immediately get AI-qualified leads from your own network -- ranked by fit, with context on why they match, and a one-click InMail draft.

Two qualification modes:
- **Automatic** -- AI reviews your profile and job to surface the 5-10 best leads from your connections
- **Custom** -- You provide keywords, URLs, and criteria for targeted qualification

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Package Manager | Bun |
| Auth | Supabase + LinkedIn OIDC |
| Database | Supabase (Postgres) |
| AI | Vercel AI SDK + Claude (Anthropic) |
| Hosting | Vercel |
| Extension | Chrome Manifest V3 |

## Development

```bash
# Install dependencies
bun install

# Run Next.js dev server
bun run dev

# Run full repo checks
bun run check

# Build Chrome extension
bun run ext:build

# Build Chrome extension (watch mode)
bun run ext:dev

# Lint
bun run lint

# Auto-fix lint issues
bun run lint:fix

# Typecheck
bun run typecheck

# Production build
bun run build

# Deploy to Vercel production
bun run deploy:prod
```

### Loading the Extension

1. Run `bun run ext:build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `extension/dist/` directory

## Project Structure

```
salesmaxxing/
├── src/app/              # Next.js web app (auth, API routes, dashboard)
├── extension/
│   ├── src/              # Extension source (TypeScript/React)
│   │   ├── popup.tsx     # Extension popup UI
│   │   ├── sidepanel.tsx # Side panel UI (main interface)
│   │   ├── content.ts    # LinkedIn content script
│   │   └── background.ts # Service worker
│   ├── manifest.json     # Manifest V3 config
│   └── dist/             # Built extension (load this in Chrome)
├── scripts/              # Build scripts
└── todo.md               # Implementation plan + checklist
```

## License

MIT
