// Cloudflare Pages Function: renders every page on the server (complete HTML for Google and AI search bots).
// Static files (assets, favicon, sitemap.xml, robots.txt) are served directly — see public/_routes.json.
import { render } from "../src/render.js";

export async function onRequest(context) {
  const { request, env } = context;
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }
  const url = new URL(request.url);
  const site = (env.SITE_URL || url.origin).replace(/\/+$/, "");

  // Edge cache: today's pages are kept until midnight India time, day pages for a week.
  const cache = typeof caches !== "undefined" ? caches.default : null;
  const key = new Request(url.toString(), { method: "GET" });
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return request.method === "HEAD" ? new Response(null, hit) : hit;
  }

  const r = render(url.pathname, site, Date.now());
  const headers = { "Cache-Control": r.cache, "X-Content-Type-Options": "nosniff" };
  let resp;
  if (r.location) {
    resp = new Response(null, { status: r.status, headers: { ...headers, Location: r.location } });
  } else {
    resp = new Response(r.body, { status: r.status, headers: { ...headers, "Content-Type": r.type } });
  }
  if (cache && (r.status === 200 || r.status === 301)) context.waitUntil(cache.put(key, resp.clone()).catch(() => {}));
  return request.method === "HEAD" ? new Response(null, resp) : resp;
}
