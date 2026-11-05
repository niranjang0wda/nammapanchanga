// Build step for Cloudflare Pages: writes public/sitemap.xml and public/robots.txt for your domain.
// Set SITE_URL in Cloudflare › your project › Settings › Build › Variables and secrets (for example https://nammapanchanga.in).
import { writeFileSync } from "node:fs";
import { sitemap, robots, ALL_DATES, TOWNS } from "../src/render.js";

const site = (process.env.SITE_URL || "").replace(/\/+$/, "");
if (!/^https:\/\/[^/]+$/.test(site)) {
  console.error("SITE_URL is missing or invalid. Set it in Cloudflare Pages › Settings › Environment variables, e.g. https://nammapanchanga.in");
  process.exit(1);
}
const today = new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
writeFileSync(new URL("../public/sitemap.xml", import.meta.url), sitemap(site, today));
writeFileSync(new URL("../public/robots.txt", import.meta.url), robots(site));
// The Worker uses the same address for canonical links
writeFileSync(new URL("../src/site-url.js", import.meta.url), `export const SITE_URL = ${JSON.stringify(site)};\n`);
console.log(`sitemap.xml and robots.txt written for ${site} — ${TOWNS.length} towns, ${ALL_DATES[0]} to ${ALL_DATES[ALL_DATES.length - 1]}`);
