/**
 * Namma Panchanga website — every page rendered on the server, in Kannada (/) and English (/en/).
 * Each page links to its other-language version with hreflang, so Google shows the right one to each searcher.
 *
 * Routes (Kannada; English is the same with /en in front):
 *   /  /panchanga/  /panchanga/{town}/  /panchanga/{town}/{yyyy-mm}/  /panchanga/{town}/{yyyy-mm-dd}/
 *   /festivals/  /rashi-bhavishya/  /jyotishi-ai/  /app/
 *   /terms/  /privacy/ (English only)  ·  /sitemap.xml  /robots.txt
 */
import { DAYS, names as NAMES, misc as MISC, towns as TOWNS } from "./data/index.js";
import CSS from "./css.js";
import { TERMS as TERMS_TXT, PRIVACY as PRIVACY_TXT } from "./legal.js";

const TOWN = Object.fromEntries(TOWNS.map((t) => [t.id, t]));
const days = (id) => DAYS[id];
const ALL_DATES = Object.keys(DAYS.bengaluru).sort();
const FIRST = ALL_DATES[0], LAST = ALL_DATES[ALL_DATES.length - 1];
const PLAY = "https://play.google.com/store/apps/details?id=com.ncaps.nammapanchanga";
/** Other English spellings people search with. */
const ALIAS = {
  bengaluru: "Bangalore", mysuru: "Mysore", mangaluru: "Mangalore", hubballi: "Hubli", belagavi: "Belgaum", kalaburagi: "Gulbarga",
  ballari: "Bellary", vijayapura: "Bijapur", shivamogga: "Shimoga", tumakuru: "Tumkur", chikkamagaluru: "Chikmagalur",
  hosapete: "Hospet", davanagere: "Davangere", chikkaballapur: "Chikballapur", bagalkot: "Bagalkote", kundapura: "Kundapur",
};

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const T = (L, k, e) => (L === "en" ? e : k);
const P = (L, p) => (L === "en" ? "/en" + p : p);
const nm = (L, i) => (NAMES[i] || ["", ""])[L === "en" ? 1 : 0];
const li = (L) => (L === "en" ? 1 : 0);
function istToday(now) { return new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10); }
function addDays(iso, n) { const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function parts(iso) { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; }
const month = (L, m) => MISC.months[m - 1][li(L)];
const vara = (L, w) => MISC.vara[w][li(L)];
function dateStr(L, iso, w) { const { y, m, d } = parts(iso); return (w != null ? vara(L, w) + ", " : "") + d + " " + month(L, m) + " " + y; }
function period(h) { return h < 4 ? "ರಾತ್ರಿ" : h < 12 ? "ಬೆಳಿಗ್ಗೆ" : h < 16 ? "ಮಧ್ಯಾಹ್ನ" : h < 19 ? "ಸಂಜೆ" : "ರಾತ್ರಿ"; }
function time(L, min) {
  if (min == null) return "—";
  const next = min >= 1440, mm = ((min % 1440) + 1440) % 1440, h = Math.floor(mm / 60), m = mm % 60, h12 = ((h + 11) % 12) + 1;
  const hm = h12 + ":" + String(m).padStart(2, "0");
  return L === "en" ? hm + (h < 12 ? " AM" : " PM") + (next ? " (next day)" : "") : period(h) + " " + hm + (next ? " (ನಾಳೆ)" : "");
}
function short(min) { const mm = ((min % 1440) + 1440) % 1440, h = Math.floor(mm / 60), m = mm % 60; return ((h + 11) % 12) + 1 + ":" + String(m).padStart(2, "0"); }
const townName = (L, t) => (L === "en" ? t.en + (ALIAS[t.id] ? ` (${ALIAS[t.id]})` : "") : t.kn);
const townShort = (L, t) => (L === "en" ? t.en : t.kn);
const paksha = (L, p) => MISC.paksha[p][li(L)].replace(L === "en" ? " Paksha" : " ಪಕ್ಷ", "");
function day(townId, iso) {
  const r = days(townId)[iso]; if (!r) return null;
  return {
    iso, w: r[0], sam: r[1], ayana: r[2], ritu: r[3], masa: r[4], adhika: r[5], paksha: r[6],
    tithi: r[7], tithiEnd: r[8], tithiNext: r[9], nak: r[10], nakEnd: r[11], nakNext: r[12],
    yoga: r[13], yogaEnd: r[14], karana: r[15], sunrise: r[16], sunset: r[17], moonrise: r[18], moonset: r[19],
    rahu: [r[20], r[21]], yama: [r[22], r[23]], gulika: [r[24], r[25]], abhijit: r[26] == null ? null : [r[26], r[27]],
    fest: r[29], moon: r[30],
  };
}
function nextFestivals(townId, fromIso, count) {
  const out = []; let iso = fromIso;
  while (out.length < count && iso <= LAST) { const d = day(townId, iso); if (d && d.fest.length) out.push(d); iso = addDays(iso, 1); }
  return out;
}

// ---------- shared parts ----------
const ICON_DL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';
const dlBtn = (L, big) => `<a class="dlb${big ? " big" : ""}" href="${PLAY}" rel="noopener">${ICON_DL}<span><b>${T(L, "ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", "Download the app")}</b><small>${T(L, "Google Play ನಲ್ಲಿ ಉಚಿತ", "Free on Google Play")}</small></span></a>`;
const SITE_NAME = (L) => T(L, "ನಮ್ಮ ಪಂಚಾಂಗ", "Namma Panchanga");
const EXTRA_CSS = `.lsw{display:inline-flex;border:1.5px solid var(--line);border-radius:999px;overflow:hidden;font-weight:800;font-size:13px}.lsw a,.lsw span{padding:5px 11px}.lsw span{background:var(--maroon);color:#FFC21A}.hr{display:flex;align-items:center;gap:10px}`;

function layout(site, L, o) {
  // o: {path (Kannada path), title, desc, crumbs:[[name, path]], body, schema, script, single (no other language), en (force lang en)}
  const self = o.single ? o.path : P(L, o.path);
  const url = site + self;
  const lang = o.single ? "en" : L;
  const alt = o.single ? "" : `<link rel="alternate" hreflang="kn" href="${site}${o.path}">\n<link rel="alternate" hreflang="en" href="${site}/en${o.path}">\n<link rel="alternate" hreflang="x-default" href="${site}${o.path}">`;
  const home = P(L, "/");
  const crumbs = o.crumbs || [];
  const crumbLd = crumbs.length ? {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [[T(L, "ಮುಖಪುಟ", "Home"), home], ...crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: site + c[1] })),
  } : null;
  const org = { "@context": "https://schema.org", "@type": "Organization", "@id": site + "/#org", name: "Namma Panchanga · ನಮ್ಮ ಪಂಚಾಂಗ", alternateName: ["ನಮ್ಮ ಪಂಚಾಂಗ", "Namma Panchanga"], url: site + "/", logo: site + "/assets/icon-512.png", sameAs: [PLAY] };
  const schema = [org, ...(o.schema || []), ...(crumbLd ? [crumbLd] : [])];
  const crumbHtml = crumbs.length ? `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href="${home}">${T(L, "ಮುಖಪುಟ", "Home")}</a></li>${crumbs.map((c, i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(c[0])}</li>` : `<li><a href="${c[1]}">${esc(c[0])}</a></li>`).join("")}</ol></nav>` : "";
  const sw = o.single ? "" : `<nav class="lsw" aria-label="Language">${L === "kn" ? `<span>ಕನ್ನಡ</span><a href="/en${o.path}" hreflang="en" lang="en">English</a>` : `<a href="${o.path}" hreflang="kn" lang="kn">ಕನ್ನಡ</a><span>English</span>`}</nav>`;
  const nav = [["/panchanga/bengaluru/", T(L, "ಇಂದಿನ ಪಂಚಾಂಗ", "Today")], ["/panchanga/", T(L, "ಊರುಗಳು", "Towns")], ["/festivals/", T(L, "ಹಬ್ಬಗಳು", "Festivals")], ["/rashi-bhavishya/", T(L, "ರಾಶಿ ಭವಿಷ್ಯ", "Horoscope")], ["/jyotishi-ai/", T(L, "ಜ್ಯೋತಿಷಿ AI", "Jyotishi AI")]];
  const fnav = [["/", T(L, "ಮುಖಪುಟ", "Home")], ["/panchanga/", T(L, "ಎಲ್ಲಾ ಊರುಗಳ ಪಂಚಾಂಗ", "Panchanga for all towns")], ["/festivals/", T(L, "ಹಬ್ಬಗಳು", "Festivals")], ["/rashi-bhavishya/", T(L, "ರಾಶಿ ಭವಿಷ್ಯ", "Rashi bhavishya")], ["/jyotishi-ai/", T(L, "ಜ್ಯೋತಿಷಿ AI", "Jyotishi AI")], ["/app/", T(L, "ಆ್ಯಪ್", "App")]];
  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${esc(url)}">
${alt}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME(L)}">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${site}/assets/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="${lang === "en" ? "en_IN" : "kn_IN"}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#5C0A04">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/assets/icon-192.png">
<link rel="preload" href="/assets/noto_kannada_regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/baloo_tamma_extrabold.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}${EXTRA_CSS}</style>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">${T(L, "ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ", "Skip to content")}</a>
<header><div class="wrap">
  <a href="${home}" aria-label="${T(L, "ನಮ್ಮ ಪಂಚಾಂಗ ಮುಖಪುಟ", "Namma Panchanga home")}"><img src="/assets/logo.webp" alt="${T(L, "ನಮ್ಮ ಪಂಚಾಂಗ ಲೋಗೋ", "Namma Panchanga logo")}" width="129" height="44"></a>
  <nav class="main" aria-label="${T(L, "ಮುಖ್ಯ ಮೆನು", "Main menu")}">${nav.map((n) => `<a href="${P(L, n[0])}">${n[1]}</a>`).join("")}</nav>
  <div class="hr">${sw}<a class="dlb sm" href="${P(L, "/app/")}" aria-label="${T(L, "ಆ್ಯಪ್", "App")}">${ICON_DL}<span><b>${T(L, "ಆ್ಯಪ್", "App")}</b></span></a></div>
</div></header>
${crumbHtml}
<main id="main">
${o.body}
</main>
<footer><div class="wrap">
  <nav class="fnav" aria-label="${T(L, "ಅಡಿ ಮೆನು", "Footer menu")}">${fnav.map((n) => `<a href="${P(L, n[0])}">${n[1]}</a>`).join("")}${o.single ? "" : (L === "kn" ? `<a href="/en${o.path}" lang="en">English</a>` : `<a href="${o.path}" lang="kn">ಕನ್ನಡ</a>`)}</nav>
  <div class="fbottom"><span><b>${SITE_NAME(L)}</b> · © ${new Date().getUTCFullYear()}</span><nav aria-label="Legal"><a href="/terms/">${T(L, "ನಿಯಮಗಳು · ", "")}Terms of Service</a><a href="/privacy/">${T(L, "ಗೋಪ್ಯತೆ · ", "")}Privacy Policy</a></nav></div>
</div></footer>
<div class="stick"><a href="${PLAY}" rel="noopener">${ICON_DL}<span>${T(L, "ಆ್ಯಪ್ ಉಚಿತವಾಗಿ ಪಡೆಯಿರಿ", "Get the free app")}</span></a></div>
${o.script || ""}
</body></html>`;
}

// ---------- panchanga card ----------
function card(L, townId, d, today, opts = {}) {
  const t = TOWN[townId];
  const fest = d.fest.concat(d.moon);
  const until = (m) => T(L, `${time(L, m)} ರವರೆಗೆ`, `until ${time(L, m)}`);
  const then = (i) => T(L, `, ನಂತರ ${nm(L, i)}`, `, then ${nm(L, i)}`);
  const rows = [
    [T(L, "ತಿಥಿ", "Tithi"), `${paksha(L, d.paksha)} ${nm(L, d.tithi)}`, until(d.tithiEnd) + then(d.tithiNext)],
    [T(L, "ನಕ್ಷತ್ರ", "Nakshatra"), nm(L, d.nak), until(d.nakEnd) + then(d.nakNext)],
    [T(L, "ಯೋಗ", "Yoga"), nm(L, d.yoga), until(d.yogaEnd)],
    [T(L, "ಕರಣ", "Karana"), nm(L, d.karana), ""],
    [T(L, "ಸೂರ್ಯೋದಯ · ಸೂರ್ಯಾಸ್ತ", "Sunrise · Sunset"), `${time(L, d.sunrise)} · ${time(L, d.sunset)}`, ""],
    [T(L, "ಚಂದ್ರೋದಯ · ಚಂದ್ರಾಸ್ತ", "Moonrise · Moonset"), `${time(L, d.moonrise)} · ${time(L, d.moonset)}`, ""],
  ];
  const kala = [[T(L, "ರಾಹುಕಾಲ", "Rahu Kalam"), d.rahu, "rahu"], [T(L, "ಯಮಗಂಡ", "Yamagandam"), d.yama, ""], [T(L, "ಗುಳಿಕ", "Gulika Kalam"), d.gulika, ""]];
  if (d.abhijit) kala.push([T(L, "ಅಭಿಜಿತ್ (ಶುಭ)", "Abhijit (auspicious)"), d.abhijit, "good"]);
  const H = opts.h1 ? "h1" : "h2";
  return `<section class="card" aria-labelledby="pc-${d.iso}">
  <div class="ctop"><div><div class="kick">${today ? T(L, "ಇಂದಿನ ಪಂಚಾಂಗ", "Today's panchanga") : T(L, "ಪಂಚಾಂಗ", "Panchanga")} · ${esc(townShort(L, t))}</div>
    <${H} class="date disp" id="pc-${d.iso}">${esc(opts.title || dateStr(L, d.iso, d.w))}</${H}>
    <p class="meta">${esc(nm(L, d.sam))} ${T(L, "ಸಂವತ್ಸರ", "Samvatsara")} · ${esc(nm(L, d.ayana))} · ${esc(nm(L, d.ritu))} ${T(L, "ಋತು", "Ritu")} · ${d.adhika ? T(L, "ಅಧಿಕ ", "Adhika ") : ""}${esc(nm(L, d.masa))} ${T(L, "ಮಾಸ", "Masa")} · ${esc(MISC.paksha[d.paksha][li(L)])}</p></div>
    <a class="town" href="${P(L, "/panchanga/")}">📍 ${esc(townShort(L, t))} ▾</a></div>
  ${fest.length ? `<p class="fest">🪔 ${fest.map((i) => esc(nm(L, i))).join(" · ")}</p>` : ""}
  <dl class="rows">${rows.map((r) => `<div class="row"><dt>${r[0]}</dt><dd><b>${esc(r[1])}</b>${r[2] ? `<small>${esc(r[2])}</small>` : ""}</dd></div>`).join("")}</dl>
  <div class="kala">${kala.map((k) => `<div class="k ${k[2]}" data-s="${k[1][0]}" data-e="${k[1][1]}"><span class="live">${T(L, "ಈಗ", "Now")}</span><div class="l">${k[0]}</div><div class="v disp">${short(k[1][0])} – ${short(k[1][1])}</div></div>`).join("")}</div>
  <div class="lockbar"><span aria-hidden="true">🔒</span><p>${T(L, "<b>ಗೌರಿ ಪಂಚಾಂಗ, ಚೌಘಡಿಯಾ, ಹೋರಾ</b> ಮತ್ತು ಈಗ ನಡೆಯುತ್ತಿರುವ ಶುಭ ಸಮಯ — ಆ್ಯಪ್‌ನಲ್ಲಿ", "<b>Gowri panchanga, Chaughadiya, Hora</b> and the good time running now — in the app")}</p><a class="btn-gold" href="${P(L, "/app/")}">${T(L, "ಆ್ಯಪ್ ನೋಡಿ", "Open app")}</a></div>
</section>`;
}
function summary(L, townId, d) {
  const t = TOWN[townId];
  const knText = `${dateStr("kn", d.iso, d.w)} ರಂದು ${t.kn}ನಲ್ಲಿ ಸೂರ್ಯೋದಯ ${time("kn", d.sunrise)}, ಸೂರ್ಯಾಸ್ತ ${time("kn", d.sunset)}. ತಿಥಿ ${nm("kn", d.tithi)} (${time("kn", d.tithiEnd)} ರವರೆಗೆ), ನಕ್ಷತ್ರ ${nm("kn", d.nak)}. ರಾಹುಕಾಲ ${time("kn", d.rahu[0])} ರಿಂದ ${time("kn", d.rahu[1])} ವರೆಗೆ${d.abhijit ? `, ಅಭಿಜಿತ್ ಮುಹೂರ್ತ ${time("kn", d.abhijit[0])} – ${time("kn", d.abhijit[1])}` : ""}.`;
  const al = ALIAS[t.id] ? ` (${ALIAS[t.id]})` : "";
  const enText = `Panchang for ${t.en}${al} on ${dateStr("en", d.iso, d.w)}: sunrise ${time("en", d.sunrise)}, sunset ${time("en", d.sunset)}. Tithi: ${paksha("en", d.paksha)} ${nm("en", d.tithi)} until ${time("en", d.tithiEnd)}. Nakshatra: ${nm("en", d.nak)} until ${time("en", d.nakEnd)}. Rahu Kalam (Rahu Kaal): ${time("en", d.rahu[0])} – ${time("en", d.rahu[1])}. Yamagandam: ${time("en", d.yama[0])} – ${time("en", d.yama[1])}. Gulika Kalam: ${time("en", d.gulika[0])} – ${time("en", d.gulika[1])}.${d.abhijit ? ` Abhijit Muhurta: ${time("en", d.abhijit[0])} – ${time("en", d.abhijit[1])}.` : ""}${d.fest.length ? " Festival: " + d.fest.map((i) => nm("en", i)).join(", ") + "." : ""}`;
  return L === "en"
    ? `<section class="note"><p>${esc(enText)}</p></section>`
    : `<section class="note"><p>${esc(knText)}</p><p lang="en">${esc(enText)}</p></section>`;
}
function clock(L) {
  const s = L === "en"
    ? { hrs: " h ", mins: " min", ist: "India time now", now: "Now: ", running: " is running", ends: " left", good: "Good time now", in: " in ", over: "Today's kalams are over", ap: "H<12?'AM':'PM'" }
    : { hrs: " ಗಂ ", mins: " ನಿ", ist: "ಈಗ ಭಾರತೀಯ ಸಮಯ", now: "ಈಗ ", running: " ನಡೆಯುತ್ತಿದೆ", ends: " ನಂತರ ಮುಗಿಯುತ್ತದೆ", good: "ಈಗ ಶುಭ ಸಮಯ", in: " ", over: "ಇಂದಿನ ಕಾಲಗಳು ಮುಗಿದಿವೆ", ap: "H<4?'ರಾತ್ರಿ':H<12?'ಬೆಳಿಗ್ಗೆ':H<16?'ಮಧ್ಯಾಹ್ನ':H<19?'ಸಂಜೆ':'ರಾತ್ರಿ'" };
  const after = L === "en" ? "" : " ನಂತರ";
  return `<script>
(function(){var c=document.querySelector('[data-today]');if(!c)return;var iso=c.getAttribute('data-today');
var f=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,year:'numeric',month:'2-digit',day:'2-digit'});
var ks=[].slice.call(document.querySelectorAll('.k')),el=document.getElementById('clk'),ap=document.getElementById('ampm'),nw=document.getElementById('nowWhat'),nx=document.getElementById('nowNext'),pu=document.getElementById('pulse');
function hm(m){var h=Math.floor(m/60);return (h?h+${JSON.stringify(s.hrs)}:'')+(m%60)+${JSON.stringify(s.mins)};}
function name(k){return k.querySelector('.l').textContent;}
function tick(){var p={};f.formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});var H=+p.hour,M=+p.minute,now=H*60+M,same=(p.year+'-'+p.month+'-'+p.day)===iso;
el.textContent=(((H+11)%12)+1)+':'+p.minute+':'+p.second;ap.textContent=${s.ap};
var act=null,nxt=null;ks.forEach(function(k){var s=+k.dataset.s,e=+k.dataset.e,on=same&&now>=s&&now<e;k.classList.toggle('active',on);if(on)act=k;if(same&&s>now&&(!nxt||s<+nxt.dataset.s))nxt=k;});
if(!same){nw.textContent=${JSON.stringify(s.ist)};nx.textContent='';pu.classList.remove('bad');}
else if(act){var bad=!act.classList.contains('good');nw.textContent=(bad?'⚠️ ':'✅ ')+${JSON.stringify(s.now)}+name(act)+${JSON.stringify(s.running)};nx.textContent=hm(+act.dataset.e-now)+${JSON.stringify(s.ends)};pu.classList.toggle('bad',bad);}
else if(nxt){nw.textContent=${JSON.stringify(s.good)};nx.textContent=name(nxt)+${JSON.stringify(s.in)}+hm(+nxt.dataset.s-now)+${JSON.stringify(after)};pu.classList.remove('bad');}
else{nw.textContent=${JSON.stringify(s.over)};nx.textContent='';pu.classList.remove('bad');}}
tick();setInterval(tick,1000);})();
</script>`;
}
const clockBox = (L, iso) => `<div class="clock" data-today="${iso}" aria-live="polite"><span class="pulse" id="pulse"></span><div><span class="time disp" id="clk">--:--:--</span><span class="ampm" id="ampm"></span></div><div class="now"><b id="nowWhat">${T(L, "ಈಗ ಭಾರತೀಯ ಸಮಯ", "India time now")}</b><span id="nowNext"></span></div></div>`;
function townGrid(L, current) {
  const a = (t) => `<a href="${P(L, `/panchanga/${t.id}/`)}"${t.id === current ? ' aria-current="page"' : ""}>${esc(L === "en" ? t.en : t.kn)}<small>${esc(L === "en" ? (ALIAS[t.id] || t.kn) : t.en)}</small></a>`;
  return `<div class="towns">${TOWNS.filter((t) => t.ka).map(a).join("")}</div><h3 class="sub">${T(L, "ಕರ್ನಾಟಕದ ಹೊರಗೆ", "Outside Karnataka")}</h3><div class="towns">${TOWNS.filter((t) => !t.ka).map(a).join("")}</div>`;
}
const festList = (L, townId, list) => `<ul class="fests">${list.map((d) => `<li><a href="${P(L, `/panchanga/${townId}/${d.iso}/`)}"><span class="d disp">${parts(d.iso).d}</span><small>${esc(month(L, parts(d.iso).m))} · ${esc(vara(L, d.w))}</small><b>${d.fest.map((i) => esc(nm(L, i))).join(" · ")}</b></a></li>`).join("")}</ul>`;
const FEATS = [
  ["🕐", ["ಗೌರಿ ಪಂಚಾಂಗ · ಚೌಘಡಿಯಾ · ಹೋರಾ", "Gowri Panchanga · Chaughadiya · Hora"], ["ಈಗ ಯಾವ ಸಮಯ ನಡೆಯುತ್ತಿದೆ", "Which period is running right now"]],
  ["✨", ["ಜ್ಯೋತಿಷಿ AI", "Jyotishi AI"], ["ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲೇ ಕೇಳಿ", "Ask about your kundli in Kannada or English"]],
  ["☀️", ["ಜನ್ಮ ಕುಂಡಲಿ", "Janma Kundli (birth chart)"], ["ರಾಶಿ, ನವಾಂಶ, ದಶೆ, ಯೋಗ, ದೋಷ", "Rashi, Navamsha, dasha, yogas, doshas"]],
  ["🌙", ["ರಾಶಿ ಭವಿಷ್ಯ", "Rashi Bhavishya (horoscope)"], ["ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷ ಭವಿಷ್ಯ", "Daily, monthly and yearly"]],
  ["💍", ["ವಿವಾಹ ಹೊಂದಾಣಿಕೆ", "Marriage matching"], ["ಅಷ್ಟಕೂಟ ಮತ್ತು 10 ಪೊರುತ್ತಂ", "Ashtakoota and 10 porutham"]],
  ["🔔", ["ಹಬ್ಬ ಮತ್ತು ಶ್ರಾದ್ಧ ಜ್ಞಾಪನೆ", "Festival and shraddha reminders"], ["ತಿಥಿ ಪ್ರಕಾರ ಕುಟುಂಬದ ಜ್ಞಾಪನೆ", "Family reminders by tithi"]],
];
const featSection = (L) => `<section class="s wrap"><h2 class="disp">${T(L, "ಆ್ಯಪ್‌ನಲ್ಲಿ ಇನ್ನಷ್ಟು", "More in the app")}</h2><div class="feats">${FEATS.map((f) => `<div class="ft"><span aria-hidden="true">${f[0]}</span><h3>${f[1][li(L)]}</h3><p>${f[2][li(L)]}</p></div>`).join("")}</div></section>`;
const appSchema = (site, L) => ({
  "@context": "https://schema.org", "@type": "MobileApplication", name: "Namma Panchanga · ನಮ್ಮ ಪಂಚಾಂಗ",
  operatingSystem: "Android", applicationCategory: "LifestyleApplication", inLanguage: ["kn", "en"],
  downloadUrl: PLAY, installUrl: PLAY, url: site + P(L, "/app/"), image: site + "/assets/icon-512.png", publisher: { "@id": site + "/#org" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  description: T(L, "ಕನ್ನಡ ಪಂಚಾಂಗ, ಜನ್ಮ ಕುಂಡಲಿ, ರಾಶಿ ಭವಿಷ್ಯ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI.", "Kannada panchang, Rahu Kalam, kundli, horoscope and AI astrologer app."),
});
const aiBanner = (L) => `<section class="s wrap"><div class="ai"><div><span class="tag">✨ ${T(L, "ಹೊಸದು", "New")}</span><h2 class="h disp">${T(L, "ಜ್ಯೋತಿಷಿ AI", "Jyotishi AI")}</h2><p>${T(L, "ನಿಮ್ಮ ಜಾತಕ ಮತ್ತು ಇಂದಿನ ಪಂಚಾಂಗ ನೋಡಿ ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ. ದಿನಕ್ಕೆ 2 ಪ್ರಶ್ನೆ ಉಚಿತ.", "Answers based on your own kundli and today's panchanga, in simple Kannada or English. 2 free questions a day.")}</p><p><a class="more light" href="${P(L, "/jyotishi-ai/")}">${T(L, "ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ →", "Learn more →")}</a></p></div>
<div><p class="bq">${T(L, "ಇಂದು ನನಗೆ ಹೇಗಿದೆ?", "How is today for me?")}</p><p class="ba">${T(L, "ಇಂದು ಚಂದ್ರ ನಿಮ್ಮ ರಾಶಿಯಿಂದ 10ನೇ ಮನೆಯಲ್ಲಿ — ಕೆಲಸಕ್ಕೆ ಒಳ್ಳೆಯ ದಿನ. ಮುಖ್ಯ ಕೆಲಸವನ್ನು ಅಭಿಜಿತ್ ಸಮಯದಲ್ಲಿ ಆರಂಭಿಸಿ; ರಾಹುಕಾಲ ತಪ್ಪಿಸಿ.", "Today the Moon is in the 10th house from your rashi — a good day for work. Start important tasks during Abhijit and avoid Rahu Kalam.")}</p>${dlBtn(L, false)}</div></div></section>`;
const dlSection = (L) => `<section class="dl wrap"><img src="/assets/logo.webp" alt="${T(L, "ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್ ಲೋಗೋ", "Namma Panchanga app logo")}" width="211" height="72" loading="lazy"><h2 class="disp">${T(L, "ಆ್ಯಪ್ ಉಚಿತವಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ", "Download the free app")}</h2><p class="meta">ಕನ್ನಡ · English · 110+ ${T(L, "ಊರುಗಳು · ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ", "towns · works offline")}</p>${dlBtn(L, true)}</section>`;
function phone(L, d) {
  if (!d) return "";
  return `<div class="glow" aria-hidden="true"><div class="phone"><div class="scr"><div class="island"></div>
  <div class="sbar"><span>${short(d.sunrise + 180)}</span><span>▂▄▆ ▮</span></div>
  <div class="app"><img src="/assets/logo-180.webp" alt="" width="90" height="31">
  <div class="hcard"><small>${esc(dateStr(L, d.iso, d.w))}</small><div class="t disp">${esc(paksha(L, d.paksha))} ${esc(nm(L, d.tithi))}</div><small>${esc(nm(L, d.nak))} · ${esc(nm(L, d.yoga))}</small></div>
  <div class="alert">● ${T(L, "ರಾಹುಕಾಲ", "Rahu Kalam")} ${short(d.rahu[0])} – ${short(d.rahu[1])}</div>
  <div class="tiles"><div class="tai">✨<br>${T(L, "ಜ್ಯೋತಿಷಿ AI", "Jyotishi AI")}</div><div>☀️<br>${T(L, "ಕುಂಡಲಿ", "Kundli")}</div><div>🕐<br>${T(L, "ಮುಹೂರ್ತ", "Muhurta")}</div><div>▦<br>${T(L, "ಪರಿಕರ", "Tools")}</div></div>
  <div class="alert">✨ ${T(L, "ಇಂದು ನನಗೆ ಹೇಗಿದೆ? →", "How is today for me? →")}</div></div>
  <div class="tabbar"><span class="on">☀️<br>${T(L, "ಇಂದು", "Today")}</span><span>📅<br>${T(L, "ಕ್ಯಾಲೆಂಡರ್", "Calendar")}</span><span>🪔<br>${T(L, "ಹಬ್ಬಗಳು", "Festivals")}</span><span>▦<br>${T(L, "ಪರಿಕರ", "Tools")}</span></div></div></div></div>`;
}
const weekList = (L, townId, from) => {
  const out = []; for (let i = 1; i <= 7; i++) { const x = addDays(from, i); if (days(townId)[x]) out.push(x); }
  return `<h2 class="sub disp">${T(L, "ಮುಂದಿನ 7 ದಿನಗಳು", "Next 7 days")}</h2><ul class="list">${out.map((x) => { const y = day(townId, x); return `<li><a href="${P(L, `/panchanga/${townId}/${x}/`)}">${esc(dateStr(L, x, y.w))}<small>${esc(nm(L, y.tithi))}${y.fest.length ? " · " + esc(y.fest.map((i) => nm(L, i)).join(", ")) : ""}</small></a></li>`; }).join("")}</ul>`;
};

// ---------- pages ----------
function pageHome(site, L, today) {
  const d = day("bengaluru", today);
  const ka = TOWNS.filter((t) => t.ka).length;
  const body = `<section class="hero"><div class="wrap grid2">
  <div><h1 class="disp">${T(L, "ಕನ್ನಡದ ಸಂಪೂರ್ಣ ಪಂಚಾಂಗ", "Kannada Panchanga for today")}</h1>
  <p class="lead">${T(L, "ನಿಮ್ಮ ಊರಿನ ಇಂದಿನ ತಿಥಿ, ನಕ್ಷತ್ರ ಮತ್ತು ರಾಹುಕಾಲ ಇಲ್ಲಿ ಉಚಿತ. ಕುಂಡಲಿ, ಭವಿಷ್ಯ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI — ಆ್ಯಪ್‌ನಲ್ಲಿ.", "Today's tithi, nakshatra, Rahu Kalam (Rahu Kaal) and festivals for your town in Karnataka — free. Kundli, horoscope and Jyotishi AI in the app.")}</p>
  ${clockBox(L, today)}
  ${d ? card(L, "bengaluru", d, true) : ""}</div>
  <div class="side">${phone(L, d)}${dlBtn(L, true)}</div>
</div></section>
<section class="s wrap"><h2 class="disp">${T(L, "ನಿಮ್ಮ ಊರಿನ ಪಂಚಾಂಗ", "Panchang for your town")}</h2><p class="meta">${T(L, `ಕರ್ನಾಟಕದ ${ka} ಊರುಗಳು ಮತ್ತು ಪ್ರಮುಖ ನಗರಗಳು`, `${ka} towns in Karnataka and major cities`)}</p>${townGrid(L)}</section>
<section class="s wrap"><div class="sh"><h2 class="disp">${T(L, "ಮುಂದಿನ ಹಬ್ಬಗಳು", "Upcoming festivals")}</h2><a class="more" href="${P(L, "/festivals/")}">${T(L, "ಎಲ್ಲಾ ಹಬ್ಬಗಳು →", "All festivals →")}</a></div>${festList(L, "bengaluru", nextFestivals("bengaluru", today, 6))}</section>
${featSection(L)}${aiBanner(L)}${dlSection(L)}`;
  return layout(site, L, {
    path: "/",
    title: T(L, "ನಮ್ಮ ಪಂಚಾಂಗ — ಇಂದಿನ ಕನ್ನಡ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ, ತಿಥಿ, ಹಬ್ಬಗಳು", "Kannada Panchang Today — Rahu Kalam, Tithi, Nakshatra, Festivals | Namma Panchanga"),
    desc: T(L, `ಇಂದಿನ ಕನ್ನಡ ಪಂಚಾಂಗ: ತಿಥಿ, ನಕ್ಷತ್ರ, ರಾಹುಕಾಲ, ಯಮಗಂಡ, ಗುಳಿಕ, ಅಭಿಜಿತ್ ಮತ್ತು ಹಬ್ಬಗಳು — ಕರ್ನಾಟಕದ ${TOWNS.length} ಊರುಗಳಿಗೆ.`, `Today's Kannada panchang for Bengaluru (Bangalore), Mysuru (Mysore) and ${TOWNS.length} towns: tithi, nakshatra, Rahu Kalam, Yamagandam, Gulika, Abhijit muhurta and festivals.`),
    body, schema: [{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME(L), url: site + P(L, "/"), inLanguage: L, publisher: { "@id": site + "/#org" } }, appSchema(site, L)],
    script: clock(L),
  });
}
function pageTowns(site, L) {
  const ka = TOWNS.filter((t) => t.ka).length;
  return layout(site, L, {
    path: "/panchanga/",
    title: T(L, "ಎಲ್ಲಾ ಊರುಗಳ ಇಂದಿನ ಪಂಚಾಂಗ — ಕರ್ನಾಟಕ | ನಮ್ಮ ಪಂಚಾಂಗ", "Panchang Today for Every Town in Karnataka | Namma Panchanga"),
    desc: T(L, `ಕರ್ನಾಟಕದ ${ka} ಊರುಗಳು ಮತ್ತು ಪ್ರಮುಖ ನಗರಗಳ ಇಂದಿನ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ ಮತ್ತು ಸೂರ್ಯೋದಯ.`, `Choose your town: today's panchang, Rahu Kalam and sunrise for ${ka} towns in Karnataka — Bangalore, Mysore, Mangalore, Hubli and more — plus major Indian cities.`),
    crumbs: [[T(L, "ಊರುಗಳು", "Towns"), P(L, "/panchanga/")]],
    body: `<section class="s wrap"><h1 class="disp">${T(L, "ನಿಮ್ಮ ಊರಿನ ಪಂಚಾಂಗ", "Panchang for your town")}</h1><p class="lead">${T(L, "ಊರು ಆಯ್ಕೆ ಮಾಡಿ — ಸೂರ್ಯೋದಯ, ರಾಹುಕಾಲ ಮತ್ತು ತಿಥಿ ಸಮಯಗಳು ಊರಿನಿಂದ ಊರಿಗೆ ಬದಲಾಗುತ್ತವೆ.", "Pick your town — sunrise, Rahu Kalam and tithi times change from town to town.")}</p>${townGrid(L)}</section>${dlSection(L)}`,
  });
}
function pageToday(site, L, townId, today) {
  const t = TOWN[townId], d = day(townId, today); if (!d) return null;
  const body = `<section class="s wrap"><div class="grid2"><div>
  <h1 class="disp">${esc(T(L, `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ`, `${townName(L, t)} Panchang Today`))}</h1><p class="lead">${esc(dateStr(L, today, d.w))}${L === "kn" ? ` · ${esc(t.en)} panchanga today` : ""}</p>
  ${clockBox(L, today)}
  ${card(L, townId, d, true, { title: dateStr(L, today, d.w) })}
  <nav class="pn" aria-label="${T(L, "ದಿನಗಳು", "Days")}"><a href="${P(L, `/panchanga/${townId}/${addDays(today, -1)}/`)}">← ${T(L, "ನಿನ್ನೆ", "Yesterday")}</a><a href="${P(L, `/panchanga/${townId}/${today.slice(0, 7)}/`)}">${T(L, "ಈ ತಿಂಗಳ ಕ್ಯಾಲೆಂಡರ್", "This month's calendar")}</a><a href="${P(L, `/panchanga/${townId}/${addDays(today, 1)}/`)}">${T(L, "ನಾಳೆ", "Tomorrow")} →</a></nav>
  ${summary(L, townId, d)}</div>
  <aside>${weekList(L, townId, today)}${dlBtn(L, false)}</aside></div></section>
<section class="s wrap"><div class="sh"><h2 class="disp">${esc(townShort(L, t))} — ${T(L, "ಮುಂದಿನ ಹಬ್ಬಗಳು", "upcoming festivals")}</h2><a class="more" href="${P(L, "/festivals/")}">${T(L, "ಎಲ್ಲಾ ಹಬ್ಬಗಳು →", "All festivals →")}</a></div>${festList(L, townId, nextFestivals(townId, today, 6))}</section>
<section class="s wrap"><h2 class="disp">${T(L, "ಇತರ ಊರುಗಳು", "Other towns")}</h2>${townGrid(L, townId)}</section>`;
  return layout(site, L, {
    path: `/panchanga/${townId}/`,
    title: T(L, `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ — ರಾಹುಕಾಲ, ತಿಥಿ, ನಕ್ಷತ್ರ | ${t.en} Panchanga Today`, `${townName(L, t)} Panchang Today — Rahu Kalam, Tithi, Nakshatra`),
    desc: T(L, `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ: ತಿಥಿ, ನಕ್ಷತ್ರ, ಯೋಗ, ಕರಣ, ಸೂರ್ಯೋದಯ, ರಾಹುಕಾಲ, ಯಮಗಂಡ, ಗುಳಿಕ ಮತ್ತು ಅಭಿಜಿತ್ ಸಮಯ.`, `Today's panchang for ${townName(L, t)}: tithi, nakshatra, yoga, karana, sunrise, sunset, Rahu Kalam (Rahu Kaal), Yamagandam, Gulika and Abhijit muhurta timings.`),
    crumbs: [[T(L, "ಊರುಗಳು", "Towns"), P(L, "/panchanga/")], [townShort(L, t), P(L, `/panchanga/${townId}/`)]],
    body, script: clock(L),
  });
}
function pageDay(site, L, townId, iso) {
  const t = TOWN[townId], d = day(townId, iso);
  const prev = addDays(iso, -1), next = addDays(iso, 1), ym = iso.slice(0, 7), { y, m } = parts(iso);
  const fest = d.fest.map((i) => nm(L, i)).join(", ");
  const body = `<section class="s wrap"><div class="grid2"><div>
  ${card(L, townId, d, false, { h1: true, title: T(L, `${t.kn} ಪಂಚಾಂಗ — ${dateStr(L, iso, d.w)}`, `${townName(L, t)} Panchang — ${dateStr(L, iso, d.w)}`) })}
  <nav class="pn" aria-label="${T(L, "ದಿನಗಳು", "Days")}">${days(townId)[prev] ? `<a href="${P(L, `/panchanga/${townId}/${prev}/`)}" rel="prev">← ${esc(dateStr(L, prev))}</a>` : "<span></span>"}<a href="${P(L, `/panchanga/${townId}/${ym}/`)}">${esc(T(L, `${month(L, m)} ತಿಂಗಳ ಕ್ಯಾಲೆಂಡರ್`, `${month(L, m)} calendar`))}</a>${days(townId)[next] ? `<a href="${P(L, `/panchanga/${townId}/${next}/`)}" rel="next">${esc(dateStr(L, next))} →</a>` : "<span></span>"}</nav>
  ${summary(L, townId, d)}</div>
  <aside>${weekList(L, townId, iso)}<p><a class="more" href="${P(L, `/panchanga/${townId}/`)}">${esc(T(L, `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ →`, `${t.en} panchang today →`))}</a></p>${dlBtn(L, false)}</aside></div></section>
<section class="s wrap"><h2 class="disp">${T(L, "ಇತರ ಊರುಗಳು", "Other towns")}</h2>${townGrid(L, townId)}</section>`;
  return layout(site, L, {
    path: `/panchanga/${townId}/${iso}/`,
    title: T(L, `${t.kn} ಪಂಚಾಂಗ ${dateStr(L, iso)} (${vara(L, d.w)})${fest ? " — " + fest : ""} | ರಾಹುಕಾಲ, ತಿಥಿ`, `${townName(L, t)} Panchang ${dateStr(L, iso)} (${vara(L, d.w)})${fest ? " — " + fest : ""} | Rahu Kalam`),
    desc: T(L, `${dateStr(L, iso, d.w)} ${t.kn} ಪಂಚಾಂಗ: ತಿಥಿ ${nm(L, d.tithi)}, ನಕ್ಷತ್ರ ${nm(L, d.nak)}, ರಾಹುಕಾಲ ${time(L, d.rahu[0])}–${time(L, d.rahu[1])}, ಸೂರ್ಯೋದಯ ${time(L, d.sunrise)}.${fest ? " " + fest + "." : ""}`,
      `${townName(L, t)} panchang for ${dateStr(L, iso, d.w)}: tithi ${nm(L, d.tithi)}, nakshatra ${nm(L, d.nak)}, Rahu Kalam ${time(L, d.rahu[0])} – ${time(L, d.rahu[1])}, sunrise ${time(L, d.sunrise)}.${fest ? " Festival: " + fest + "." : ""}`),
    crumbs: [[T(L, "ಊರುಗಳು", "Towns"), P(L, "/panchanga/")], [townShort(L, t), P(L, `/panchanga/${townId}/`)], [`${month(L, m)} ${y}`, P(L, `/panchanga/${townId}/${ym}/`)], [dateStr(L, iso), P(L, `/panchanga/${townId}/${iso}/`)]],
    body,
  });
}
function pageMonth(site, L, townId, ym, today) {
  const t = TOWN[townId], [y, m] = ym.split("-").map(Number);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate(), first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<td class="empty"></td>');
  for (let dd = 1; dd <= dim; dd++) {
    const iso = `${ym}-${String(dd).padStart(2, "0")}`, x = day(townId, iso);
    cells.push(x ? `<td${iso === today ? ' class="today"' : ""}><a href="${P(L, `/panchanga/${townId}/${iso}/`)}"><b>${dd}</b><small>${esc(nm(L, x.tithi))}</small>${x.fest.length ? `<em>${esc(nm(L, x.fest[0]))}</em>` : ""}</a></td>` : `<td class="empty"><b>${dd}</b></td>`);
  }
  while (cells.length % 7) cells.push('<td class="empty"></td>');
  const rows = []; for (let i = 0; i < cells.length; i += 7) rows.push("<tr>" + cells.slice(i, i + 7).join("") + "</tr>");
  const pm = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`, nmo = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const has = (k) => !!(days(townId)[k + "-01"] || days(townId)[k + "-28"]);
  const mname = `${month(L, m)} ${y}`;
  const wk = L === "en" ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] : MISC.vara.map((v) => v[0].replace("ವಾರ", ""));
  const body = `<section class="s wrap"><h1 class="disp">${esc(T(L, `${t.kn} ಪಂಚಾಂಗ — ${mname}`, `${townName(L, t)} Panchang — ${mname}`))}</h1><p class="lead">${T(L, "ಪ್ರತಿ ದಿನದ ತಿಥಿ ಮತ್ತು ಹಬ್ಬ. ದಿನದ ಮೇಲೆ ಒತ್ತಿ ಪೂರ್ಣ ಪಂಚಾಂಗ ನೋಡಿ.", "Tithi and festivals for every day. Tap a day for the full panchang, Rahu Kalam and timings.")}</p>
  <div class="calwrap"><table class="cal"><caption class="sr">${esc(townShort(L, t))} ${esc(mname)}</caption><thead><tr>${wk.map((v) => `<th scope="col">${esc(v)}</th>`).join("")}</tr></thead><tbody>${rows.join("")}</tbody></table></div>
  <nav class="pn" aria-label="${T(L, "ತಿಂಗಳುಗಳು", "Months")}">${has(pm) ? `<a href="${P(L, `/panchanga/${townId}/${pm}/`)}" rel="prev">← ${esc(month(L, ((m + 10) % 12) + 1))}</a>` : "<span></span>"}<a href="${P(L, `/panchanga/${townId}/`)}">${esc(T(L, `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ`, `${t.en} panchang today`))}</a>${has(nmo) ? `<a href="${P(L, `/panchanga/${townId}/${nmo}/`)}" rel="next">${esc(month(L, (m % 12) + 1))} →</a>` : "<span></span>"}</nav></section>${dlSection(L)}`;
  return layout(site, L, {
    path: `/panchanga/${townId}/${ym}/`,
    title: T(L, `${t.kn} ಪಂಚಾಂಗ ${mname} — ತಿಥಿ ಮತ್ತು ಹಬ್ಬಗಳ ಕ್ಯಾಲೆಂಡರ್`, `${townName(L, t)} Panchang Calendar ${mname} — Tithi and Festivals`),
    desc: T(L, `${t.kn} ${mname} ಕನ್ನಡ ಪಂಚಾಂಗ ಕ್ಯಾಲೆಂಡರ್: ಪ್ರತಿ ದಿನದ ತಿಥಿ, ಹಬ್ಬ ಮತ್ತು ವ್ರತ.`, `Kannada panchang calendar for ${townName(L, t)}, ${mname}: tithi, festivals and vratas for every day.`),
    crumbs: [[T(L, "ಊರುಗಳು", "Towns"), P(L, "/panchanga/")], [townShort(L, t), P(L, `/panchanga/${townId}/`)], [mname, P(L, `/panchanga/${townId}/${ym}/`)]],
    body,
  });
}
function pageFestivals(site, L, today) {
  const byMonth = {};
  nextFestivals("bengaluru", today, 400).forEach((d) => { const k = d.iso.slice(0, 7); (byMonth[k] = byMonth[k] || []).push(d); });
  const body = `<section class="s wrap"><h1 class="disp">${T(L, "ಕನ್ನಡ ಹಬ್ಬಗಳು ಮತ್ತು ವ್ರತಗಳು", "Kannada festivals and vratas")}</h1><p class="lead">${T(L, "ಯುಗಾದಿ, ಗಣೇಶ ಚತುರ್ಥಿ, ನವರಾತ್ರಿ, ದೀಪಾವಳಿ, ಸಂಕ್ರಾಂತಿ, ಏಕಾದಶಿ, ಸಂಕಷ್ಟಿ — ಬೆಂಗಳೂರು ಸಮಯದ ಪ್ರಕಾರ.", "Ugadi, Ganesha Chaturthi, Navaratri, Deepavali, Sankranti, Ekadashi, Sankashti and more — dates for Bengaluru (Bangalore).")}</p>
  ${Object.keys(byMonth).map((k) => { const [y, m] = k.split("-").map(Number); return `<h2 class="sub disp">${esc(month(L, m))} ${y}</h2>${festList(L, "bengaluru", byMonth[k])}`; }).join("")}
  <p class="meta">${T(L, "ದಿನಾಂಕಗಳು ಬೆಂಗಳೂರು ಸೂರ್ಯೋದಯದ ಪ್ರಕಾರ; ನಿಮ್ಮ ಊರಿಗೆ ಹಬ್ಬದ ಜ್ಞಾಪನೆ ಆ್ಯಪ್‌ನಲ್ಲಿ.", "Dates follow Bengaluru sunrise; festival reminders for your own town are in the app.")}</p></section>${dlSection(L)}`;
  return layout(site, L, {
    path: "/festivals/",
    title: T(L, "ಕನ್ನಡ ಹಬ್ಬಗಳ ಪಟ್ಟಿ — ದೀಪಾವಳಿ, ಏಕಾದಶಿ, ಸಂಕಷ್ಟಿ ದಿನಾಂಕಗಳು", "Kannada Festival Calendar — Deepavali, Ekadashi, Sankashti Dates"),
    desc: T(L, "ಮುಂದಿನ ಎಲ್ಲಾ ಕನ್ನಡ ಹಬ್ಬಗಳು ಮತ್ತು ವ್ರತಗಳ ದಿನಾಂಕಗಳು — ಏಕಾದಶಿ, ಸಂಕಷ್ಟಿ, ಹುಣ್ಣಿಮೆ, ಅಮಾವಾಸ್ಯೆ ಸೇರಿದಂತೆ.", "Dates of upcoming Kannada and Hindu festivals and vratas in Karnataka: Deepavali, Ekadashi, Sankashti Chaturthi, Hunnime (Purnima), Amavasya and more."),
    crumbs: [[T(L, "ಹಬ್ಬಗಳು", "Festivals"), P(L, "/festivals/")]], body,
  });
}
function pageRashi(site, L) {
  const body = `<section class="s wrap"><h1 class="disp">${T(L, "ಇಂದಿನ ರಾಶಿ ಭವಿಷ್ಯ", "Today's Rashi Bhavishya (horoscope)")}</h1><p class="lead">${T(L, "12 ರಾಶಿಗಳ ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷ ಭವಿಷ್ಯ — ಕೆಲಸ, ಹಣ, ಕುಟುಂಬ ಮತ್ತು ಆರೋಗ್ಯ. ಪೂರ್ಣ ಭವಿಷ್ಯ ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್‌ನಲ್ಲಿ ಉಚಿತ.", "Daily, monthly and yearly horoscope for all 12 rashis — work, money, family and health, in Kannada or English. Free in the Namma Panchanga app.")}</p>
  <ul class="rashis">${MISC.rashi.map((r) => `<li><a href="${P(L, "/app/")}"><b>${esc(r[li(L)])}</b><small>${esc(r[L === "en" ? 0 : 1])}</small><span>${T(L, "ಇಂದಿನ ಭವಿಷ್ಯ ಆ್ಯಪ್‌ನಲ್ಲಿ", "Today's horoscope in the app")}</span></a></li>`).join("")}</ul></section>${featSection(L)}${dlSection(L)}`;
  return layout(site, L, {
    path: "/rashi-bhavishya/",
    title: T(L, "ಇಂದಿನ ರಾಶಿ ಭವಿಷ್ಯ — 12 ರಾಶಿಗಳ ದಿನ ಭವಿಷ್ಯ ಕನ್ನಡದಲ್ಲಿ", "Rashi Bhavishya Today — Daily Horoscope for 12 Rashis in Kannada and English"),
    desc: T(L, "ಮೇಷದಿಂದ ಮೀನದವರೆಗೆ 12 ರಾಶಿಗಳ ಇಂದಿನ, ಈ ತಿಂಗಳ ಮತ್ತು ಈ ವರ್ಷದ ಭವಿಷ್ಯ ಕನ್ನಡದಲ್ಲಿ — ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್‌ನಲ್ಲಿ.", "Today's horoscope for Mesha to Meena (Aries to Pisces) in Kannada and English — daily, monthly and yearly rashi bhavishya in the Namma Panchanga app."),
    crumbs: [[T(L, "ರಾಶಿ ಭವಿಷ್ಯ", "Horoscope"), P(L, "/rashi-bhavishya/")]], body,
  });
}
function pageAi(site, L) {
  const qs = L === "en" ? ["Will I get a job change this year?", "When will I get married?", "What should I do during Sade Sati?", "How is today for me?", "What does my current dasha bring?"] : ["ಈ ವರ್ಷ ಉದ್ಯೋಗ ಬದಲಾವಣೆ ಸಾಧ್ಯವೇ?", "ನನ್ನ ಮದುವೆ ಯಾವಾಗ ಆಗಬಹುದು?", "ಸಾಡೇಸಾತಿಯಲ್ಲಿ ಏನು ಮಾಡಬೇಕು?", "ಇಂದು ನನಗೆ ಹೇಗಿದೆ?", "ಈಗಿನ ದಶೆಯ ಫಲ ಏನು?"];
  const body = `<section class="s wrap"><h1 class="disp">${T(L, "ಜ್ಯೋತಿಷಿ AI — ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲೇ ಕೇಳಿ", "Jyotishi AI — an AI astrologer for your kundli")}</h1>
  <p class="lead">${T(L, "ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿ, ದಶೆ, ಗ್ರಹ ಸಂಚಾರ ಮತ್ತು ಇಂದಿನ ಪಂಚಾಂಗ ನೋಡಿ ಸರಳ ಕನ್ನಡ ಅಥವಾ English ನಲ್ಲಿ ಉತ್ತರ. ದಿನಕ್ಕೆ 2 ಪ್ರಶ್ನೆ ಉಚಿತ (ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಒಂದು ಚಿಕ್ಕ ಜಾಹೀರಾತು). Pro: ತಿಂಗಳಿಗೆ 50 ಪ್ರಶ್ನೆ, ಜಾಹೀರಾತು ಇಲ್ಲದೆ.", "Answers based on your birth chart, dasha, transits and today's panchanga — in simple Kannada or English. 2 free questions a day (one short ad each). Pro: 50 questions a month without ads.")}</p>
  <h2 class="sub disp">${T(L, "ಹೀಗೆ ಕೇಳಬಹುದು", "Questions you can ask")}</h2><ul class="list">${qs.map((q) => `<li><span>💬 ${esc(q)}</span></li>`).join("")}</ul>
  <p class="meta">${T(L, "AI ಉತ್ತರಗಳು ಸಾಂಪ್ರದಾಯಿಕ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ; ಮುಖ್ಯ ನಿರ್ಧಾರಗಳಿಗೆ ಕುಟುಂಬದ ಜ್ಯೋತಿಷಿಗಳ ಸಲಹೆ ಪಡೆಯಿರಿ.", "AI answers are traditional guidance only; for important decisions, consult your family astrologer.")}</p></section>${aiBanner(L)}${dlSection(L)}`;
  return layout(site, L, {
    path: "/jyotishi-ai/",
    title: T(L, "ಜ್ಯೋತಿಷಿ AI — ಕನ್ನಡ AI ಜ್ಯೋತಿಷಿ, ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ಕೇಳಿ", "Jyotishi AI — Kannada AI Astrologer: Ask About Your Kundli"),
    desc: T(L, "ಜ್ಯೋತಿಷಿ AI: ಉದ್ಯೋಗ, ಮದುವೆ, ಸಾಡೇಸಾತಿ, ದಶೆ ಮತ್ತು ಇಂದಿನ ದಿನದ ಬಗ್ಗೆ ನಿಮ್ಮ ಜಾತಕ ನೋಡಿ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ. ದಿನಕ್ಕೆ 2 ಪ್ರಶ್ನೆ ಉಚಿತ.", "Ask an AI astrologer about career, marriage, Sade Sati, dasha and today — answers from your own kundli in Kannada or English. 2 free questions a day."),
    crumbs: [[T(L, "ಜ್ಯೋತಿಷಿ AI", "Jyotishi AI"), P(L, "/jyotishi-ai/")]], body,
  });
}
function pageApp(site, L) {
  const body = `<section class="s wrap"><h1 class="disp">${T(L, "ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್", "The Namma Panchanga app")}</h1><p class="lead">${T(L, "ಕನ್ನಡ ಪಂಚಾಂಗ, ಗೌರಿ ಪಂಚಾಂಗ, ಜನ್ಮ ಕುಂಡಲಿ, ರಾಶಿ ಭವಿಷ್ಯ, ವಿವಾಹ ಹೊಂದಾಣಿಕೆ, ಮುಹೂರ್ತ, ಹಬ್ಬಗಳ ಜ್ಞಾಪನೆ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI — ಒಂದೇ ಆ್ಯಪ್‌ನಲ್ಲಿ. Android ಗೆ ಉಚಿತ.", "Kannada panchang, Gowri panchanga, janma kundli, rashi bhavishya, marriage matching, muhurta, festival reminders and Jyotishi AI — in one app, in Kannada or English. Free for Android.")}</p>${dlBtn(L, true)}</section>${featSection(L)}${aiBanner(L)}`;
  return layout(site, L, {
    path: "/app/",
    title: T(L, "ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ — ಕನ್ನಡ ಪಂಚಾಂಗ, ಕುಂಡಲಿ, ಜ್ಯೋತಿಷಿ AI", "Namma Panchanga App — Kannada Panchang, Kundli and AI Astrologer for Android"),
    desc: T(L, "ನಮ್ಮ ಪಂಚಾಂಗ Android ಆ್ಯಪ್: ಕನ್ನಡ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ, ಗೌರಿ ಪಂಚಾಂಗ, ಜನ್ಮ ಕುಂಡಲಿ, ರಾಶಿ ಭವಿಷ್ಯ, ವಿವಾಹ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI. Google Play ನಲ್ಲಿ ಉಚಿತ.", "Free Android app: Kannada panchang, Rahu Kalam alerts, Gowri panchanga, kundli, horoscope, marriage matching and Jyotishi AI. Download on Google Play."),
    crumbs: [[T(L, "ಆ್ಯಪ್", "App"), P(L, "/app/")]], body, schema: [appSchema(site, L)],
  });
}
function legalDoc(t) {
  return t.trim().split("\n\n").map((block) => {
    let lines = block.trim().split("\n"); let out = "";
    if (/^\d+\. [A-Z]/.test(lines[0])) { out += `<h2>${esc(lines[0])}</h2>`; lines = lines.slice(1); }
    const bul = lines.filter((l) => l.startsWith("• ")).map((l) => l.slice(2)), txt = lines.filter((l) => !l.startsWith("• "));
    if (txt.length) out += `<p>${txt.map(esc).join("<br>")}</p>`;
    if (bul.length) out += `<ul>${bul.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>`;
    return out;
  }).join("\n");
}
function pageLegal(site, which) {
  const terms = which === "terms", p = terms ? "/terms/" : "/privacy/", name = terms ? "Terms of Service" : "Privacy Policy";
  return layout(site, "en", {
    path: p, single: true, title: `${name} — Namma Panchanga (ನಮ್ಮ ಪಂಚಾಂಗ)`,
    desc: terms ? "Terms of Service for the Namma Panchanga app and website: Jyotishi AI, Pro subscriptions, question packs and disclaimers." : "Privacy Policy for the Namma Panchanga app and website: what is stored on your phone, Jyotishi AI, ads, analytics and payments.",
    crumbs: [[name, p]],
    body: `<article class="s wrap legal"><h1 class="disp">${name}</h1><p class="meta">Effective date: 5 November 2026</p>${legalDoc(terms ? TERMS_TXT : PRIVACY_TXT)}</article>`,
  });
}
function page404(site, L) {
  return layout(site, L, {
    path: "/404/", single: true, title: T(L, "ಪುಟ ಸಿಗಲಿಲ್ಲ — ನಮ್ಮ ಪಂಚಾಂಗ", "Page not found — Namma Panchanga"), desc: T(L, "ಈ ಪುಟ ಲಭ್ಯವಿಲ್ಲ.", "This page does not exist."),
    body: `<section class="s wrap"><h1 class="disp">${T(L, "ಪುಟ ಸಿಗಲಿಲ್ಲ", "Page not found")}</h1><p class="lead"><a class="more" href="${P(L, "/")}">${T(L, "ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ", "Go to the home page")}</a> · <a class="more" href="${P(L, "/panchanga/")}">${T(L, "ನಿಮ್ಮ ಊರಿನ ಪಂಚಾಂಗ", "Panchang for your town")}</a></p></section>`,
  }).replace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">', '<meta name="robots" content="noindex">');
}

// ---------- sitemap and robots ----------
function sitemap(site, today) {
  const out = [];
  const add = (p, freq, pri, lastmod) => {
    for (const L of ["kn", "en"]) {
      const self = P(L, p);
      out.push(`<url><loc>${site}${self}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${freq}</changefreq><priority>${pri}</priority></url>`);
    }
  };
  add("/", "daily", "1.0", today); add("/panchanga/", "weekly", "0.8"); add("/festivals/", "weekly", "0.8", today);
  add("/rashi-bhavishya/", "monthly", "0.6"); add("/jyotishi-ai/", "monthly", "0.6"); add("/app/", "monthly", "0.7");
  out.push(`<url><loc>${site}/terms/</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>`, `<url><loc>${site}/privacy/</loc><changefreq>yearly</changefreq><priority>0.2</priority></url>`);
  for (const t of TOWNS) {
    add(`/panchanga/${t.id}/`, "daily", t.ka ? "0.9" : "0.7", today);
    const months = new Set();
    for (const iso of ALL_DATES) { months.add(iso.slice(0, 7)); add(`/panchanga/${t.id}/${iso}/`, "monthly", "0.5"); }
    for (const ym of months) add(`/panchanga/${t.id}/${ym}/`, "monthly", "0.6");
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${out.join("\n")}\n</urlset>`;
}
function robots(site) {
  return `# Namma Panchanga — all search engines and AI search bots are welcome
User-agent: *
Allow: /

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: ChatGPT-User
Allow: /

Sitemap: ${site}/sitemap.xml
`;
}

// ---------- router ----------
function render(rawPath, site, now) {
  const today0 = istToday(now);
  const today = today0 < FIRST ? FIRST : today0 > LAST ? LAST : today0;
  const secsToMidnight = Math.max(60, Math.floor((Date.parse(addDays(today0, 1) + "T00:00:00+05:30") - now) / 1000));
  const daily = `public, max-age=300, s-maxage=${secsToMidnight}`;
  const stable = "public, max-age=3600, s-maxage=604800";
  const html = (body, cache) => ({ status: 200, type: "text/html; charset=utf-8", body, cache });
  let p = rawPath.split("?")[0];
  try { p = decodeURIComponent(p); } catch (e) { /* keep as is */ }
  if (p === "/robots.txt") return { status: 200, type: "text/plain; charset=utf-8", body: robots(site), cache: "public, max-age=3600, s-maxage=86400" };
  if (p === "/sitemap.xml") return { status: 200, type: "application/xml; charset=utf-8", body: sitemap(site, today), cache: daily };
  if (!p.endsWith("/")) return { status: 301, location: p + "/", cache: "public, max-age=86400" }; // one hop, never a chain
  let L = "kn";
  if (p === "/en/" || p.startsWith("/en/")) { L = "en"; p = p.slice(3) || "/"; }
  const seg = p.split("/").filter(Boolean);
  if (seg.length === 0) return html(pageHome(site, L, today), daily);
  if (seg[0] === "panchanga") {
    if (seg.length === 1) return html(pageTowns(site, L), stable);
    const town = TOWN[seg[1]];
    if (town) {
      if (seg.length === 2) { const r = pageToday(site, L, town.id, today); if (r) return html(r, daily); }
      if (seg.length === 3 && /^\d{4}-\d{2}$/.test(seg[2]) && (days(town.id)[seg[2] + "-01"] || days(town.id)[seg[2] + "-28"])) return html(pageMonth(site, L, town.id, seg[2], today), daily);
      if (seg.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(seg[2]) && days(town.id)[seg[2]]) return html(pageDay(site, L, town.id, seg[2]), stable);
    }
  }
  if (seg.length === 1) {
    if (seg[0] === "festivals") return html(pageFestivals(site, L, today), daily);
    if (seg[0] === "rashi-bhavishya") return html(pageRashi(site, L), stable);
    if (seg[0] === "jyotishi-ai") return html(pageAi(site, L), stable);
    if (seg[0] === "app") return html(pageApp(site, L), stable);
    if ((seg[0] === "terms" || seg[0] === "privacy") && L === "kn") return html(pageLegal(site, seg[0]), stable);
  }
  return { status: 404, type: "text/html; charset=utf-8", body: page404(site, L), cache: "public, max-age=300" };
}

export { render, sitemap, robots, TOWNS, ALL_DATES };
