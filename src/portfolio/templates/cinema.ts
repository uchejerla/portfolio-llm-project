import type { Portfolio, PortfolioProject } from "../types";
import {
  attr,
  emailHref,
  esc,
  navLinks,
  pad,
  paragraphs,
  projectArt,
  renderShell,
  socialLinks,
} from "./common";

function accentLast(value: string, count = 1): string {
  const words = value.trim().split(/\s+/);
  if (!words.length) return "";
  const cut = Math.max(1, words.length - count);
  return `${esc(words.slice(0, cut).join(" "))} <em>${esc(words.slice(cut).join(" "))}</em>`;
}

function card(project: PortfolioProject, index: number, accent: string): string {
  const href = project.link || "#contact";
  const external = project.link ? ` target="_blank" rel="noreferrer noopener"` : "";
  return `<article class="film-card" data-reveal style="--d:${index * 70}ms">
    <a class="film-card__frame" href="${attr(href)}"${external} aria-label="${attr(project.title)}">
      ${projectArt(project, index, accent)}
      <span class="film-card__genre">${esc(project.category)}</span>
      <span class="film-card__play">View project <b>↗</b></span>
    </a>
    <div class="film-card__meta">
      <div>
        <h3>${esc(project.title)}</h3>
        <p>${esc(project.blurb)}</p>
      </div>
      <span class="film-card__year">${esc(project.year || "—")}</span>
    </div>
  </article>`;
}

function marquee(text: string): string {
  const item = `<span>${esc(text)}</span><i>✦</i>`;
  return `<div class="marquee" aria-hidden="true"><div class="marquee__track">${item.repeat(4)}</div><div class="marquee__track">${item.repeat(4)}</div></div>`;
}

export function renderCinema(portfolio: Portfolio): string {
  const accent = portfolio.accent;
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];
  const others = portfolio.projects.filter((project) => project !== featured);
  const spot = featured
    ? `<section class="spotlight" id="spotlight">
        <div class="container spotlight__grid">
          <div class="spotlight__copy" data-reveal>
            <p class="mono">Feature presentation · ${esc(featured.year || "Now")}</p>
            <h2>${esc(featured.title)}</h2>
            <p class="spotlight__blurb">${esc(featured.blurb)}</p>
            <div class="tag-row">${featured.tags.map((tag) => `<span>${esc(tag)}</span>`).join("")}</div>
            <a class="btn btn--primary" href="${attr(featured.link || "#contact")}"${
              featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
            }>Enter the case study <span>↗</span></a>
          </div>
          <div class="spotlight__art" data-reveal style="--d:.12s">
            ${projectArt(featured, portfolio.projects.indexOf(featured), accent)}
            <div class="spotlight__stamp">${esc(featured.category)}</div>
          </div>
        </div>
      </section>`
    : "";

  const heroPoster = featured
    ? `<div class="hero-card hero-card--back" aria-hidden="true">${projectArt(
        others[0] ?? featured,
        1,
        accent,
      )}</div>
      <div class="hero-card" aria-hidden="true">
        ${projectArt(featured, 0, accent)}
        <div class="hero-card__caption">
          <span class="mono">Now showing · ${esc(featured.year || "2026")}</span>
          <strong>${esc(featured.title)}</strong>
          <small>${esc(featured.category)}</small>
        </div>
      </div>`
    : `<div class="hero-monogram">${esc(portfolio.initials)}</div>`;

  const body = `<header class="site-nav">
    <div class="container nav-inner">
      <a class="brand" href="#top" aria-label="${attr(portfolio.name)} home">
        <span class="brand__mark">${esc(portfolio.initials)}</span>
        <span class="brand__text">${esc(portfolio.name)}<em>${esc(portfolio.role)}</em></span>
      </a>
      <nav class="nav-links">${navLinks(portfolio)}</nav>
      <a class="nav-status" href="#contact"><i></i>${esc(portfolio.availability)}</a>
    </div>
  </header>

  <main id="top">
    <section class="billboard">
      <div class="billboard__glow" aria-hidden="true"></div>
      <div class="billboard__ghost" aria-hidden="true">${esc(portfolio.initials)}</div>
      <div class="container billboard__grid">
        <div class="billboard__copy">
          <p class="eyebrow" data-reveal><span class="pulse"></span>${esc(portfolio.hero.kicker)}</p>
          <h1 data-reveal style="--d:.08s">${accentLast(portfolio.hero.title, 2)}</h1>
          <p class="billboard__sub" data-reveal style="--d:.16s">${esc(portfolio.hero.subtitle)}</p>
          <div class="billboard__actions" data-reveal style="--d:.24s">
            <a class="btn btn--primary" href="#contact">${esc(portfolio.hero.primaryCta)} <span>↗</span></a>
            <a class="btn btn--ghost" href="#work"><span class="play">▶</span>${esc(
              portfolio.hero.secondaryCta,
            )}</a>
          </div>
          <dl class="billboard__stats" data-reveal style="--d:.32s">
            ${portfolio.hero.stats
              .map(
                (stat) =>
                  `<div><dt>${esc(stat.value)}</dt><dd>${esc(stat.label)}</dd></div>`,
              )
              .join("")}
          </dl>
        </div>
        <div class="billboard__poster" data-reveal style="--d:.18s">${heroPoster}</div>
      </div>
      <div class="billboard__foot container">
        <span class="mono">${esc(portfolio.location)}</span>
        <span class="scroll-cue"><i></i>Scroll to explore</span>
        <span class="mono">Portfolio · <span data-year></span></span>
      </div>
    </section>

    ${marquee(portfolio.hero.marquee)}

    ${
      portfolio.projects.length
        ? `<section class="work" id="work">
      <div class="container work__head">
        <div>
          <p class="mono" data-reveal>01 / The catalogue</p>
          <h2 data-reveal style="--d:.06s">Now <em>trending</em></h2>
        </div>
        <div class="row-controls" data-reveal>
          <button data-scroll="work-row" data-dir="prev" aria-label="Scroll work left">←</button>
          <button data-scroll="work-row" data-dir="next" aria-label="Scroll work right">→</button>
        </div>
      </div>
      <div class="film-row" id="work-row">
        ${portfolio.projects.map((project, index) => card(project, index, accent)).join("")}
      </div>
    </section>`
        : ""
    }

    ${spot}

    <section class="story" id="about">
      <div class="container story__grid">
        <div class="story__side" data-reveal>
          <p class="mono">02 / About</p>
          <span class="story__num">${esc(portfolio.initials)}</span>
        </div>
        <div class="story__main">
          <h2 data-reveal>${accentLast(portfolio.about.heading, 2)}</h2>
          <blockquote data-reveal style="--d:.08s">“${esc(portfolio.about.pullQuote)}”</blockquote>
          <div class="story__body" data-reveal style="--d:.14s">${paragraphs(portfolio.about.body)}</div>
        </div>
        <dl class="story__facts" data-reveal style="--d:.2s">
          ${portfolio.about.facts
            .map((fact) => `<div><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`)
            .join("")}
        </dl>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="genres">
      <div class="container genres__grid">
        <p class="mono" data-reveal>03 / Genres</p>
        <div class="genres__cols">
          ${portfolio.skills
            .map(
              (group) => `<div class="genre" data-reveal>
                <h3>${esc(group.label)}</h3>
                <ul>${group.items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
              </div>`,
            )
            .join("")}
        </div>
      </div>
    </section>`
        : ""
    }

    ${
      portfolio.experience.length
        ? `<section class="seasons" id="experience">
      <div class="container">
        <div class="seasons__head" data-reveal>
          <p class="mono">04 / Seasons</p>
          <h2>Previously on <em>${esc(portfolio.name.split(" ")[0])}</em></h2>
        </div>
        <div class="seasons__list">
          ${portfolio.experience
            .map(
              (job, index) => `<article class="season" data-reveal style="--d:${index * 60}ms">
                <span class="season__no">${pad(index + 1)}</span>
                <span class="season__period">${esc(job.period)}</span>
                <div class="season__role"><h3>${esc(job.role)}</h3><p>${esc(job.company)}</p></div>
                <p class="season__summary">${esc(job.summary)}</p>
              </article>`,
            )
            .join("")}
        </div>
      </div>
    </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__inner" data-reveal>
        <p class="mono">05 / Next</p>
        <h2>${accentLast(portfolio.contact.heading, 2)}</h2>
        <p class="contact__blurb">${esc(portfolio.contact.blurb)}</p>
        <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)} <span>↗</span></a>
        <div class="contact__meta">
          ${socialLinks(portfolio)}
          <span class="contact__note">${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <div class="footer-mark" aria-hidden="true">${esc(portfolio.name)}</div>
      <footer class="site-footer container">
        <span>${esc(portfolio.name)} · <span data-year></span></span>
        <span>${esc(portfolio.location)}</span>
        <span>Directed with Portfolio Studio</span>
      </footer>
    </section>
  </main>  `;

  const css = `
body{background:var(--bg)}
.site-nav{position:fixed;inset:0 0 auto;z-index:60;padding:18px 0;transition:background .35s ease,padding .35s ease,border-color .35s ease;border-bottom:1px solid transparent}
.is-scrolled .site-nav{background:rgba(8,8,10,.72);border-color:rgba(255,255,255,.08);padding:11px 0}
.nav-inner{display:flex;align-items:center;justify-content:space-between;gap:28px}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.brand__mark{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;border:1px solid var(--accent);color:var(--accent);font-family:var(--display);font-size:16px;letter-spacing:.02em;flex:none}
.brand__text{display:flex;flex-direction:column;font-size:13px;letter-spacing:.02em;line-height:1.15;white-space:nowrap}
.brand__text em{font-style:normal;color:rgba(244,240,232,.5);font-size:10px;letter-spacing:.14em;text-transform:uppercase;margin-top:3px}
.nav-links{display:flex;gap:30px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,240,232,.66)}
.nav-links a{position:relative;padding:4px 0;transition:color .25s}
.nav-links a::after{content:"";position:absolute;left:0;right:100%;bottom:0;height:1px;background:var(--accent);transition:right .3s ease}
.nav-links a:hover{color:#fff}
.nav-links a:hover::after{right:0}
.nav-status{display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border:1px solid rgba(255,255,255,.16);border-radius:999px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,240,232,.78)}
.nav-status i{width:6px;height:6px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px rgba(255,77,61,.12)}
.billboard{position:relative;min-height:min(100vh,860px);display:flex;flex-direction:column;justify-content:center;padding:150px 0 40px;overflow:hidden;isolation:isolate}
.billboard__glow{position:absolute;inset:-20% -10% auto;height:120%;z-index:-2;background:radial-gradient(56% 50% at 76% 32%,rgba(255,77,61,.3),transparent 68%),radial-gradient(40% 40% at 18% 8%,rgba(90,70,200,.16),transparent 70%)}
.billboard__ghost{position:absolute;right:-2vw;bottom:-14vw;z-index:-1;font-family:var(--display);font-size:48vw;line-height:.7;color:rgba(255,255,255,.022);letter-spacing:-.04em;pointer-events:none;user-select:none}
.billboard__grid{display:grid;grid-template-columns:1.15fr .85fr;gap:48px;align-items:center;flex:1}
.eyebrow{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,240,232,.62);margin-bottom:28px}
.pulse{width:7px;height:7px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 0 rgba(255,77,61,.5);animation:pulse 2.4s infinite}
@keyframes pulse{0%{box-shadow:0 0 0 0 rgba(255,77,61,.4)}70%{box-shadow:0 0 0 12px rgba(255,77,61,0)}100%{box-shadow:0 0 0 0 rgba(255,77,61,0)}}
.billboard h1{font-family:var(--display);font-size:clamp(64px,8.6vw,138px);line-height:.88;letter-spacing:-.025em;max-width:12ch}
.billboard h1 em{font-style:italic;color:var(--accent)}
.billboard__sub{max-width:46ch;margin-top:30px;font-size:16px;line-height:1.7;color:rgba(244,240,232,.62)}
.billboard__actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:38px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;height:50px;padding:0 26px;border-radius:999px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;transition:transform .3s ease,background .3s ease,color .3s ease,border-color .3s;white-space:nowrap}
.btn span{transition:transform .3s ease}
.btn:hover span{transform:translate(2px,-2px)}
.btn--primary{background:var(--accent);color:var(--accent-ink)}
.btn--primary:hover{transform:translateY(-2px);background:#fff;color:#111}
.btn--ghost{border:1px solid rgba(255,255,255,.18);color:var(--fg)}
.btn--ghost:hover{border-color:rgba(255,255,255,.4);background:rgba(255,255,255,.04)}
.play{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.12);font-size:7px;color:var(--accent)}
.billboard__stats{display:flex;gap:36px;margin:48px 0 0;flex-wrap:wrap}
.billboard__stats div{position:relative;padding-left:0}
.billboard__stats dt{font-family:var(--display);font-size:34px;line-height:1}
.billboard__stats dd{margin:6px 0 0;font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(244,240,232,.45)}
.billboard__poster{position:relative;height:min(64vh,560px);display:grid;place-items:center}
.hero-card{position:absolute;width:min(320px,72%);aspect-ratio:3/4.1;border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.14);box-shadow:0 40px 90px rgba(0,0,0,.55);transform:rotate(2.5deg);animation:float 9s ease-in-out infinite}
.hero-card .poster{position:absolute;inset:0;height:100%}
.hero-card--back{inset:auto;transform:rotate(-6deg) translate(-38px,18px);opacity:.65;filter:saturate(.7);animation:none;width:min(290px,66%)}
.hero-card__caption{position:absolute;z-index:3;inset:auto 20px 20px;padding-top:18px;border-top:1px solid rgba(255,255,255,.18);display:flex;flex-direction:column;gap:5px}
.hero-card__caption .mono{color:rgba(255,255,255,.55)}
.hero-card__caption strong{font-family:var(--display);font-size:26px;font-weight:400;line-height:1.05}
.hero-card__caption small{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.52)}
.hero-monogram{font-family:var(--display);font-size:clamp(140px,20vw,260px);line-height:.8;color:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:24px;width:min(340px,80%);aspect-ratio:3/4;display:grid;place-items:center}
@keyframes float{50%{transform:rotate(1.2deg) translateY(-12px)}}
.billboard__foot{display:flex;justify-content:space-between;align-items:center;gap:16px;padding-top:34px;border-top:1px solid rgba(255,255,255,.08);margin-top:26px;color:rgba(244,240,232,.4)}
.scroll-cue{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase}
.scroll-cue i{width:1px;height:26px;background:linear-gradient(var(--accent),transparent);animation:cue 2.4s ease-in-out infinite}
@keyframes cue{50%{transform:scaleY(.55);opacity:.4}}
.marquee{display:flex;overflow:hidden;border-block:1px solid rgba(255,255,255,.1);padding:20px 0;background:rgba(255,255,255,.018)}
.marquee__track{display:flex;align-items:center;gap:32px;padding-right:32px;flex:none;animation:marquee 42s linear infinite;white-space:nowrap}
.marquee span{font-family:var(--display);font-size:clamp(22px,2.8vw,34px);font-style:italic;color:rgba(244,240,232,.8)}
.marquee i{color:var(--accent);font-style:normal;font-size:14px}
@keyframes marquee{to{transform:translateX(-100%)}}
.work{padding:110px 0 80px;overflow:hidden}
.work__head{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:44px}
.work__head h2{font-family:var(--display);font-size:clamp(38px,5vw,64px);line-height:1;margin-top:16px}
.work__head h2 em{font-style:italic;color:var(--accent)}
.mono{color:rgba(244,240,232,.42)}
.row-controls{display:flex;gap:10px}
.row-controls button{width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.16);color:rgba(244,240,232,.8);transition:background .25s,color .25s,border-color .25s}
.row-controls button:hover{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.film-row{display:flex;gap:22px;overflow-x:auto;padding:8px max(32px,calc((100vw - 1280px)/2)) 24px;scroll-snap-type:x mandatory;scrollbar-width:none}
.film-row::-webkit-scrollbar{display:none}
.film-card{flex:0 0 clamp(250px,26vw,330px);scroll-snap-align:start}
.film-card__frame{position:relative;display:block;aspect-ratio:4/5;border-radius:14px;overflow:hidden;border:1px solid rgba(255,255,255,.12);transition:transform .5s cubic-bezier(.16,1,.3,1),border-color .4s,box-shadow .5s}
.film-card__frame .poster{position:absolute;inset:0;transition:transform .8s cubic-bezier(.16,1,.3,1)}
.film-card__frame:hover{transform:translateY(-8px);border-color:rgba(255,255,255,.28);box-shadow:0 30px 60px rgba(0,0,0,.5)}
.film-card__frame:hover .poster{transform:scale(1.055)}
.film-card__genre{position:absolute;z-index:3;top:14px;right:14px;padding:6px 10px;border-radius:999px;background:rgba(8,8,10,.55);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.75)}
.film-card__play{position:absolute;z-index:3;left:16px;bottom:16px;display:inline-flex;align-items:center;gap:8px;padding:9px 14px;border-radius:999px;background:rgba(244,240,232,.92);color:#111;font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;opacity:0;transform:translateY(8px);transition:opacity .35s ease,transform .35s ease}
.film-card__play b{font-weight:400;color:var(--accent)}
.film-card__frame:hover .film-card__play{opacity:1;transform:none}
.film-card__meta{display:flex;justify-content:space-between;gap:16px;padding:18px 4px 0}
.film-card__meta h3{font-family:var(--display);font-size:23px;line-height:1.15}
.film-card__meta p{margin-top:7px;font-size:12.5px;line-height:1.6;color:rgba(244,240,232,.52);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.film-card__year{font-family:var(--mono);font-size:10px;color:rgba(244,240,232,.4);padding-top:5px}
.spotlight{padding:40px 0 100px}
.spotlight__grid{display:grid;grid-template-columns:1fr 1.05fr;gap:60px;align-items:center;padding:56px;border:1px solid rgba(255,255,255,.1);border-radius:24px;background:linear-gradient(140deg,rgba(255,255,255,.045),rgba(255,255,255,.008));position:relative;overflow:hidden}
.spotlight__grid::before{content:"";position:absolute;inset:auto -30% -60% auto;width:70%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(255,77,61,.16),transparent 65%);pointer-events:none}
.spotlight__copy{position:relative;z-index:1}
.spotlight__copy h2{font-family:var(--display);font-size:clamp(40px,5.2vw,72px);line-height:.98;margin:22px 0 20px}
.spotlight__blurb{max-width:44ch;color:rgba(244,240,232,.58);line-height:1.75;font-size:14.5px}
.tag-row{display:flex;flex-wrap:wrap;gap:8px;margin:26px 0 32px}
.tag-row span{padding:7px 12px;border:1px solid rgba(255,255,255,.14);border-radius:999px;font-family:var(--mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,240,232,.6)}
.spotlight__art{position:relative;border-radius:18px;overflow:hidden;aspect-ratio:16/11;border:1px solid rgba(255,255,255,.14)}
.spotlight__art .poster{position:absolute;inset:0}
.spotlight__stamp{position:absolute;z-index:3;bottom:18px;left:18px;padding:8px 12px;border-radius:999px;background:rgba(8,8,10,.6);border:1px solid rgba(255,255,255,.18);backdrop-filter:blur(8px);font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase}
.story{padding:100px 0;border-top:1px solid rgba(255,255,255,.08)}
.story__grid{display:grid;grid-template-columns:180px 1fr 240px;gap:56px;align-items:start}
.story__side{position:sticky;top:110px}
.story__num{display:block;margin-top:26px;font-family:var(--display);font-size:72px;line-height:1;color:rgba(255,255,255,.07)}
.story__main h2{font-family:var(--display);font-size:clamp(36px,4.6vw,60px);line-height:1.02;max-width:18ch}
.story__main h2 em{font-style:italic;color:var(--accent)}
.story blockquote{margin:34px 0;font-family:var(--display);font-size:clamp(22px,2.6vw,30px);line-height:1.35;font-style:italic;color:rgba(244,240,232,.78);border-left:2px solid var(--accent);padding-left:24px}
.story__body p{font-size:14.5px;line-height:1.85;color:rgba(244,240,232,.56);margin-bottom:16px;max-width:58ch}
.story__facts{display:grid;gap:20px;border-top:1px solid rgba(255,255,255,.12);padding-top:20px}
.story__facts dt{font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:rgba(244,240,232,.38)}
.story__facts dd{margin:5px 0 0;font-size:13px;color:rgba(244,240,232,.82)}
.genres{padding:0 0 100px}
.genres__grid{display:grid;grid-template-columns:180px 1fr;gap:56px;border-top:1px solid rgba(255,255,255,.08);padding-top:42px}
.genres__cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:34px}
.genre h3{font-family:var(--display);font-size:22px;margin-bottom:14px;color:var(--accent)}
.genre li{font-size:12px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.07);color:rgba(244,240,232,.58)}
.seasons{padding:90px 0;border-top:1px solid rgba(255,255,255,.08)}
.seasons__head{margin-bottom:40px}
.seasons__head h2{font-family:var(--display);font-size:clamp(34px,4.2vw,52px);line-height:1.05;margin-top:16px}
.seasons__head em{font-style:italic;color:var(--accent)}
.season{display:grid;grid-template-columns:56px 130px 1fr 1.1fr;gap:26px;align-items:baseline;padding:26px 0;border-top:1px solid rgba(255,255,255,.1);transition:background .3s,padding .3s}
.season:last-child{border-bottom:1px solid rgba(255,255,255,.1)}
.season__no{font-family:var(--mono);font-size:10px;color:rgba(244,240,232,.28)}
.season__period{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:rgba(244,240,232,.46)}
.season__role h3{font-family:var(--display);font-size:24px;line-height:1.1}
.season__role p{font-size:11px;margin-top:5px;color:var(--accent);letter-spacing:.04em}
.season__summary{font-size:13px;line-height:1.7;color:rgba(244,240,232,.5)}
.contact{position:relative;padding:110px 0 40px;overflow:hidden;border-top:1px solid rgba(255,255,255,.08);background:radial-gradient(60% 60% at 50% 110%,rgba(255,77,61,.14),transparent 70%)}
.contact__inner h2{font-family:var(--display);font-size:clamp(46px,7.4vw,110px);line-height:.94;max-width:15ch;margin:26px 0 28px}
.contact__inner h2 em{font-style:italic;color:var(--accent)}
.contact__blurb{max-width:52ch;font-size:15px;line-height:1.75;color:rgba(244,240,232,.55)}
.contact__mail{display:inline-flex;align-items:center;gap:14px;margin:38px 0 44px;font-family:var(--display);font-size:clamp(24px,3.6vw,44px);border-bottom:1px solid rgba(255,255,255,.25);padding-bottom:8px;transition:color .3s,border-color .3s}
.contact__mail span{font-size:.6em;color:var(--accent);transition:transform .3s}
.contact__mail:hover{color:var(--accent);border-color:var(--accent)}
.contact__mail:hover span{transform:translate(4px,-4px)}
.contact__meta{display:flex;flex-wrap:wrap;gap:20px 36px;justify-content:space-between;align-items:center;border-top:1px solid rgba(255,255,255,.1);padding-top:24px}
.socials{display:flex;flex-wrap:wrap;gap:20px}
.socials a{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,240,232,.55);transition:color .25s}
.socials a:hover{color:var(--accent)}
.contact__note{font-size:11px;color:rgba(244,240,232,.35)}
.footer-mark{margin-top:60px;padding:0 24px;font-family:var(--display);font-size:clamp(80px,17vw,260px);line-height:.78;letter-spacing:-.04em;text-align:center;color:transparent;-webkit-text-stroke:1px rgba(255,255,255,.1);white-space:nowrap;overflow:hidden}
.site-footer{display:flex;justify-content:space-between;flex-wrap:wrap;gap:14px;padding:30px 0;border-top:1px solid rgba(255,255,255,.08);margin-top:30px;font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,240,232,.3)}
@media (max-width:1080px){
  .billboard__grid{grid-template-columns:1fr;padding-top:70px}
  .billboard__poster{display:none}
  .story__grid{grid-template-columns:1fr;gap:30px}
  .story__side{position:static;display:flex;justify-content:space-between;align-items:baseline}
  .story__num{font-size:52px;margin:0}
  .story__facts{grid-template-columns:repeat(3,1fr)}
  .genres__grid{grid-template-columns:1fr;gap:24px}
  .spotlight__grid{grid-template-columns:1fr;padding:34px;gap:34px}
  .season{grid-template-columns:40px 1fr;gap:10px 18px}
  .season__period{grid-column:2}
  .season__role{grid-column:2}
  .season__summary{grid-column:2}
}
@media (max-width:760px){
  .nav-links{display:none}
  .nav-status{font-size:8px;padding:8px 10px;max-width:46vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .billboard{padding-top:120px;min-height:auto}
  .billboard__stats{gap:24px;margin-top:36px}
  .billboard__stats dt{font-size:26px}
  .billboard__foot{flex-wrap:wrap}
  .billboard__foot .scroll-cue{display:none}
  .work{padding-top:80px}
  .film-card{flex-basis:76vw}
  .story,.seasons{padding:70px 0}
  .story__facts{grid-template-columns:1fr 1fr}
  .contact{padding-top:80px}
  .site-footer{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "cinema",
    css,
    body,
    fonts: [
      "Instrument Serif:ital@0;1",
      "Inter:wght@300;400;500;600",
      "JetBrains Mono:wght@400;500",
    ],
    background: "#08080a",
    foreground: "#f4f0e8",
  });
}

