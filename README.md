# Namma Panchanga — website (Cloudflare Pages)

Every page is rendered on the server by a Cloudflare Pages Function, so Google, Bing and AI search bots get complete HTML.
About 18,500 pages: home, 42 towns (today), month calendars and every day from 1 Nov 2026 to 31 Dec 2027.

## Folders
- `functions/[[path]].js` — renders all pages (with edge caching until midnight IST)
- `src/render.js` — page templates, schema, breadcrumbs, sitemap and robots
- `src/data/` — panchanga data calculated by the app's own engine
- `public/` — static files: WebP logo, fonts, icons, `_headers`, `_routes.json`
- `scripts/build.mjs` — writes `sitemap.xml` and `robots.txt` for your domain at build time
- `tools/GenerateSiteData.kt` — regenerates the data (run before Dec 2027)

## Cloudflare Pages settings
- Framework preset: **None**
- Build command: **npm run build**
- Build output directory: **public**
- Environment variables (Production and Preview):
  - `SITE_URL` = `https://your-domain` (no trailing slash)
  - `NODE_VERSION` = `22`

## Local test (optional)
    SITE_URL=https://example.in npm run build
    npx wrangler pages dev public
