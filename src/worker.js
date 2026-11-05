// Cloudflare Worker: static files in /public are served automatically; every page is rendered here on the server.
import { render } from "./render.js";
import { SITE_URL } from "./site-url.js";

export default {
  async fetch(request, env, ctx) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }
    const url = new URL(request.url);
    const site = (env.SITE_URL || SITE_URL || url.origin).replace(/\/+$/, "");

    // Edge cache: today's pages until midnight India time, day pages for a week (works on your custom domain).
    const cache = typeof caches !== "undefined" ? caches.default : null;
    const key = new Request(url.toString(), { method: "GET" });
    if (cache) {
      const hit = await cache.match(key);
      if (hit) return request.method === "HEAD" ? new Response(null, hit) : hit;
    }

    const r = render(url.pathname, site, Date.now());
    const headers = { "Cache-Control": r.cache, "X-Content-Type-Options": "nosniff" };
    const resp = r.location
      ? new Response(null, { status: r.status, headers: { ...headers, Location: r.location } })
      : new Response(r.body, { status: r.status, headers: { ...headers, "Content-Type": r.type } });
    if (cache && (r.status === 200 || r.status === 301)) ctx.waitUntil(cache.put(key, resp.clone()).catch(() => {}));
    return request.method === "HEAD" ? new Response(null, resp) : resp;
  },
};
