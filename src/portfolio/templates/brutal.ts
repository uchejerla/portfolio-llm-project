import type { Portfolio } from "../types";
import {
  accentWords,
  attr,
  emailHref,
  esc,
  navLinks,
  pad,
  projectArt,
  renderShell,
  socialLinks,
} from "./common";

export function renderBrutal(portfolio: Portfolio): string {
  const ticker = portfolio.hero.marquee || `${portfolio.name} — ${portfolio.role}`;
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];

  const body = `<div class="ticker" aria-hidden="true">
    <div>${Array.from({ length: 5 })
      .map((_, i) => `<span>${esc(ticker)}</span><b>${i % 2 ? "✳" : "■"}</b>`)
      .join("")}</div>
  </div>

  <header class="nav">
    <a class="nav__brand" href="#top">${esc(portfolio.initials)}<span>${esc(portfolio.name)}</span></a>
    <nav>${navLinks(portfolio)}</nav>
    <a class="nav__status" href="#contact">${esc(portfolio.availability)} <i></i></a>
  </header>

  <main id="top">
    <section class="hero">
      <div class="hero__label"><span>${esc(portfolio.hero.kicker)}</span><span>${esc(portfolio.location)}</span></div>
      <h1 data-reveal><span>${esc(portfolio.name.split(" ")[0] ?? portfolio.name)}</span><span class="outline">${esc(
        portfolio.name.split(" ").slice(1).join(" ") || portfolio.role,
      )}</span></h1>
      <div class="hero__grid">
        <div class="hero__manifesto" data-reveal style="--d:.08s">
          <p>${esc(portfolio.hero.subtitle)}</p>
          <div class="hero__actions">
            <a class="block-btn" href="#work">${esc(portfolio.hero.primaryCta)} ↓</a>
            <a class="block-btn block-btn--outline" href="#contact">${esc(portfolio.hero.secondaryCta)}</a>
          </div>
        </div>
        <div class="hero__stats" data-reveal style="--d:.16s">
          ${portfolio.hero.stats
            .map(
              (stat) => `<div><b>${esc(stat.value)}</b><span>${esc(stat.label)}</span></div>`,
            )
            .join("")}
        </div>
      </div>
      ${
        featured
          ? `<div class="hero__feature" data-reveal style="--d:.2s">
            <span class="hero__feature-tag">Featured ↓</span>
            ${projectArt(featured, 0, portfolio.accent)}
            <div class="hero__feature-info">
              <h2>${esc(featured.title)}</h2>
              <p>${esc(featured.blurb)}</p>
              <span>${esc(featured.category)} / ${esc(featured.year || "2026")}</span>
            </div>
          </div>`
          : ""
      }
    </section>

    <section class="work" id="work">
      <div class="work__head">
        <h2>[ SELECTED WORK ]</h2>
        <span>${pad(portfolio.projects.length)} ENTRIES — <span data-year></span></span>
      </div>
      <div class="work__grid">
        ${portfolio.projects
          .map(
            (project, i) => `<article class="card" data-reveal style="--d:${i * 50}ms">
              <div class="card__top"><span>/ ${pad(i + 1)}</span><span>${esc(project.year || "—")}</span></div>
              <a class="card__art" href="${attr(project.link || "#contact")}"${
                project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              }>${projectArt(project, i, portfolio.accent)}</a>
              <h3>${esc(project.title)}</h3>
              <p>${esc(project.blurb)}</p>
              <div class="card__foot">
                <span>${esc(project.category)}</span>
                <a href="${attr(project.link || "#contact")}"${
                  project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
                } aria-label="Open ${attr(project.title)}">↗</a>
              </div>
            </article>`,
          )
          .join("")}
      </div>
    </section>

    <section class="about" id="about">
      <div class="about__label">[ ABOUT ]</div>
      <div class="about__main" data-reveal>
        <h2>${accentWords(portfolio.about.heading, 2)}</h2>
        <blockquote>“${esc(portfolio.about.pullQuote)}”</blockquote>
      </div>
      <div class="about__body" data-reveal style="--d:.1s">
        ${portfolio.about.body.map((item) => `<p>${esc(item)}</p>`).join("")}
      </div>
      <div class="about__facts">
        ${portfolio.about.facts
          .map((fact) => `<div><span>${esc(fact.label)}</span><b>${esc(fact.value)}</b></div>`)
          .join("")}
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<div class="skill-ticker" aria-hidden="true">
          <div>${Array.from({ length: 3 })
            .map(
              () =>
                `<span>${portfolio.skills
                  .flatMap((group) => group.items)
                  .map(esc)
                  .join(" / ")}</span><b>✳</b>`,
            )
            .join("")}</div>
        </div>`
        : ""
    }

    ${
      portfolio.experience.length
        ? `<section class="cv" id="experience">
          <div class="cv__head"><h2>[ RECORD ]</h2><span>ROLES &amp; TENURES</span></div>
          ${portfolio.experience
            .map(
              (job, i) => `<div class="cv__row" data-reveal style="--d:${i * 40}ms">
                <span class="cv__num">${pad(i + 1)}</span>
                <span class="cv__period">${esc(job.period)}</span>
                <h3>${esc(job.role)}</h3>
                <p class="cv__company">${esc(job.company)}</p>
                <p class="cv__summary">${esc(job.summary)}</p>
              </div>`,
            )
            .join("")}
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="contact__intro">
        <span>[ NEXT ]</span>
        <h2>${accentWords(portfolio.contact.heading, 2)}</h2>
        <p>${esc(portfolio.contact.blurb)}</p>
      </div>
      <div class="contact__board" data-reveal>
        <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)}</a>
        ${socialLinks(portfolio, "socials")}
        <span class="contact__note">${esc(portfolio.contact.note)}</span>
      </div>
      <footer class="foot">
        <span>${esc(portfolio.name)} / ${esc(portfolio.role)}</span>
        <span>${esc(portfolio.location)}</span>
        <span>NO RIGHTS RESERVED — <span data-year></span> / PORTFOLIO STUDIO</span>
      </footer>
    </section>
  </main>`;

  const css = `
body{--display:'Archivo Black',Impact,sans-serif;--sans:'Space Mono',monospace;--mono:'Space Mono',monospace;background:#111;background-image:linear-gradient(rgba(255,255,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.025) 1px,transparent 1px);background-size:64px 64px;color:#f2f0e7;font-family:var(--mono)}
.ticker{background:var(--accent);color:var(--accent-ink);overflow:hidden;border-bottom:2px solid #111;position:sticky;top:0;z-index:70}
.ticker div{display:flex;align-items:center;gap:26px;padding:8px 0;white-space:nowrap;animation:ticker 30s linear infinite}
.ticker span{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;font-weight:700}
.ticker b{font-size:9px}
@keyframes ticker{to{transform:translateX(-50%)}}
.nav{display:grid;grid-template-columns:1fr auto 1fr;align-items:stretch;border-bottom:2px solid #f2f0e7;position:sticky;top:34px;z-index:60;background:#111}
.nav__brand{display:flex;align-items:center;gap:12px;padding:14px 20px;font-family:var(--display);font-size:15px;letter-spacing:0;border-right:2px solid #f2f0e7;min-width:0}
.nav__brand span{font-family:var(--mono);font-size:9px;letter-spacing:.14em;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nav nav{display:flex}
.nav nav a{padding:16px 22px;border-right:1px solid rgba(242,240,231,.28);font-size:9px;letter-spacing:.14em;text-transform:uppercase;transition:background .2s,color .2s}
.nav nav a:hover{background:var(--accent);color:var(--accent-ink)}
.nav__status{justify-self:end;display:flex;align-items:center;gap:10px;padding:0 20px;font-size:8px;letter-spacing:.12em;text-transform:uppercase;border-left:2px solid #f2f0e7}
.nav__status i{width:8px;height:8px;background:var(--accent);display:block}
.hero{border-bottom:2px solid #f2f0e7}
.hero__label{display:flex;justify-content:space-between;gap:20px;padding:10px 20px;border-bottom:1px solid rgba(242,240,231,.3);font-size:8px;letter-spacing:.16em;text-transform:uppercase;flex-wrap:wrap}
.hero h1{font-family:var(--display);font-size:clamp(72px,16.5vw,250px);line-height:.8;letter-spacing:-.03em;text-transform:uppercase;padding:26px 20px 10px;display:flex;flex-direction:column}
.hero h1 .outline{color:transparent;-webkit-text-stroke:2px var(--accent);align-self:flex-end}
.hero__grid{display:grid;grid-template-columns:1.4fr .6fr;border-top:2px solid #f2f0e7}
.hero__manifesto{padding:26px 20px 30px;border-right:2px solid #f2f0e7;display:flex;flex-direction:column;justify-content:space-between;gap:30px}
.hero__manifesto p{max-width:52ch;font-family:var(--sans);font-size:14px;line-height:1.75;color:rgba(242,240,231,.65)}
.hero__actions{display:flex;gap:10px;flex-wrap:wrap}
.block-btn{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:var(--accent-ink);padding:14px 18px;border:2px solid var(--accent);font-family:var(--mono);font-size:9px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;box-shadow:4px 4px 0 #f2f0e7;transition:transform .15s,box-shadow .15s}
.block-btn:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 #f2f0e7}
.block-btn--outline{background:transparent;color:#f2f0e7;border-color:#f2f0e7;box-shadow:4px 4px 0 var(--accent)}
.block-btn--outline:hover{box-shadow:2px 2px 0 var(--accent)}
.hero__stats{display:grid;grid-template-rows:repeat(3,1fr)}
.hero__stats div{border-bottom:1px solid rgba(242,240,231,.3);padding:18px 20px;display:flex;flex-direction:column;justify-content:center;gap:4px}
.hero__stats div:last-child{border-bottom:0}
.hero__stats b{font-family:var(--display);font-size:clamp(28px,4vw,44px);line-height:1;font-weight:400}
.hero__stats span{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,240,231,.5)}
.hero__feature{display:grid;grid-template-columns:70px 1fr 1fr;border-top:2px solid #f2f0e7;min-height:280px;position:relative}
.hero__feature-tag{writing-mode:vertical-rl;padding:14px 8px;font-size:8px;letter-spacing:.2em;text-transform:uppercase;border-right:2px solid #f2f0e7;color:rgba(242,240,231,.55)}
.hero__feature .poster{min-height:280px;border-right:2px solid #f2f0e7}
.hero__feature-info{padding:clamp(20px,3vw,36px);display:flex;flex-direction:column;justify-content:center;gap:14px}
.hero__feature-info h2{font-family:var(--display);font-size:clamp(28px,3.6vw,48px);line-height:.95;text-transform:uppercase}
.hero__feature-info p{font-family:var(--sans);font-size:12px;line-height:1.7;color:rgba(242,240,231,.6);max-width:40ch}
.hero__feature-info span{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent)}
.work{padding:0 20px}
.work__head{display:flex;justify-content:space-between;align-items:baseline;gap:20px;padding:22px 0 16px;border-bottom:2px solid #f2f0e7}
.work__head h2{font-family:var(--display);font-size:clamp(24px,3.4vw,38px);letter-spacing:-.01em}
.work__head span{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,240,231,.5)}
.work__grid{display:grid;grid-template-columns:1fr 1fr}
.card{border-bottom:1px solid rgba(242,240,231,.35);padding:18px 0 24px;display:flex;flex-direction:column;gap:12px}
.card:nth-child(odd){padding-right:20px;border-right:1px solid rgba(242,240,231,.35)}
.card:nth-child(even){padding-left:20px}
.card__top{display:flex;justify-content:space-between;font-size:8px;letter-spacing:.14em;color:rgba(242,240,231,.5)}
.card__art{display:block;border:2px solid #f2f0e7;overflow:hidden}
.card__art .poster{aspect-ratio:16/10;transition:transform .5s}
.card__art:hover .poster{transform:scale(1.03)}
.card h3{font-family:var(--display);font-size:clamp(24px,3vw,36px);line-height:1;text-transform:uppercase}
.card>p{font-family:var(--sans);font-size:11.5px;line-height:1.7;color:rgba(242,240,231,.58);max-width:52ch}
.card__foot{display:flex;justify-content:space-between;align-items:center;margin-top:auto;font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:rgba(242,240,231,.55)}
.card__foot a{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(242,240,231,.4);color:var(--accent);font-size:14px;transition:background .2s,color .2s,border-color .2s}
.card__foot a:hover{background:var(--accent);color:var(--accent-ink);border-color:var(--accent)}
.about{border-top:2px solid #f2f0e7;display:grid;grid-template-columns:150px 1.2fr .9fr;grid-template-areas:"label main body" "facts facts facts";gap:0}
.about__label{padding:22px 20px;border-right:1px solid rgba(242,240,231,.35);border-bottom:2px solid #f2f0e7;font-size:9px;letter-spacing:.16em}
.about__main{padding:26px 24px;border-right:1px solid rgba(242,240,231,.35);border-bottom:2px solid #f2f0e7}
.about__main h2{font-family:var(--display);font-size:clamp(30px,4vw,52px);line-height:.95;text-transform:uppercase;max-width:13ch}
.about__main h2 em{font-style:normal;color:var(--accent)}
.about__main blockquote{margin:26px 0 0;font-family:var(--sans);font-size:14px;line-height:1.6;font-style:italic;color:rgba(242,240,231,.7);border-left:4px solid var(--accent);padding-left:14px}
.about__body{padding:26px 24px;border-bottom:2px solid #f2f0e7;display:grid;gap:14px;font-family:var(--sans)}
.about__body p{font-size:12.5px;line-height:1.8;color:rgba(242,240,231,.62)}
.about__facts{grid-area:facts;display:grid;grid-template-columns:repeat(4,1fr)}
.about__facts div{padding:18px 20px;border-right:1px solid rgba(242,240,231,.35);display:flex;flex-direction:column;gap:6px}
.about__facts div:last-child{border-right:0}
.about__facts span{font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(242,240,231,.45)}
.about__facts b{font-family:var(--sans);font-size:12px;font-weight:400}
.skill-ticker{border-top:2px solid #f2f0e7;border-bottom:2px solid #f2f0e7;background:var(--accent);color:var(--accent-ink);overflow:hidden}
.skill-ticker div{display:flex;gap:22px;align-items:center;white-space:nowrap;padding:12px 0;animation:ticker 26s linear infinite}
.skill-ticker span{font-size:10px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}
.skill-ticker b{font-size:12px}
.cv{padding:40px 20px 0}
.cv__head{display:flex;justify-content:space-between;gap:20px;border-bottom:2px solid #f2f0e7;padding-bottom:14px;margin-bottom:4px}
.cv__head h2{font-family:var(--display);font-size:clamp(24px,3.4vw,38px)}
.cv__head span{font-size:8px;letter-spacing:.14em;color:rgba(242,240,231,.45)}
.cv__row{display:grid;grid-template-columns:44px 120px 1.1fr .8fr 1.3fr;gap:18px;align-items:baseline;padding:18px 0;border-bottom:1px solid rgba(242,240,231,.3)}
.cv__num,.cv__period{font-size:8px;letter-spacing:.1em;color:rgba(242,240,231,.45)}
.cv__row h3{font-family:var(--display);font-size:22px;line-height:1.15;text-transform:uppercase;font-weight:400}
.cv__company{font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent)}
.cv__summary{font-family:var(--sans);font-size:11.5px;line-height:1.7;color:rgba(242,240,231,.55)}
.contact{padding:60px 20px 0;border-top:2px solid #f2f0e7;margin-top:40px}
.contact__intro{display:grid;grid-template-columns:1fr 1fr;gap:20px 40px;align-items:end;margin-bottom:36px}
.contact__intro>span{font-size:9px;letter-spacing:.16em;grid-column:1/-1;color:rgba(242,240,231,.45)}
.contact__intro h2{font-family:var(--display);font-size:clamp(40px,7vw,96px);line-height:.85;text-transform:uppercase;letter-spacing:-.02em}
.contact__intro h2 em{font-style:normal;color:transparent;-webkit-text-stroke:2px var(--accent)}
.contact__intro p{font-family:var(--sans);font-size:13px;line-height:1.8;color:rgba(242,240,231,.58);max-width:46ch;justify-self:end}
.contact__board{border:2px solid #f2f0e7;padding:26px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:20px;background:var(--accent);color:var(--accent-ink)}
.contact__mail{font-family:var(--display);font-size:clamp(24px,4.4vw,58px);line-height:1;letter-spacing:-.02em;border-bottom:2px solid currentColor}
.socials{display:flex;gap:14px;flex-wrap:wrap}
.socials a{font-size:8px;letter-spacing:.12em;text-transform:uppercase;border:1px solid currentColor;padding:8px 12px;transition:background .2s,color .2s}
.socials a:hover{background:var(--accent-ink);color:var(--accent)}
.contact__note{width:100%;font-size:8px;letter-spacing:.12em;text-transform:uppercase;border-top:1px solid rgba(0,0,0,.25);padding-top:14px}
.foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:10px;padding:18px 0;font-size:7.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(242,240,231,.4)}
@media (max-width:1024px){
  .nav{grid-template-columns:1fr auto;top:32px}
  .nav nav{display:none}
  .hero__grid{grid-template-columns:1fr}
  .hero__manifesto{border-right:0;border-bottom:2px solid #f2f0e7}
  .hero__stats{grid-template-columns:repeat(3,1fr);grid-template-rows:none}
  .hero__stats div{border-bottom:0;border-right:1px solid rgba(242,240,231,.3)}
  .hero__feature{grid-template-columns:50px 1fr}
  .hero__feature-info{grid-column:1/-1;border-top:2px solid #f2f0e7}
  .about{grid-template-columns:1fr;grid-template-areas:"label" "main" "body" "facts"}
  .about__label,.about__main,.about__body{border-right:0}
  .about__facts{grid-template-columns:1fr 1fr}
  .about__facts div:nth-child(2){border-right:0}
  .cv__row{grid-template-columns:34px 100px 1fr;gap:10px}
  .cv__company{grid-column:3}
  .cv__summary{grid-column:3}
  .contact__intro{grid-template-columns:1fr;align-items:start}
  .contact__intro p{justify-self:start}
  .contact__board{align-items:flex-start;flex-direction:column}
}
@media (max-width:720px){
  .nav__status{display:none}
  .hero h1{font-size:clamp(58px,18vw,120px);padding:20px 14px 6px}
  .hero__stats{grid-template-columns:1fr}
  .hero__stats div{border-right:0;border-bottom:1px solid rgba(242,240,231,.3)}
  .work__grid{grid-template-columns:1fr}
  .card:nth-child(odd){padding-right:0;border-right:0}
  .card:nth-child(even){padding-left:0}
  .about__facts{grid-template-columns:1fr}
  .about__facts div{border-right:0;border-bottom:1px solid rgba(242,240,231,.25)}
  .cv,.contact{padding-left:14px;padding-right:14px}
  .work{padding:0 14px}
  .contact__board{padding:18px}
}
`;
  return renderShell({
    portfolio,
    template: "brutal",
    css,
    body,
    fonts: ["Archivo Black", "Space Mono:wght@400;700"],
    background: "#111111",
    foreground: "#f2f0e7",
  });
}
