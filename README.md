# SalesMAXXing Agent

AI-powered lead qualification from your LinkedIn network.

## MVP Status

SalesMAXXing is in late MVP polish.

What is already working:
- LinkedIn sign-in through Supabase
- Chrome extension popup + side panel
- LinkedIn profile / connections extraction
- AI lead qualification and ranking
- Lead persistence in Supabase
- InMail draft generation

Production app:
- `https://salesmaxxing.vercel.app`

Current extension download:
- `https://salesmaxxing.vercel.app/downloads/salesmaxxing-extension.zip`

## What It Does

SalesMAXXing is a Chrome extension that lives alongside LinkedIn. After sign-in, it qualifies leads from your own network, ranks the best fits, explains why they match, and drafts personalized outreach.

Qualification modes:
- `Automatic`: AI infers your ICP from your profile and ranks the strongest matches.
- `Custom`: you define keywords, target companies, industries, and ICP notes.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Linting | Biome |
| Package Manager | Bun |
| Auth | Supabase + LinkedIn OIDC |
| Database | Supabase Postgres |
| AI | Vercel AI SDK + Claude |
| Hosting | Vercel |
| Extension | Chrome Manifest V3 |

## Development

```bash
bun install
bun run dev
bun run lint
bun run typecheck
bun run ext:build
bun run ext:zip
bun run build
bun run deploy:prod
```

Useful scripts:
- `bun run ext:build` builds `extension/dist/`
- `bun run ext:zip` builds the extension and packages `public/downloads/salesmaxxing-extension.zip`
- `bun run check` runs lint, typecheck, app build, and extension build

## Trying The Extension

1. Download `https://salesmaxxing.vercel.app/downloads/salesmaxxing-extension.zip`
2. Unzip it
3. Open `chrome://extensions`
4. Enable Developer Mode
5. Click `Load unpacked`
6. Select the extracted `salesmaxxing-extension` folder

## Project Structure

```text
salesmaxxing/
├── src/app/              # Next.js web app (auth, API routes, landing page)
├── extension/
│   ├── src/              # Extension source
│   ├── manifest.json     # Manifest V3 config
│   └── dist/             # Built unpacked extension
├── public/downloads/     # Generated extension ZIP for the landing page
├── scripts/              # Build + packaging scripts
├── supabase/migrations/  # Database schema changes
└── todo.md               # Implementation checklist
```

## License

MIT
