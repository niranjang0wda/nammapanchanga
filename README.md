# Namma Panchanga — website (Cloudflare Workers + static assets)

Every page is rendered on the server by a Cloudflare Worker, so Google, Bing and AI search bots get complete HTML.
About 37,000 pages in Kannada (/) and English (/en/): home, 42 towns (today), month calendars and every day from 1 Nov 2026 to 31 Dec 2027. Each page links to its other language with hreflang.

## Files
- `src/worker.js` — the Worker: renders all pages, edge cache until midnight IST
- `src/render.js` — page templates, schema, breadcrumbs, sitemap and robots
- `src/data/` — panchanga data from the app's own engine
- `public/` — static files (WebP logo, fonts, icons, `_headers`); `sitemap.xml` and `robots.txt` are written here at build time
- `wrangler.jsonc` — Cloudflare settings (Worker name `nammapanchanga`)
- `scripts/build.mjs` — writes sitemap.xml, robots.txt and src/site-url.js for your domain
- `tools/GenerateSiteData.kt` — regenerates the data (run before Dec 2027)

## Cloudflare settings (Workers & Pages › your project › Settings › Build)
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Build variables: `SITE_URL` = `https://your-address` (no trailing slash) · `NODE_VERSION` = `22`

## Local test (optional)
    SITE_URL=https://example.in npm run build
    npx wrangler dev
