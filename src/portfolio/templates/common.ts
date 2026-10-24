import type { Portfolio, PortfolioProject } from "../types";
import type { TemplateId } from "../types";

export function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function attr(value: string): string {
  return esc(value).replace(/\n/g, " ");
}

export function paragraphs(body: string[]): string {
  return body.map((item) => `<p>${esc(item)}</p>`).join("");
}

export function accentWords(value: string, count = 1): string {
  const words = value.trim().split(/\s+/);
  if (!words.length) return "";
  const cut = Math.max(1, words.length - count);
  return `${esc(words.slice(0, cut).join(" "))} <em>${esc(words.slice(cut).join(" "))}</em>`;
}

export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function navLinks(portfolio: Portfolio): string {
  return `<a href="#work">Work</a><a href="#about">About</a>${
    portfolio.experience.length ? `<a href="#experience">Experience</a>` : ""
  }<a href="#contact">Contact</a>`;
}

export function socialLinks(portfolio: Portfolio, className = "socials"): string {
  if (!portfolio.links.length) return "";
  return `<div class="${className}">${portfolio.links
    .map(
      (link) =>
        `<a href="${attr(link.url)}" target="_blank" rel="noreferrer noopener">${esc(link.label)}</a>`,
    )
    .join("")}</div>`;
}

export function emailHref(email: string): string {
  return email ? `mailto:${email}` : "#contact";
}

/* ------------------------------------------------------------------ colours */

type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean.padEnd(6, "0").slice(0, 6);
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

export function rgba(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Mix toward a hex colour; amount 0 keeps the accent, 1 returns the target. */
export function mix(hex: string, target: string, amount: number): string {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  const channel = (i: number) => Math.round(a[i] + (b[i] - a[i]) * amount);
  return `#${[0, 1, 2]
    .map((i) => channel(i).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function readableOn(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111111" : "#fffaf2";
}

export function hexToHue(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((value) => value / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  if (!delta) return 0;
  let hue = 0;
  if (max === r) hue = ((g - b) / delta) % 6;
  else if (max === g) hue = (b - r) / delta + 2;
  else hue = (r - g) / delta + 4;
  return Math.round(hue * 60 + 360) % 360;
}

function posterPalette(accent: string, index: number): [string, string] {
  const shift = [0, 38, -30, 62, -52, 18, -18, 84, -72][index % 9];
  const baseHue = (hexToHue(accent) + shift + 360) % 360;
  return [
    `hsl(${baseHue} 68% 44%)`,
    `hsl(${(baseHue + 26) % 360} 55% 18%)`,
  ];
}

/** Generated poster art so every portfolio looks composed without stock photos. */
export function posterStyle(project: PortfolioProject, index: number, accent: string): string {
  if (project.poster) {
    return `background-image:linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,.55)), url('${attr(
      project.poster,
    )}');background-size:cover;background-position:center;`;
  }
  const [bright, deep] = posterPalette(accent, index);
  const angle = [135, 205, 35, 315, 160, 250][index % 6];
  return [
    "background-image:",
    `radial-gradient(120% 90% at 16% 8%, ${bright} 0%, transparent 58%),`,
    `radial-gradient(90% 110% at 92% 104%, ${deep} 0%, transparent 62%),`,
    `linear-gradient(${angle}deg, #1a1a1a 0%, #070707 78%);`,
  ].join("");
}

export function projectArt(
  project: PortfolioProject,
  index: number,
  accent: string,
  className = "poster",
): string {
  return `<div class="${className}" style="${posterStyle(project, index, accent)}">
    <span class="poster__index">${pad(index + 1)}</span>
    <span class="poster__mark">${esc((project.category || "Work").slice(0, 1))}</span>
  </div>`;
}

export function fontLink(families: string[]): string {
  const query = families
    .map((family) => `family=${family.trim().replace(/\s+/g, "+")}`)
    .join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?${query}&display=swap" rel="stylesheet">`;
}

/* -------------------------------------------------------------------- shell */

const BASE_CSS = `
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--sans);-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility;overflow-x:hidden}
img,svg{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
p{margin:0}
h1,h2,h3,h4{margin:0;font-weight:400}
ul{margin:0;padding:0;list-style:none}
::selection{background:var(--accent);color:var(--accent-ink)}
:focus-visible{outline:2px solid var(--accent);outline-offset:4px}
.container{width:min(1280px, calc(100% - 64px));margin-inline:auto}
.mono{font-family:var(--mono);text-transform:uppercase;letter-spacing:.14em;font-size:11px}
.grain{position:fixed;inset:0;z-index:80;pointer-events:none;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E")}
.poster{position:relative;overflow:hidden;background-color:#151515;isolation:isolate}
.poster::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,transparent 40%,rgba(0,0,0,.42));pointer-events:none}
.poster__index{position:absolute;top:16px;left:18px;z-index:2;font-family:var(--mono);font-size:10px;letter-spacing:.16em;color:rgba(255,255,255,.62)}
.poster__mark{position:absolute;right:16px;bottom:-.14em;z-index:2;font-family:var(--display);font-size:clamp(72px,9vw,140px);line-height:.9;color:rgba(255,255,255,.16)}
[data-reveal]{opacity:0;transform:translateY(26px);transition:opacity .9s cubic-bezier(.16,1,.3,1),transform .9s cubic-bezier(.16,1,.3,1);transition-delay:var(--d,0s)}
[data-reveal].is-in{opacity:1;transform:none}
.is-scrolled .site-nav{backdrop-filter:blur(18px)}
@media (prefers-reduced-motion:reduce){
  html{scroll-behavior:auto}
  *,*::before,*::after{animation-duration:.001ms !important;animation-iteration-count:1 !important;transition-duration:.001ms !important}
  [data-reveal]{opacity:1;transform:none}
}
@media (max-width:720px){.container{width:calc(100% - 40px)}}
`;

const BASE_JS = `
(function(){
  var els=document.querySelectorAll('[data-reveal]');
  if(!('IntersectionObserver' in window)){els.forEach(function(el){el.classList.add('is-in')});}
  else{
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){ if(entry.isIntersecting){ entry.target.classList.add('is-in'); io.unobserve(entry.target);} });
    },{threshold:.08,rootMargin:'0px 0px -8% 0px'});
    els.forEach(function(el){io.observe(el)});
  }
  var onScroll=function(){ if(window.scrollY>24){document.body.classList.add('is-scrolled')}else{document.body.classList.remove('is-scrolled')} };
  onScroll(); window.addEventListener('scroll',onScroll,{passive:true});
  document.querySelectorAll('[data-scroll]').forEach(function(btn){
    btn.addEventListener('click',function(){
      var target=document.getElementById(btn.getAttribute('data-scroll'));
      if(!target) return;
      var dir=btn.getAttribute('data-dir')==='prev'?-1:1;
      target.scrollBy({left:dir*Math.min(target.clientWidth*.8,560),behavior:'smooth'});
    });
  });
  document.querySelectorAll('[data-year]').forEach(function(el){el.textContent=new Date().getFullYear()});
})();
`;

export interface RenderedDocument {
  html: string;
  css: string;
}

export interface ShellOptions {
  portfolio: Portfolio;
  template: TemplateId;
  css: string;
  body: string;
  fonts: string[];
  background: string;
  foreground: string;
}

export function renderShell({
  portfolio,
  template,
  css,
  body,
  fonts,
  background,
  foreground,
}: ShellOptions): string {
  const title = `${portfolio.name} — ${portfolio.role}`;
  const description = portfolio.hero.subtitle || portfolio.about.pullQuote;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${attr(description)}">
<meta name="theme-color" content="${attr(background)}">
${fontLink(fonts)}
<style>
:root{--bg:${attr(background)};--fg:${attr(foreground)};--accent:${attr(portfolio.accent)};--accent-ink:${readableOn(
    portfolio.accent,
  )};--sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;--mono:'JetBrains Mono','SFMono-Regular',Consolas,monospace;--display:'Instrument Serif',Georgia,serif;--serif:'Instrument Serif',Georgia,serif;--body-font:'Inter',system-ui,sans-serif}
${BASE_CSS}
${css}
</style>
</head>
<body class="tpl-${template}">
${body}
<div class="grain" aria-hidden="true"></div>
<script>${BASE_JS}</script>
</body>
</html>`;
}
