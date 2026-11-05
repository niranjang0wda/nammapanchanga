/**
 * Namma Panchanga website — every page is rendered on the server (fast, complete HTML for Google and AI search bots).
 * Data comes from the app's own panchanga engine (site/data/*.json, generated for each town and day).
 *
 * Routes (all end with "/"):
 *   /                                  home (today in Bengaluru, towns, festivals, app)
 *   /panchanga/                        all towns
 *   /panchanga/{town}/                 today's panchanga for a town
 *   /panchanga/{town}/{yyyy-mm}/       month calendar (links to every day)
 *   /panchanga/{town}/{yyyy-mm-dd}/    panchanga for one day
 *   /festivals/  /rashi-bhavishya/  /jyotishi-ai/  /app/  /terms/  /privacy/
 *   /sitemap.xml  /robots.txt
 */
import { DAYS, names as NAMES, misc as MISC, towns as TOWNS } from "./data/index.js";
import CSS from "./css.js";
import { TERMS as TERMS_TXT, PRIVACY as PRIVACY_TXT } from "./legal.js";

const TOWN = Object.fromEntries(TOWNS.map((t) => [t.id, t]));
const days = (id) => DAYS[id];
const ALL_DATES = Object.keys(DAYS.bengaluru).sort();
const FIRST = ALL_DATES[0], LAST = ALL_DATES[ALL_DATES.length - 1];
const PLAY = "https://play.google.com/store/apps/details?id=com.ncaps.nammapanchanga";

// ---------- helpers ----------
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const N = (i) => NAMES[i] || ["", ""];
const kn = (i) => N(i)[0], en = (i) => N(i)[1];
function istToday(now) {
  return new Date(now + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
}
function addDays(iso, n) {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}
function parts(iso) { const [y, m, d] = iso.split("-").map(Number); return { y, m, d }; }
function dateKn(iso, withVara, w) {
  const { y, m, d } = parts(iso);
  return (withVara ? MISC.vara[w][0] + ", " : "") + d + " " + MISC.months[m - 1][0] + " " + y;
}
function dateEn(iso, w) {
  const { y, m, d } = parts(iso);
  return (w != null ? MISC.vara[w][1] + ", " : "") + d + " " + MISC.months[m - 1][1] + " " + y;
}
function period(h) { return h < 4 ? "ರಾತ್ರಿ" : h < 12 ? "ಬೆಳಿಗ್ಗೆ" : h < 16 ? "ಮಧ್ಯಾಹ್ನ" : h < 19 ? "ಸಂಜೆ" : "ರಾತ್ರಿ"; }
function tKn(min) {
  if (min == null) return "—";
  const next = min >= 1440; let mm = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(mm / 60), m = mm % 60, h12 = ((h + 11) % 12) + 1;
  return period(h) + " " + h12 + ":" + String(m).padStart(2, "0") + (next ? " (ನಾಳೆ)" : "");
}
function tEn(min) {
  if (min == null) return "—";
  const next = min >= 1440; let mm = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(mm / 60), m = mm % 60, h12 = ((h + 11) % 12) + 1;
  return h12 + ":" + String(m).padStart(2, "0") + (h < 12 ? " AM" : " PM") + (next ? " (next day)" : "");
}
function short(min) { // "1:30" for boxes
  const mm = ((min % 1440) + 1440) % 1440, h = Math.floor(mm / 60), m = mm % 60;
  return ((h + 11) % 12) + 1 + ":" + String(m).padStart(2, "0");
}
function day(townId, iso) {
  const r = days(townId)[iso]; if (!r) return null;
  return {
    iso, w: r[0], sam: r[1], ayana: r[2], ritu: r[3], masa: r[4], adhika: r[5], paksha: r[6],
    tithi: r[7], tithiEnd: r[8], tithiNext: r[9], nak: r[10], nakEnd: r[11], nakNext: r[12],
    yoga: r[13], yogaEnd: r[14], karana: r[15], sunrise: r[16], sunset: r[17], moonrise: r[18], moonset: r[19],
    rahu: [r[20], r[21]], yama: [r[22], r[23]], gulika: [r[24], r[25]], abhijit: r[26] == null ? null : [r[26], r[27]],
    tithiIdx: r[28], fest: r[29], moon: r[30],
  };
}
function nextFestivals(townId, fromIso, count) {
  const out = []; let iso = fromIso;
  while (out.length < count && iso <= LAST) {
    const d = day(townId, iso);
    if (d && d.fest.length) out.push(d);
    iso = addDays(iso, 1);
  }
  return out;
}

// ---------- shared page parts ----------
const ICON_DL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/></svg>';
function dlBtn(big) {
  return `<a class="dlb${big ? " big" : ""}" href="${PLAY}" rel="noopener">${ICON_DL}<span><b>ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ</b><small>Google Play ನಲ್ಲಿ ಉಚಿತ</small></span></a>`;
}

function layout(site, o) {
  // o: {path, title, desc, h1?, crumbs:[[name,path]], body, schema:[...], noClock}
  const url = site + o.path;
  const crumbs = o.crumbs || [];
  const crumbLd = crumbs.length ? {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: [["ಮುಖಪುಟ", "/"], ...crumbs].map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c[0], item: site + c[1] })),
  } : null;
  const org = {
    "@context": "https://schema.org", "@type": "Organization", "@id": site + "/#org", name: "ನಮ್ಮ ಪಂಚಾಂಗ · Namma Panchanga",
    url: site + "/", logo: site + "/assets/icon-512.png", sameAs: [PLAY],
  };
  const schema = [org, ...(o.schema || []), ...(crumbLd ? [crumbLd] : [])];
  const crumbHtml = crumbs.length ? `<nav class="crumbs wrap" aria-label="Breadcrumb"><ol><li><a href="/">ಮುಖಪುಟ</a></li>${crumbs.map((c, i) => i === crumbs.length - 1 ? `<li aria-current="page">${esc(c[0])}</li>` : `<li><a href="${c[1]}">${esc(c[0])}</a></li>`).join("")}</ol></nav>` : "";
  return `<!doctype html>
<html lang="kn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(o.title)}</title>
<meta name="description" content="${esc(o.desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<link rel="canonical" href="${esc(url)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="ನಮ್ಮ ಪಂಚಾಂಗ">
<meta property="og:title" content="${esc(o.title)}">
<meta property="og:description" content="${esc(o.desc)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:image" content="${site}/assets/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:locale" content="kn_IN">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#5C0A04">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/assets/icon-192.png">
<link rel="preload" href="/assets/noto_kannada_regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/baloo_tamma_extrabold.woff2" as="font" type="font/woff2" crossorigin>
<style>${CSS}</style>
${schema.map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body>
<a class="skip" href="#main">ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ</a>
<header><div class="wrap">
  <a href="/" aria-label="ನಮ್ಮ ಪಂಚಾಂಗ ಮುಖಪುಟ"><img src="/assets/logo.webp" alt="ನಮ್ಮ ಪಂಚಾಂಗ ಲೋಗೋ" width="129" height="44"></a>
  <nav class="main" aria-label="ಮುಖ್ಯ ಮೆನು"><a href="/panchanga/bengaluru/">ಇಂದಿನ ಪಂಚಾಂಗ</a><a href="/panchanga/">ಊರುಗಳು</a><a href="/festivals/">ಹಬ್ಬಗಳು</a><a href="/rashi-bhavishya/">ರಾಶಿ ಭವಿಷ್ಯ</a><a href="/jyotishi-ai/">ಜ್ಯೋತಿಷಿ AI</a></nav>
  <a class="dlb sm" href="/app/">${ICON_DL}<span><b>ಆ್ಯಪ್</b></span></a>
</div></header>
${crumbHtml}
<main id="main">
${o.body}
</main>
<footer><div class="wrap">
  <nav class="fnav" aria-label="ಅಡಿ ಮೆನು">
    <a href="/">ಮುಖಪುಟ</a><a href="/panchanga/">ಎಲ್ಲಾ ಊರುಗಳ ಪಂಚಾಂಗ</a><a href="/festivals/">ಹಬ್ಬಗಳು</a><a href="/rashi-bhavishya/">ರಾಶಿ ಭವಿಷ್ಯ</a><a href="/jyotishi-ai/">ಜ್ಯೋತಿಷಿ AI</a><a href="/app/">ಆ್ಯಪ್</a>
  </nav>
  <div class="fbottom"><span><b>ನಮ್ಮ ಪಂಚಾಂಗ</b> · © ${new Date().getUTCFullYear()}</span><nav aria-label="ನಿಯಮಗಳು"><a href="/terms/">ನಿಯಮಗಳು · Terms of Service</a><a href="/privacy/">ಗೋಪ್ಯತೆ · Privacy Policy</a></nav></div>
</div></footer>
<div class="stick"><a href="${PLAY}" rel="noopener">${ICON_DL}<span>ಆ್ಯಪ್ ಉಚಿತವಾಗಿ ಪಡೆಯಿರಿ</span></a></div>
${o.script || ""}
</body></html>`;
}

// ---------- panchanga card (SSR) ----------
function card(townId, d, today, opts = {}) {
  const t = TOWN[townId];
  const fest = d.fest.concat(d.moon);
  const rows = [
    ["ತಿಥಿ", `${MISC.paksha[d.paksha][0].replace(" ಪಕ್ಷ", "")} ${kn(d.tithi)}`, `${tKn(d.tithiEnd)} ರವರೆಗೆ, ನಂತರ ${kn(d.tithiNext)}`],
    ["ನಕ್ಷತ್ರ", kn(d.nak), `${tKn(d.nakEnd)} ರವರೆಗೆ, ನಂತರ ${kn(d.nakNext)}`],
    ["ಯೋಗ", kn(d.yoga), `${tKn(d.yogaEnd)} ರವರೆಗೆ`],
    ["ಕರಣ", kn(d.karana), ""],
    ["ಸೂರ್ಯೋದಯ · ಸೂರ್ಯಾಸ್ತ", `${tKn(d.sunrise)} · ${tKn(d.sunset)}`, ""],
    ["ಚಂದ್ರೋದಯ · ಚಂದ್ರಾಸ್ತ", `${tKn(d.moonrise)} · ${tKn(d.moonset)}`, ""],
  ];
  const kala = [["ರಾಹುಕಾಲ", d.rahu, "rahu"], ["ಯಮಗಂಡ", d.yama, ""], ["ಗುಳಿಕ", d.gulika, ""]];
  if (d.abhijit) kala.push(["ಅಭಿಜಿತ್ (ಶುಭ)", d.abhijit, "good"]);
  const H = opts.h1 ? "h1" : "h2";
  return `<section class="card" aria-labelledby="pc-${d.iso}">
  <div class="ctop"><div><div class="kick">${today ? "ಇಂದಿನ ಪಂಚಾಂಗ" : "ಪಂಚಾಂಗ"} · ${esc(t.kn)}</div>
    <${H} class="date disp" id="pc-${d.iso}">${esc(opts.title || dateKn(d.iso, true, d.w))}</${H}>
    <p class="meta">${esc(kn(d.sam))} ಸಂವತ್ಸರ · ${esc(kn(d.ayana))} · ${esc(kn(d.ritu))} ಋತು · ${d.adhika ? "ಅಧಿಕ " : ""}${esc(kn(d.masa))} ಮಾಸ · ${esc(MISC.paksha[d.paksha][0])}</p></div>
    ${opts.townLink === false ? "" : `<a class="town" href="/panchanga/">📍 ${esc(t.kn)} ▾</a>`}</div>
  ${fest.length ? `<p class="fest">🪔 ${fest.map((i) => esc(kn(i))).join(" · ")}</p>` : ""}
  <dl class="rows">${rows.map((r) => `<div class="row"><dt>${r[0]}</dt><dd><b>${esc(r[1])}</b>${r[2] ? `<small>${esc(r[2])}</small>` : ""}</dd></div>`).join("")}</dl>
  <div class="kala">${kala.map((k) => `<div class="k ${k[2]}" data-s="${k[1][0]}" data-e="${k[1][1]}"><span class="live">ಈಗ</span><div class="l">${k[0]}</div><div class="v disp">${short(k[1][0])} – ${short(k[1][1])}</div></div>`).join("")}</div>
  <div class="lockbar"><span aria-hidden="true">🔒</span><p><b>ಗೌರಿ ಪಂಚಾಂಗ, ಚೌಘಡಿಯಾ, ಹೋರಾ</b> ಮತ್ತು ಈಗ ನಡೆಯುತ್ತಿರುವ ಶುಭ ಸಮಯ — ಆ್ಯಪ್‌ನಲ್ಲಿ</p><a class="btn-gold" href="/app/">ಆ್ಯಪ್ ನೋಡಿ</a></div>
</section>`;
}
function summary(townId, d) {
  const t = TOWN[townId];
  const kn1 = `${dateKn(d.iso, true, d.w)} ರಂದು ${t.kn}ನಲ್ಲಿ ಸೂರ್ಯೋದಯ ${tKn(d.sunrise)}, ಸೂರ್ಯಾಸ್ತ ${tKn(d.sunset)}. ತಿಥಿ ${kn(d.tithi)} (${tKn(d.tithiEnd)} ರವರೆಗೆ), ನಕ್ಷತ್ರ ${kn(d.nak)}. ರಾಹುಕಾಲ ${tKn(d.rahu[0])} ರಿಂದ ${tKn(d.rahu[1])} ವರೆಗೆ${d.abhijit ? `, ಅಭಿಜಿತ್ ಮುಹೂರ್ತ ${tKn(d.abhijit[0])} – ${tKn(d.abhijit[1])}` : ""}.`;
  const en1 = `Panchanga for ${t.en} on ${dateEn(d.iso, d.w)}: sunrise ${tEn(d.sunrise)}, sunset ${tEn(d.sunset)}; tithi ${en(d.tithi)} until ${tEn(d.tithiEnd)}; nakshatra ${en(d.nak)}; Rahu Kalam ${tEn(d.rahu[0])} – ${tEn(d.rahu[1])}; Yamagandam ${tEn(d.yama[0])} – ${tEn(d.yama[1])}; Gulika ${tEn(d.gulika[0])} – ${tEn(d.gulika[1])}.`;
  return `<section class="note"><p>${esc(kn1)}</p><p lang="en">${esc(en1)}</p></section>`;
}
const CLOCK = `<script>
(function(){var c=document.querySelector('[data-today]');if(!c)return;var iso=c.getAttribute('data-today');
var f=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false,year:'numeric',month:'2-digit',day:'2-digit'});
var ks=[].slice.call(document.querySelectorAll('.k')),el=document.getElementById('clk'),ap=document.getElementById('ampm'),nw=document.getElementById('nowWhat'),nx=document.getElementById('nowNext'),pu=document.getElementById('pulse');
function hm(m){var h=Math.floor(m/60);return (h?h+' ಗಂ ':'')+(m%60)+' ನಿ';}
function name(k){return k.querySelector('.l').textContent;}
function tick(){var p={};f.formatToParts(new Date()).forEach(function(x){p[x.type]=x.value});var H=+p.hour,M=+p.minute,now=H*60+M,same=(p.year+'-'+p.month+'-'+p.day)===iso;
el.textContent=(((H+11)%12)+1)+':'+p.minute+':'+p.second;ap.textContent=H<4?'ರಾತ್ರಿ':H<12?'ಬೆಳಿಗ್ಗೆ':H<16?'ಮಧ್ಯಾಹ್ನ':H<19?'ಸಂಜೆ':'ರಾತ್ರಿ';
var act=null,nxt=null;ks.forEach(function(k){var s=+k.dataset.s,e=+k.dataset.e,on=same&&now>=s&&now<e;k.classList.toggle('active',on);if(on)act=k;if(same&&s>now&&(!nxt||s<+nxt.dataset.s))nxt=k;});
if(!same){nw.textContent='ಈಗ ಭಾರತೀಯ ಸಮಯ';nx.textContent='';pu.classList.remove('bad');}
else if(act){var bad=!act.classList.contains('good');nw.textContent=(bad?'⚠️ ಈಗ ':'✅ ಈಗ ')+name(act)+' ನಡೆಯುತ್ತಿದೆ';nx.textContent=hm(+act.dataset.e-now)+' ನಂತರ ಮುಗಿಯುತ್ತದೆ';pu.classList.toggle('bad',bad);}
else if(nxt){nw.textContent='ಈಗ ಶುಭ ಸಮಯ';nx.textContent=name(nxt)+' '+hm(+nxt.dataset.s-now)+' ನಂತರ';pu.classList.remove('bad');}
else{nw.textContent='ಇಂದಿನ ಕಾಲಗಳು ಮುಗಿದಿವೆ';nx.textContent='';pu.classList.remove('bad');}}
tick();setInterval(tick,1000);})();
</script>`;
function clockBox(iso) {
  return `<div class="clock" data-today="${iso}" aria-live="polite"><span class="pulse" id="pulse"></span><div><span class="time disp" id="clk">--:--:--</span><span class="ampm" id="ampm"></span></div><div class="now"><b id="nowWhat">ಈಗ ಭಾರತೀಯ ಸಮಯ</b><span id="nowNext"></span></div></div>`;
}
function townGrid(current) {
  const ka = TOWNS.filter((t) => t.ka), other = TOWNS.filter((t) => !t.ka);
  const a = (t) => `<a href="/panchanga/${t.id}/"${t.id === current ? ' aria-current="page"' : ""}>${esc(t.kn)}<small>${esc(t.en)}</small></a>`;
  return `<div class="towns">${ka.map(a).join("")}</div><h3 class="sub">ಕರ್ನಾಟಕದ ಹೊರಗೆ</h3><div class="towns">${other.map(a).join("")}</div>`;
}
function festList(townId, list) {
  return `<ul class="fests">${list.map((d) => `<li><a href="/panchanga/${townId}/${d.iso}/"><span class="d disp">${parts(d.iso).d}</span><small>${esc(MISC.months[parts(d.iso).m - 1][0])} · ${esc(MISC.vara[d.w][0])}</small><b>${d.fest.map((i) => esc(kn(i))).join(" · ")}</b></a></li>`).join("")}</ul>`;
}
const FEATS = [["🕐", "ಗೌರಿ ಪಂಚಾಂಗ · ಚೌಘಡಿಯಾ · ಹೋರಾ", "ಈಗ ಯಾವ ಸಮಯ ನಡೆಯುತ್ತಿದೆ"], ["✨", "ಜ್ಯೋತಿಷಿ AI", "ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲೇ ಕೇಳಿ"], ["☀️", "ಜನ್ಮ ಕುಂಡಲಿ", "ರಾಶಿ, ನವಾಂಶ, ದಶೆ, ಯೋಗ, ದೋಷ"], ["🌙", "ರಾಶಿ ಭವಿಷ್ಯ", "ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷ ಭವಿಷ್ಯ"], ["💍", "ವಿವಾಹ ಹೊಂದಾಣಿಕೆ", "ಅಷ್ಟಕೂಟ ಮತ್ತು 10 ಪೊರುತ್ತಂ"], ["🔔", "ಹಬ್ಬ ಮತ್ತು ಶ್ರಾದ್ಧ ಜ್ಞಾಪನೆ", "ತಿಥಿ ಪ್ರಕಾರ ಕುಟುಂಬದ ಜ್ಞಾಪನೆ"]];
const featGrid = () => `<div class="feats">${FEATS.map((f) => `<div class="ft"><span aria-hidden="true">${f[0]}</span><h3>${f[1]}</h3><p>${f[2]}</p></div>`).join("")}</div>`;
const appSchema = (site) => ({
  "@context": "https://schema.org", "@type": "MobileApplication", name: "ನಮ್ಮ ಪಂಚಾಂಗ · Namma Panchanga",
  operatingSystem: "Android", applicationCategory: "LifestyleApplication", inLanguage: ["kn", "en"],
  downloadUrl: PLAY, installUrl: PLAY, url: site + "/app/", image: site + "/assets/icon-512.png", publisher: { "@id": site + "/#org" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  description: "ಕನ್ನಡ ಪಂಚಾಂಗ, ಜನ್ಮ ಕುಂಡಲಿ, ರಾಶಿ ಭವಿಷ್ಯ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI — Kannada panchanga, kundli, horoscope and AI astrologer.",
});

// ---------- pages ----------
function pageHome(site, today) {
  const d = day("bengaluru", today);
  const body = `<section class="hero"><div class="wrap grid2">
  <div><h1 class="disp">ಕನ್ನಡದ ಸಂಪೂರ್ಣ ಪಂಚಾಂಗ</h1>
  <p class="lead">ನಿಮ್ಮ ಊರಿನ ಇಂದಿನ ತಿಥಿ, ನಕ್ಷತ್ರ ಮತ್ತು ರಾಹುಕಾಲ ಇಲ್ಲಿ ಉಚಿತ. ಕುಂಡಲಿ, ಭವಿಷ್ಯ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI — ಆ್ಯಪ್‌ನಲ್ಲಿ.</p>
  ${clockBox(today)}
  ${d ? card("bengaluru", d, true) : ""}</div>
  <div class="side">${phone(d)}${dlBtn(true)}</div>
</div></section>
<section class="s wrap"><h2 class="disp">ನಿಮ್ಮ ಊರಿನ ಪಂಚಾಂಗ</h2><p class="meta">ಕರ್ನಾಟಕದ ${TOWNS.filter((t) => t.ka).length} ಊರುಗಳು ಮತ್ತು ಪ್ರಮುಖ ನಗರಗಳು</p>${townGrid()}</section>
<section class="s wrap"><div class="sh"><h2 class="disp">ಮುಂದಿನ ಹಬ್ಬಗಳು</h2><a class="more" href="/festivals/">ಎಲ್ಲಾ ಹಬ್ಬಗಳು →</a></div>${festList("bengaluru", nextFestivals("bengaluru", today, 6))}</section>
<section class="s wrap"><h2 class="disp">ಆ್ಯಪ್‌ನಲ್ಲಿ ಇನ್ನಷ್ಟು</h2>${featGrid()}</section>
${aiBanner()}
${dlSection()}`;
  return layout(site, {
    path: "/", title: "ನಮ್ಮ ಪಂಚಾಂಗ — ಇಂದಿನ ಕನ್ನಡ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ, ತಿಥಿ, ಹಬ್ಬಗಳು | Kannada Panchanga Today",
    desc: `ಇಂದಿನ ಕನ್ನಡ ಪಂಚಾಂಗ: ತಿಥಿ, ನಕ್ಷತ್ರ, ರಾಹುಕಾಲ, ಯಮಗಂಡ, ಗುಳಿಕ, ಅಭಿಜಿತ್ ಮತ್ತು ಹಬ್ಬಗಳು — ಕರ್ನಾಟಕದ ${TOWNS.length} ಊರುಗಳಿಗೆ. Kannada panchanga, Rahu Kalam today and festivals.`,
    body, schema: [{ "@context": "https://schema.org", "@type": "WebSite", name: "ನಮ್ಮ ಪಂಚಾಂಗ", url: site + "/", inLanguage: "kn", publisher: { "@id": site + "/#org" } }, appSchema(site)],
    script: CLOCK,
  });
}
function phone(d) {
  if (!d) return "";
  return `<div class="glow" aria-hidden="true"><div class="phone"><div class="scr"><div class="island"></div>
  <div class="sbar"><span>${short(d.sunrise + 180)}</span><span>▂▄▆ ▮</span></div>
  <div class="app"><img src="/assets/logo-180.webp" alt="" width="90" height="31">
  <div class="hcard"><small>${esc(dateKn(d.iso, true, d.w))}</small><div class="t disp">${esc(MISC.paksha[d.paksha][0].replace(" ಪಕ್ಷ", ""))} ${esc(kn(d.tithi))}</div><small>${esc(kn(d.nak))} · ${esc(kn(d.yoga))}</small></div>
  <div class="alert">● ರಾಹುಕಾಲ ${short(d.rahu[0])} – ${short(d.rahu[1])}</div>
  <div class="tiles"><div class="tai">✨<br>ಜ್ಯೋತಿಷಿ AI</div><div>☀️<br>ಕುಂಡಲಿ</div><div>🕐<br>ಮುಹೂರ್ತ</div><div>▦<br>ಪರಿಕರ</div></div>
  <div class="alert">✨ ಇಂದು ನನಗೆ ಹೇಗಿದೆ? →</div></div>
  <div class="tabbar"><span class="on">☀️<br>ಇಂದು</span><span>📅<br>ಕ್ಯಾಲೆಂಡರ್</span><span>🪔<br>ಹಬ್ಬಗಳು</span><span>▦<br>ಪರಿಕರ</span></div></div></div></div>`;
}
const aiBanner = () => `<section class="s wrap"><div class="ai"><div><span class="tag">✨ ಹೊಸದು</span><h2 class="h disp">ಜ್ಯೋತಿಷಿ AI</h2><p>ನಿಮ್ಮ ಜಾತಕ ಮತ್ತು ಇಂದಿನ ಪಂಚಾಂಗ ನೋಡಿ ಸರಳ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ. ದಿನಕ್ಕೆ 2 ಪ್ರಶ್ನೆ ಉಚಿತ.</p><p><a class="more light" href="/jyotishi-ai/">ಇನ್ನಷ್ಟು ತಿಳಿಯಿರಿ →</a></p></div>
<div><p class="bq">ಇಂದು ನನಗೆ ಹೇಗಿದೆ?</p><p class="ba">ಇಂದು ಚಂದ್ರ ನಿಮ್ಮ ರಾಶಿಯಿಂದ 10ನೇ ಮನೆಯಲ್ಲಿ — ಕೆಲಸಕ್ಕೆ ಒಳ್ಳೆಯ ದಿನ. ಮುಖ್ಯ ಕೆಲಸವನ್ನು ಅಭಿಜಿತ್ ಸಮಯದಲ್ಲಿ ಆರಂಭಿಸಿ; ರಾಹುಕಾಲ ತಪ್ಪಿಸಿ.</p>${dlBtn(false)}</div></div></section>`;
const dlSection = () => `<section class="dl wrap"><img src="/assets/logo.webp" alt="ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್ ಲೋಗೋ" width="211" height="72" loading="lazy"><h2 class="disp">ಆ್ಯಪ್ ಉಚಿತವಾಗಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ</h2><p class="meta">ಕನ್ನಡ · English · 110+ ಊರುಗಳು · ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ</p>${dlBtn(true)}</section>`;

function pageTowns(site) {
  return layout(site, {
    path: "/panchanga/", title: "ಎಲ್ಲಾ ಊರುಗಳ ಇಂದಿನ ಪಂಚಾಂಗ — ಕರ್ನಾಟಕ | ನಮ್ಮ ಪಂಚಾಂಗ",
    desc: `ಕರ್ನಾಟಕದ ${TOWNS.filter((t) => t.ka).length} ಊರುಗಳು ಮತ್ತು ಪ್ರಮುಖ ನಗರಗಳ ಇಂದಿನ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ ಮತ್ತು ಸೂರ್ಯೋದಯ. Panchanga for every town in Karnataka.`,
    crumbs: [["ಊರುಗಳು", "/panchanga/"]],
    body: `<section class="s wrap"><h1 class="disp">ನಿಮ್ಮ ಊರಿನ ಪಂಚಾಂಗ</h1><p class="lead">ಊರು ಆಯ್ಕೆ ಮಾಡಿ — ಸೂರ್ಯೋದಯ, ರಾಹುಕಾಲ ಮತ್ತು ತಿಥಿ ಸಮಯಗಳು ಊರಿನಿಂದ ಊರಿಗೆ ಬದಲಾಗುತ್ತವೆ.</p>${townGrid()}</section>${dlSection()}`,
  });
}

function pageDay(site, townId, iso, today) {
  const t = TOWN[townId], d = day(townId, iso);
  const isToday = iso === today;
  const prev = addDays(iso, -1), next = addDays(iso, 1), ym = iso.slice(0, 7);
  const week = []; for (let i = 1; i <= 7; i++) { const x = addDays(iso, i); if (days(townId)[x]) week.push(x); }
  const path = isToday && false ? `/panchanga/${townId}/` : `/panchanga/${townId}/${iso}/`;
  const fest = d.fest.map(kn).join(", ");
  const body = `<section class="s wrap"><div class="grid2"><div>
  ${card(townId, d, false, { h1: true, title: `${t.kn} ಪಂಚಾಂಗ — ${dateKn(iso, true, d.w)}` })}
  <nav class="pn" aria-label="ದಿನಗಳು">${days(townId)[prev] ? `<a href="/panchanga/${townId}/${prev}/" rel="prev">← ${esc(dateKn(prev))}</a>` : "<span></span>"}<a href="/panchanga/${townId}/${ym}/">${esc(MISC.months[parts(iso).m - 1][0])} ತಿಂಗಳ ಕ್ಯಾಲೆಂಡರ್</a>${days(townId)[next] ? `<a href="/panchanga/${townId}/${next}/" rel="next">${esc(dateKn(next))} →</a>` : "<span></span>"}</nav>
  ${summary(townId, d)}</div>
  <aside><h2 class="sub disp">ಮುಂದಿನ 7 ದಿನಗಳು</h2><ul class="list">${week.map((x) => { const y = day(townId, x); return `<li><a href="/panchanga/${townId}/${x}/">${esc(dateKn(x, true, y.w))}<small>${esc(kn(y.tithi))}${y.fest.length ? " · " + esc(y.fest.map(kn).join(", ")) : ""}</small></a></li>`; }).join("")}</ul>
  <p><a class="more" href="/panchanga/${townId}/">${esc(t.kn)} ಇಂದಿನ ಪಂಚಾಂಗ →</a></p>${dlBtn(false)}</aside></div></section>
<section class="s wrap"><h2 class="disp">ಇತರ ಊರುಗಳು</h2>${townGrid(townId)}</section>`;
  return layout(site, {
    path, title: `${t.kn} ಪಂಚಾಂಗ ${dateKn(iso, false)} (${MISC.vara[d.w][0]})${fest ? " — " + fest : ""} | ರಾಹುಕಾಲ, ತಿಥಿ`,
    desc: `${dateKn(iso, true, d.w)} ${t.kn} ಪಂಚಾಂಗ: ತಿಥಿ ${kn(d.tithi)}, ನಕ್ಷತ್ರ ${kn(d.nak)}, ರಾಹುಕಾಲ ${tKn(d.rahu[0])}–${tKn(d.rahu[1])}, ಸೂರ್ಯೋದಯ ${tKn(d.sunrise)}.${fest ? " " + fest + "." : ""} ${t.en} panchang ${dateEn(iso)}, Rahu Kalam.`,
    crumbs: [["ಊರುಗಳು", "/panchanga/"], [t.kn, `/panchanga/${townId}/`], [`${MISC.months[parts(iso).m - 1][0]} ${parts(iso).y}`, `/panchanga/${townId}/${ym}/`], [dateKn(iso), path]],
    body,
  });
}

function pageToday(site, townId, today) {
  const t = TOWN[townId], d = day(townId, today);
  if (!d) return null;
  const week = []; for (let i = 1; i <= 7; i++) { const x = addDays(today, i); if (days(townId)[x]) week.push(x); }
  const body = `<section class="s wrap"><div class="grid2"><div>
  <h1 class="disp">${esc(t.kn)} ಇಂದಿನ ಪಂಚಾಂಗ</h1><p class="lead">${esc(dateKn(today, true, d.w))} · ${esc(t.en)} panchanga today</p>
  ${clockBox(today)}
  ${card(townId, d, true, { title: dateKn(today, true, d.w) })}
  <nav class="pn" aria-label="ದಿನಗಳು"><a href="/panchanga/${townId}/${addDays(today, -1)}/">← ನಿನ್ನೆ</a><a href="/panchanga/${townId}/${today.slice(0, 7)}/">ಈ ತಿಂಗಳ ಕ್ಯಾಲೆಂಡರ್</a><a href="/panchanga/${townId}/${addDays(today, 1)}/">ನಾಳೆ →</a></nav>
  ${summary(townId, d)}</div>
  <aside><h2 class="sub disp">ಮುಂದಿನ 7 ದಿನಗಳು</h2><ul class="list">${week.map((x) => { const y = day(townId, x); return `<li><a href="/panchanga/${townId}/${x}/">${esc(dateKn(x, true, y.w))}<small>${esc(kn(y.tithi))}${y.fest.length ? " · " + esc(y.fest.map(kn).join(", ")) : ""}</small></a></li>`; }).join("")}</ul>${dlBtn(false)}</aside></div></section>
<section class="s wrap"><div class="sh"><h2 class="disp">${esc(t.kn)} — ಮುಂದಿನ ಹಬ್ಬಗಳು</h2><a class="more" href="/festivals/">ಎಲ್ಲಾ ಹಬ್ಬಗಳು →</a></div>${festList(townId, nextFestivals(townId, today, 6))}</section>
<section class="s wrap"><h2 class="disp">ಇತರ ಊರುಗಳು</h2>${townGrid(townId)}</section>`;
  return layout(site, {
    path: `/panchanga/${townId}/`, title: `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ — ರಾಹುಕಾಲ, ತಿಥಿ, ನಕ್ಷತ್ರ | ${t.en} Panchanga Today`,
    desc: `${t.kn} ಇಂದಿನ ಪಂಚಾಂಗ: ತಿಥಿ, ನಕ್ಷತ್ರ, ಯೋಗ, ಕರಣ, ಸೂರ್ಯೋದಯ, ರಾಹುಕಾಲ, ಯಮಗಂಡ, ಗುಳಿಕ ಮತ್ತು ಅಭಿಜಿತ್ ಸಮಯ. Today's panchang and Rahu Kalam in ${t.en}.`,
    crumbs: [["ಊರುಗಳು", "/panchanga/"], [t.kn, `/panchanga/${townId}/`]],
    body, script: CLOCK,
  });
}

function pageMonth(site, townId, ym, today) {
  const t = TOWN[townId]; const [y, m] = ym.split("-").map(Number);
  const dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const first = new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
  const cells = [];
  for (let i = 0; i < first; i++) cells.push('<td class="empty"></td>');
  for (let dd = 1; dd <= dim; dd++) {
    const iso = `${ym}-${String(dd).padStart(2, "0")}`, x = day(townId, iso);
    cells.push(x ? `<td${iso === today ? ' class="today"' : ""}><a href="/panchanga/${townId}/${iso}/"><b>${dd}</b><small>${esc(kn(x.tithi))}</small>${x.fest.length ? `<em>${esc(kn(x.fest[0]))}</em>` : ""}</a></td>` : `<td class="empty"><b>${dd}</b></td>`);
  }
  while (cells.length % 7) cells.push('<td class="empty"></td>');
  const rowsHtml = []; for (let i = 0; i < cells.length; i += 7) rowsHtml.push("<tr>" + cells.slice(i, i + 7).join("") + "</tr>");
  const pm = m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`, nm = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const has = (mm) => !!days(townId)[mm + "-01"] || !!days(townId)[mm + "-28"];
  const mname = `${MISC.months[m - 1][0]} ${y}`;
  const body = `<section class="s wrap"><h1 class="disp">${esc(t.kn)} ಪಂಚಾಂಗ — ${esc(mname)}</h1><p class="lead">ಪ್ರತಿ ದಿನದ ತಿಥಿ ಮತ್ತು ಹಬ್ಬ. ದಿನದ ಮೇಲೆ ಒತ್ತಿ ಪೂರ್ಣ ಪಂಚಾಂಗ ನೋಡಿ.</p>
  <div class="calwrap"><table class="cal"><caption class="sr">${esc(t.kn)} ${esc(mname)} ಕ್ಯಾಲೆಂಡರ್</caption><thead><tr>${MISC.vara.map((v) => `<th scope="col">${esc(v[0].replace("ವಾರ", ""))}</th>`).join("")}</tr></thead><tbody>${rowsHtml.join("")}</tbody></table></div>
  <nav class="pn" aria-label="ತಿಂಗಳುಗಳು">${has(pm) ? `<a href="/panchanga/${townId}/${pm}/" rel="prev">← ${esc(MISC.months[(m + 10) % 12][0])}</a>` : "<span></span>"}<a href="/panchanga/${townId}/">${esc(t.kn)} ಇಂದಿನ ಪಂಚಾಂಗ</a>${has(nm) ? `<a href="/panchanga/${townId}/${nm}/" rel="next">${esc(MISC.months[m % 12][0])} →</a>` : "<span></span>"}</nav></section>${dlSection()}`;
  return layout(site, {
    path: `/panchanga/${townId}/${ym}/`, title: `${t.kn} ಪಂಚಾಂಗ ${mname} — ತಿಥಿ ಮತ್ತು ಹಬ್ಬಗಳ ಕ್ಯಾಲೆಂಡರ್ | ${t.en} ${MISC.months[m - 1][1]} ${y}`,
    desc: `${t.kn} ${mname} ಕನ್ನಡ ಪಂಚಾಂಗ ಕ್ಯಾಲೆಂಡರ್: ಪ್ರತಿ ದಿನದ ತಿಥಿ, ಹಬ್ಬ ಮತ್ತು ವ್ರತ. Kannada calendar for ${t.en}, ${MISC.months[m - 1][1]} ${y}.`,
    crumbs: [["ಊರುಗಳು", "/panchanga/"], [t.kn, `/panchanga/${townId}/`], [mname, `/panchanga/${townId}/${ym}/`]],
    body,
  });
}

function pageFestivals(site, today) {
  const list = nextFestivals("bengaluru", today, 400);
  const byMonth = {};
  list.forEach((d) => { const k = d.iso.slice(0, 7); (byMonth[k] = byMonth[k] || []).push(d); });
  const body = `<section class="s wrap"><h1 class="disp">ಕನ್ನಡ ಹಬ್ಬಗಳು ಮತ್ತು ವ್ರತಗಳು</h1><p class="lead">ಯುಗಾದಿ, ಗಣೇಶ ಚತುರ್ಥಿ, ನವರಾತ್ರಿ, ದೀಪಾವಳಿ, ಸಂಕ್ರಾಂತಿ, ಏಕಾದಶಿ, ಸಂಕಷ್ಟಿ — ಬೆಂಗಳೂರು ಸಮಯದ ಪ್ರಕಾರ.</p>
  ${Object.keys(byMonth).map((k) => { const [y, m] = k.split("-").map(Number); return `<h2 class="sub disp">${esc(MISC.months[m - 1][0])} ${y}</h2>${festList("bengaluru", byMonth[k])}`; }).join("")}
  <p class="meta">ದಿನಾಂಕಗಳು ಬೆಂಗಳೂರು ಸೂರ್ಯೋದಯದ ಪ್ರಕಾರ; ನಿಮ್ಮ ಊರಿಗೆ ಹಬ್ಬದ ಜ್ಞಾಪನೆ ಆ್ಯಪ್‌ನಲ್ಲಿ.</p></section>${dlSection()}`;
  return layout(site, {
    path: "/festivals/", title: "ಕನ್ನಡ ಹಬ್ಬಗಳ ಪಟ್ಟಿ — ದೀಪಾವಳಿ, ಏಕಾದಶಿ, ಸಂಕಷ್ಟಿ ದಿನಾಂಕಗಳು | Kannada Festivals",
    desc: "ಮುಂದಿನ ಎಲ್ಲಾ ಕನ್ನಡ ಹಬ್ಬಗಳು ಮತ್ತು ವ್ರತಗಳ ದಿನಾಂಕಗಳು — ಏಕಾದಶಿ, ಸಂಕಷ್ಟಿ, ಹುಣ್ಣಿಮೆ, ಅಮಾವಾಸ್ಯೆ ಸೇರಿದಂತೆ. Kannada festival dates and vratas.",
    crumbs: [["ಹಬ್ಬಗಳು", "/festivals/"]], body,
  });
}
function pageRashi(site) {
  const body = `<section class="s wrap"><h1 class="disp">ಇಂದಿನ ರಾಶಿ ಭವಿಷ್ಯ</h1><p class="lead">12 ರಾಶಿಗಳ ದಿನ, ತಿಂಗಳು ಮತ್ತು ವರ್ಷ ಭವಿಷ್ಯ — ಕೆಲಸ, ಹಣ, ಕುಟುಂಬ ಮತ್ತು ಆರೋಗ್ಯ. ಪೂರ್ಣ ಭವಿಷ್ಯ ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್‌ನಲ್ಲಿ ಉಚಿತ.</p>
  <ul class="rashis">${MISC.rashi.map((r) => `<li><a href="/app/"><b>${esc(r[0])}</b><small>${esc(r[1])}</small><span>ಇಂದಿನ ಭವಿಷ್ಯ ಆ್ಯಪ್‌ನಲ್ಲಿ</span></a></li>`).join("")}</ul></section>${featGridSection()}${dlSection()}`;
  return layout(site, {
    path: "/rashi-bhavishya/", title: "ಇಂದಿನ ರಾಶಿ ಭವಿಷ್ಯ — 12 ರಾಶಿಗಳ ದಿನ ಭವಿಷ್ಯ ಕನ್ನಡದಲ್ಲಿ | Kannada Rashi Bhavishya",
    desc: "ಮೇಷದಿಂದ ಮೀನದವರೆಗೆ 12 ರಾಶಿಗಳ ಇಂದಿನ, ಈ ತಿಂಗಳ ಮತ್ತು ಈ ವರ್ಷದ ಭವಿಷ್ಯ ಕನ್ನಡದಲ್ಲಿ — ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್‌ನಲ್ಲಿ. Daily horoscope in Kannada.",
    crumbs: [["ರಾಶಿ ಭವಿಷ್ಯ", "/rashi-bhavishya/"]], body,
  });
}
const featGridSection = () => `<section class="s wrap"><h2 class="disp">ಆ್ಯಪ್‌ನಲ್ಲಿ ಇನ್ನಷ್ಟು</h2>${featGrid()}</section>`;
function pageAi(site) {
  const qs = ["ಈ ವರ್ಷ ಉದ್ಯೋಗ ಬದಲಾವಣೆ ಸಾಧ್ಯವೇ?", "ನನ್ನ ಮದುವೆ ಯಾವಾಗ ಆಗಬಹುದು?", "ಸಾಡೇಸಾತಿಯಲ್ಲಿ ಏನು ಮಾಡಬೇಕು?", "ಇಂದು ನನಗೆ ಹೇಗಿದೆ?", "ಈಗಿನ ದಶೆಯ ಫಲ ಏನು?"];
  const body = `<section class="s wrap"><h1 class="disp">ಜ್ಯೋತಿಷಿ AI — ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ಕನ್ನಡದಲ್ಲೇ ಕೇಳಿ</h1>
  <p class="lead">ನಿಮ್ಮ ಜನ್ಮ ಕುಂಡಲಿ, ದಶೆ, ಗ್ರಹ ಸಂಚಾರ ಮತ್ತು ಇಂದಿನ ಪಂಚಾಂಗ ನೋಡಿ ಸರಳ ಕನ್ನಡ ಅಥವಾ English ನಲ್ಲಿ ಉತ್ತರ. ದಿನಕ್ಕೆ 2 ಪ್ರಶ್ನೆ ಉಚಿತ (ಪ್ರತಿ ಪ್ರಶ್ನೆಗೆ ಒಂದು ಚಿಕ್ಕ ಜಾಹೀರಾತು). Pro: ತಿಂಗಳಿಗೆ 50 ಪ್ರಶ್ನೆ, ಜಾಹೀರಾತು ಇಲ್ಲದೆ.</p>
  <h2 class="sub disp">ಹೀಗೆ ಕೇಳಬಹುದು</h2><ul class="list">${qs.map((q) => `<li><span>💬 ${esc(q)}</span></li>`).join("")}</ul>
  <p class="meta">AI ಉತ್ತರಗಳು ಸಾಂಪ್ರದಾಯಿಕ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ; ಮುಖ್ಯ ನಿರ್ಧಾರಗಳಿಗೆ ಕುಟುಂಬದ ಜ್ಯೋತಿಷಿಗಳ ಸಲಹೆ ಪಡೆಯಿರಿ.</p></section>${aiBanner()}${dlSection()}`;
  return layout(site, {
    path: "/jyotishi-ai/", title: "ಜ್ಯೋತಿಷಿ AI — ಕನ್ನಡ AI ಜ್ಯೋತಿಷಿ, ನಿಮ್ಮ ಜಾತಕದ ಬಗ್ಗೆ ಕೇಳಿ | Jyotishi AI",
    desc: "ಜ್ಯೋತಿಷಿ AI: ಉದ್ಯೋಗ, ಮದುವೆ, ಸಾಡೇಸಾತಿ, ದಶೆ ಮತ್ತು ಇಂದಿನ ದಿನದ ಬಗ್ಗೆ ನಿಮ್ಮ ಜಾತಕ ನೋಡಿ ಕನ್ನಡದಲ್ಲಿ ಉತ್ತರ. ದಿನಕ್ಕೆ 2 ಪ್ರಶ್ನೆ ಉಚಿತ. Kannada AI astrologer.",
    crumbs: [["ಜ್ಯೋತಿಷಿ AI", "/jyotishi-ai/"]], body,
  });
}
function pageApp(site) {
  const body = `<section class="s wrap"><h1 class="disp">ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್</h1><p class="lead">ಕನ್ನಡ ಪಂಚಾಂಗ, ಗೌರಿ ಪಂಚಾಂಗ, ಜನ್ಮ ಕುಂಡಲಿ, ರಾಶಿ ಭವಿಷ್ಯ, ವಿವಾಹ ಹೊಂದಾಣಿಕೆ, ಮುಹೂರ್ತ, ಹಬ್ಬಗಳ ಜ್ಞಾಪನೆ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI — ಒಂದೇ ಆ್ಯಪ್‌ನಲ್ಲಿ. Android ಗೆ ಉಚಿತ.</p>${dlBtn(true)}</section>${featGridSection()}${aiBanner()}`;
  return layout(site, {
    path: "/app/", title: "ನಮ್ಮ ಪಂಚಾಂಗ ಆ್ಯಪ್ ಡೌನ್‌ಲೋಡ್ — ಕನ್ನಡ ಪಂಚಾಂಗ, ಕುಂಡಲಿ, ಜ್ಯೋತಿಷಿ AI | Android",
    desc: "ನಮ್ಮ ಪಂಚಾಂಗ Android ಆ್ಯಪ್: ಕನ್ನಡ ಪಂಚಾಂಗ, ರಾಹುಕಾಲ, ಗೌರಿ ಪಂಚಾಂಗ, ಜನ್ಮ ಕುಂಡಲಿ, ರಾಶಿ ಭವಿಷ್ಯ, ವಿವಾಹ ಹೊಂದಾಣಿಕೆ ಮತ್ತು ಜ್ಯೋತಿಷಿ AI. Google Play ನಲ್ಲಿ ಉಚಿತ.",
    crumbs: [["ಆ್ಯಪ್", "/app/"]], body, schema: [appSchema(site)],
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
  const terms = which === "terms";
  return layout(site, {
    path: terms ? "/terms/" : "/privacy/",
    title: terms ? "Terms of Service — ನಮ್ಮ ಪಂಚಾಂಗ (Namma Panchanga)" : "Privacy Policy — ನಮ್ಮ ಪಂಚಾಂಗ (Namma Panchanga)",
    desc: terms ? "Terms of Service for the Namma Panchanga app and website: Jyotishi AI, Pro subscriptions, question packs and disclaimers." : "Privacy Policy for the Namma Panchanga app and website: what is stored on your phone, Jyotishi AI, ads, analytics and payments.",
    crumbs: [[terms ? "Terms of Service" : "Privacy Policy", terms ? "/terms/" : "/privacy/"]],
    body: `<article class="s wrap legal" lang="en"><h1 class="disp">${terms ? "Terms of Service" : "Privacy Policy"}</h1><p class="meta">Effective date: 5 November 2026</p>${legalDoc(terms ? TERMS_TXT : PRIVACY_TXT)}</article>`,
  });
}
function page404(site) {
  return layout(site, {
    path: "/404/", title: "ಪುಟ ಸಿಗಲಿಲ್ಲ — ನಮ್ಮ ಪಂಚಾಂಗ", desc: "ಈ ಪುಟ ಲಭ್ಯವಿಲ್ಲ. ಇಂದಿನ ಪಂಚಾಂಗ ನೋಡಿ.",
    body: `<section class="s wrap"><h1 class="disp">ಪುಟ ಸಿಗಲಿಲ್ಲ</h1><p class="lead">ನೀವು ಹುಡುಕುತ್ತಿರುವ ಪುಟ ಇಲ್ಲ. <a class="more" href="/">ಮುಖಪುಟಕ್ಕೆ ಹೋಗಿ</a> ಅಥವಾ <a class="more" href="/panchanga/">ನಿಮ್ಮ ಊರಿನ ಪಂಚಾಂಗ</a> ನೋಡಿ.</p></section>`,
  }).replace('<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">', '<meta name="robots" content="noindex">');
}

// ---------- sitemap and robots ----------
function sitemap(site, today) {
  const u = (loc, freq, pri, lastmod) => `<url><loc>${site}${loc}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>${freq}</changefreq><priority>${pri}</priority></url>`;
  const out = [u("/", "daily", "1.0", today), u("/panchanga/", "weekly", "0.8"), u("/festivals/", "weekly", "0.8", today), u("/rashi-bhavishya/", "monthly", "0.6"), u("/jyotishi-ai/", "monthly", "0.6"), u("/app/", "monthly", "0.7"), u("/terms/", "yearly", "0.2"), u("/privacy/", "yearly", "0.2")];
  for (const t of TOWNS) {
    out.push(u(`/panchanga/${t.id}/`, "daily", t.ka ? "0.9" : "0.7", today));
    const months = new Set();
    for (const iso of ALL_DATES) { months.add(iso.slice(0, 7)); out.push(u(`/panchanga/${t.id}/${iso}/`, "monthly", "0.5")); }
    for (const ym of months) out.push(u(`/panchanga/${t.id}/${ym}/`, "monthly", "0.6"));
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
/** Returns {status, type, body, cache, location?} for a path. now = epoch ms. */
function render(rawPath, site, now) {
  const today0 = istToday(now);
  const today = today0 < FIRST ? FIRST : today0 > LAST ? LAST : today0;
  const secsToMidnight = Math.max(60, Math.floor((Date.parse(addDays(today0, 1) + "T00:00:00+05:30") - now) / 1000));
  const daily = `public, max-age=300, s-maxage=${secsToMidnight}`;
  const stable = "public, max-age=3600, s-maxage=604800";
  const html = (body, cache) => ({ status: 200, type: "text/html; charset=utf-8", body, cache });
  let p = decodeURIComponent(rawPath.split("?")[0]);
  if (p === "/robots.txt") return { status: 200, type: "text/plain; charset=utf-8", body: robots(site), cache: "public, max-age=3600, s-maxage=86400" };
  if (p === "/sitemap.xml") return { status: 200, type: "application/xml; charset=utf-8", body: sitemap(site, today), cache: daily };
  if (!p.endsWith("/")) return { status: 301, location: p + "/", cache: "public, max-age=86400" }; // one hop, never a chain
  const seg = p.split("/").filter(Boolean);
  if (seg.length === 0) return html(pageHome(site, today), daily);
  if (seg[0] === "panchanga") {
    if (seg.length === 1) return html(pageTowns(site), stable);
    const town = TOWN[seg[1]];
    if (town) {
      if (seg.length === 2) { const r = pageToday(site, town.id, today); if (r) return html(r, daily); }
      if (seg.length === 3 && /^\d{4}-\d{2}$/.test(seg[2]) && (days(town.id)[seg[2] + "-01"] || days(town.id)[seg[2] + "-28"])) return html(pageMonth(site, town.id, seg[2], today), daily);
      if (seg.length === 3 && /^\d{4}-\d{2}-\d{2}$/.test(seg[2]) && days(town.id)[seg[2]]) return html(pageDay(site, town.id, seg[2], today), stable);
    }
  }
  if (seg.length === 1) {
    if (seg[0] === "festivals") return html(pageFestivals(site, today), daily);
    if (seg[0] === "rashi-bhavishya") return html(pageRashi(site), stable);
    if (seg[0] === "jyotishi-ai") return html(pageAi(site), stable);
    if (seg[0] === "app") return html(pageApp(site), stable);
    if (seg[0] === "terms" || seg[0] === "privacy") return html(pageLegal(site, seg[0]), stable);
  }
  return { status: 404, type: "text/html; charset=utf-8", body: page404(site), cache: "public, max-age=300" };
}

export { render, sitemap, robots, TOWNS, ALL_DATES };
