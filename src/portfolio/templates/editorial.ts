import type { Portfolio } from "../types";
import {
  accentWords,
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

export function renderEditorial(portfolio: Portfolio): string {
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];
  const index = portfolio.projects.slice(0, 6);

  const body = `<header class="topbar">
    <div class="container topbar__inner">
      <a class="wordmark" href="#top">${esc(portfolio.name)}<span>Portfolio</span></a>
      <nav>${navLinks(portfolio)}</nav>
      <span class="topbar__issue">Issue 01 · <span data-year></span></span>
    </div>
  </header>

  <main id="top">
    <section class="cover">
      <div class="container">
        <div class="cover__meta" data-reveal>
          <span>${esc(portfolio.hero.kicker)}</span>
          <span>${esc(portfolio.location)}</span>
          <span>${esc(portfolio.role)}</span>
          <span>${esc(portfolio.availability)}</span>
        </div>
        <h1 class="cover__title" data-reveal>${accentWords(portfolio.hero.title, 2)}</h1>
        <div class="cover__row">
          <p class="cover__lede" data-reveal style="--d:.1s">${esc(portfolio.hero.subtitle)}</p>
          <div class="cover__aside" data-reveal style="--d:.16s">
            <p>${esc(portfolio.about.pullQuote)}</p>
            <a class="read-link" href="#work">${esc(portfolio.hero.primaryCta)} <span>↘</span></a>
          </div>
        </div>
      </div>

      ${
        featured
          ? `<div class="container feature" data-reveal>
            <a class="feature__art" href="${attr(featured.link || "#work")}"${
              featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
            }>
              ${projectArt(featured, 0, portfolio.accent)}
              <span class="feature__badge">Cover story</span>
            </a>
            <div class="feature__note">
              <span class="label">${esc(featured.category)} — ${esc(featured.year)}</span>
              <h2>${esc(featured.title)}</h2>
              <p>${esc(featured.blurb)}</p>
              <a class="read-link" href="${attr(featured.link || "#contact")}"${
                featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              }>Read the story <span>→</span></a>
            </div>
          </div>`
          : ""
      }
    </section>

    <section class="index" id="work">
      <div class="container">
        <div class="section-head" data-reveal>
          <span class="label">01 — Selected work</span>
          <h2>Contents</h2>
          <span class="page">${pad(portfolio.projects.length)} entries</span>
        </div>
        <div class="index__list">
          ${index
            .map(
              (project, i) => `<a class="entry" href="${attr(project.link || "#contact")}"${
                project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              } data-reveal style="--d:${i * 45}ms">
                <span class="entry__num">${pad(i + 1)}</span>
                <span class="entry__title">${esc(project.title)}</span>
                <span class="entry__cat">${esc(project.category)}</span>
                <span class="entry__year">${esc(project.year || "—")}</span>
                <span class="entry__thumb">${projectArt(project, i, portfolio.accent)}</span>
                <span class="entry__arrow">↗</span>
              </a>`,
            )
            .join("")}
          ${
            portfolio.projects.length > index.length
              ? `<p class="index__more">Plus ${portfolio.projects.length - index.length} more in the studio.</p>`
              : ""
          }
        </div>
      </div>
    </section>

    <section class="about" id="about">
      <div class="container about__grid">
        <div class="about__intro" data-reveal>
          <span class="label">02 — About</span>
          <h2>${accentWords(portfolio.about.heading, 2)}</h2>
          <span class="signature">${esc(portfolio.initials)}</span>
        </div>
        <div class="about__copy" data-reveal style="--d:.08s">
          ${paragraphs(portfolio.about.body)}
          <blockquote>“${esc(portfolio.about.pullQuote)}”</blockquote>
        </div>
        <aside class="about__facts" data-reveal style="--d:.14s">
          ${portfolio.about.facts
            .map((fact) => `<div><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></div>`)
            .join("")}
        </aside>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="practice">
          <div class="container practice__grid">
            <span class="label" data-reveal>03 — Practice</span>
            <div class="practice__cols">
              ${portfolio.skills
                .map(
                  (group) => `<div data-reveal><h3>${esc(group.label)}</h3><p>${group.items
                    .map(esc)
                    .join(", ")}</p></div>`,
                )
                .join("")}
            </div>
          </div>
        </section>`
        : ""
    }

    ${
      portfolio.experience.length
        ? `<section class="career" id="experience">
          <div class="container">
            <div class="section-head" data-reveal>
              <span class="label">04 — Curriculum</span>
              <h2>Where I've been</h2>
              <span class="page">${pad(portfolio.experience.length)} entries</span>
            </div>
            <div class="career__list">
              ${portfolio.experience
                .map(
                  (job, i) => `<div class="career__row" data-reveal style="--d:${i * 40}ms">
                    <span>${esc(job.period)}</span>
                    <h3>${esc(job.role)}</h3>
                    <p class="career__company">${esc(job.company)}</p>
                    <p class="career__summary">${esc(job.summary)}</p>
                  </div>`,
                )
                .join("")}
            </div>
          </div>
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__grid">
        <div data-reveal>
          <span class="label">05 — Correspondence</span>
          <h2>${accentWords(portfolio.contact.heading, 2)}</h2>
        </div>
        <div class="contact__side" data-reveal style="--d:.1s">
          <p>${esc(portfolio.contact.blurb)}</p>
          <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)} <span>→</span></a>
          ${socialLinks(portfolio, "socials")}
          <span class="contact__note">${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <footer class="colophon container">
        <span>${esc(portfolio.name)} — ${esc(portfolio.role)}</span>
        <span>${esc(portfolio.location)}</span>
        <span>Portfolio Studio · <span data-year></span></span>
      </footer>
    </section>
  </main>`;

  const css = `
:root{--rule:rgba(30,27,23,.18);--muted:rgba(30,27,23,.58)}
body{--display:'Newsreader',Georgia,serif;--sans:'Work Sans',system-ui,sans-serif;background:#f3ede1;background-image:radial-gradient(120% 80% at 20% 0%,rgba(255,255,255,.55),transparent 60%)}
.topbar{position:relative;border-bottom:1px solid var(--rule);padding:18px 0}
.topbar__inner{display:flex;align-items:center;justify-content:space-between;gap:24px}
.wordmark{display:flex;align-items:baseline;gap:10px;font-family:var(--display);font-size:24px;letter-spacing:-.02em}
.wordmark span{font-family:var(--mono);font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}
.topbar nav{display:flex;gap:28px;font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase}
.topbar nav a{position:relative;padding-bottom:3px}
.topbar nav a::after{content:"";position:absolute;left:0;right:100%;bottom:0;height:1px;background:var(--accent);transition:right .3s}
.topbar nav a:hover::after{right:0}
.topbar__issue{font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.cover{padding:56px 0 0}
.cover__meta{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid var(--rule);padding-bottom:14px;font-family:var(--mono);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);flex-wrap:wrap}
.cover__title{font-family:var(--display);font-size:clamp(52px,9vw,142px);line-height:.88;letter-spacing:-.035em;max-width:15ch;margin:clamp(26px,5vw,64px) 0 clamp(26px,4vw,48px)}
.cover__title em{font-style:italic;color:var(--accent)}
.cover__row{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:start;padding-bottom:56px;border-bottom:1px solid var(--rule)}
.cover__lede{font-family:var(--display);font-size:clamp(20px,2.1vw,27px);line-height:1.45;max-width:40ch;color:rgba(30,27,23,.78);font-style:italic}
.cover__aside{display:flex;flex-direction:column;gap:22px;padding-top:6px}
.cover__aside p{font-size:12px;line-height:1.9;color:var(--muted);max-width:38ch;border-left:2px solid var(--accent);padding-left:16px}
.read-link{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;border-bottom:1px solid rgba(30,27,23,.4);padding-bottom:6px;width:fit-content;transition:color .3s,border-color .3s}
.read-link:hover{color:var(--accent);border-color:var(--accent)}
.feature{display:grid;grid-template-columns:1.35fr .65fr;gap:0;margin-top:56px;border:1px solid var(--rule);background:#f7f2e8;box-shadow:0 24px 60px rgba(40,32,20,.09)}
.feature__art{position:relative;display:block;aspect-ratio:16/10;overflow:hidden;border-right:1px solid var(--rule)}
.feature__art .poster{position:absolute;inset:0;transition:transform .8s cubic-bezier(.16,1,.3,1)}
.feature__art:hover .poster{transform:scale(1.03)}
.feature__badge{position:absolute;z-index:3;top:18px;left:18px;background:#f3ede1;color:#1e1b17;padding:7px 11px;font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase}
.feature__note{padding:clamp(24px,3vw,42px);display:flex;flex-direction:column;justify-content:center;gap:16px}
.label{font-family:var(--mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.feature__note h2{font-family:var(--display);font-size:clamp(28px,3vw,38px);line-height:1.05}
.feature__note p{font-size:12px;line-height:1.85;color:var(--muted)}
.index{padding:80px 0}
.section-head{display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:20px;border-bottom:2px solid rgba(30,27,23,.7);padding-bottom:16px;margin-bottom:10px}
.section-head h2{font-family:var(--display);font-size:clamp(30px,4vw,46px);line-height:1;text-align:center;font-style:italic}
.section-head .page{text-align:right;font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.entry{display:grid;grid-template-columns:52px 1fr 190px 64px 74px 24px;align-items:center;gap:18px;padding:20px 4px;border-bottom:1px solid var(--rule);transition:background .3s,padding .3s}
.entry:hover{background:rgba(255,255,255,.4);padding-left:14px}
.entry__num{font-family:var(--mono);font-size:9px;color:var(--muted)}
.entry__title{font-family:var(--display);font-size:clamp(24px,2.8vw,36px);line-height:1.1;transition:color .3s}
.entry:hover .entry__title{color:var(--accent)}
.entry__cat{font-family:var(--mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.entry__year{font-family:var(--mono);font-size:9px;color:var(--muted)}
.entry__thumb{position:relative;width:74px;height:52px;overflow:hidden;border:1px solid var(--rule)}
.entry__thumb .poster{position:absolute;inset:0}
.entry__arrow{font-size:16px;color:var(--accent);justify-self:end;transition:transform .3s}
.entry:hover .entry__arrow{transform:translate(2px,-2px)}
.index__more{margin-top:22px;font-family:var(--display);font-style:italic;font-size:18px;color:var(--muted)}
.about{padding:70px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);background:rgba(255,255,255,.28)}
.about__grid{display:grid;grid-template-columns:1fr 1.2fr .55fr;gap:clamp(30px,5vw,70px)}
.about__intro h2{font-family:var(--display);font-size:clamp(34px,4.2vw,54px);line-height:1.02;margin:22px 0 30px}
.about__intro h2 em{font-style:italic;color:var(--accent)}
.signature{font-family:var(--display);font-size:64px;font-style:italic;color:var(--accent);line-height:1;opacity:.5}
.about__copy{font-size:12.5px;line-height:1.95;color:rgba(30,27,23,.7);display:grid;gap:16px}
.about__copy p:first-child::first-letter{float:left;font-family:var(--display);font-size:58px;line-height:.8;padding:4px 8px 0 0;color:var(--accent)}
.about__copy blockquote{font-family:var(--display);font-size:20px;line-height:1.5;font-style:italic;border-top:1px solid var(--rule);padding-top:20px;margin-top:8px;color:rgba(30,27,23,.85)}
.about__facts{display:flex;flex-direction:column;gap:18px;border-left:1px solid var(--rule);padding-left:22px}
.about__facts span{display:block;font-family:var(--mono);font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.about__facts strong{font-weight:400;font-size:12px}
.practice{padding:60px 0;border-bottom:1px solid var(--rule)}
.practice__grid{display:grid;grid-template-columns:200px 1fr;gap:40px}
.practice__cols{display:grid;grid-template-columns:repeat(3,1fr);gap:30px}
.practice__cols h3{font-family:var(--display);font-size:22px;margin-bottom:10px}
.practice__cols p{font-size:11.5px;line-height:1.8;color:var(--muted)}
.career{padding:80px 0}
.career__row{display:grid;grid-template-columns:130px 1.1fr .8fr 1.4fr;gap:24px;padding:20px 0;border-bottom:1px solid var(--rule);align-items:baseline}
.career__row>span{font-family:var(--mono);font-size:8px;letter-spacing:.12em;color:var(--muted)}
.career__row h3{font-family:var(--display);font-size:22px;line-height:1.2;font-weight:400}
.career__company{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.career__summary{font-size:11.5px;line-height:1.75;color:var(--muted)}
.contact{padding:80px 0 0;border-top:1px solid var(--rule);background:linear-gradient(180deg,rgba(255,255,255,.28),transparent)}
.contact__grid{display:grid;grid-template-columns:1.2fr .8fr;gap:60px;align-items:start;padding-bottom:60px}
.contact h2{font-family:var(--display);font-size:clamp(40px,5.6vw,76px);line-height:.98;letter-spacing:-.02em;margin-top:24px;max-width:14ch}
.contact h2 em{font-style:italic;color:var(--accent)}
.contact__side p{font-size:12.5px;line-height:1.9;color:var(--muted);max-width:44ch}
.contact__mail{display:inline-flex;gap:12px;align-items:center;margin:26px 0 22px;font-family:var(--display);font-size:clamp(22px,2.8vw,34px);border-bottom:1px solid rgba(30,27,23,.35);padding-bottom:4px;transition:color .3s,border-color .3s}
.contact__mail:hover{color:var(--accent);border-color:var(--accent)}
.socials{display:flex;gap:20px;margin-bottom:22px;flex-wrap:wrap}
.socials a{font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--rule);padding-bottom:3px}
.socials a:hover{color:var(--accent)}
.contact__note{display:block;font-size:10px;color:var(--muted);font-style:italic}
.colophon{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;border-top:2px solid rgba(30,27,23,.7);padding:22px 0;margin-top:20px;font-family:var(--mono);font-size:7.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
@media (max-width:1024px){
  .topbar nav{display:none}
  .cover__row,.about__grid,.contact__grid{grid-template-columns:1fr;gap:30px}
  .about__facts{flex-direction:row;border-left:0;border-top:1px solid var(--rule);padding:20px 0 0;flex-wrap:wrap;gap:24px}
  .feature{grid-template-columns:1fr}
  .feature__art{border-right:0;border-bottom:1px solid var(--rule)}
  .practice__grid{grid-template-columns:1fr;gap:20px}
  .career__row{grid-template-columns:100px 1fr 1fr;gap:14px}
  .career__summary{grid-column:2 / -1}
  .entry{grid-template-columns:36px 1fr 70px 24px}
  .entry__cat,.entry__thumb{display:none}
}
@media (max-width:720px){
  .cover__meta span:nth-child(3),.cover__meta span:nth-child(4){display:none}
  .cover__title{font-size:clamp(42px,12.5vw,72px)}
  .feature__note{padding:22px}
  .section-head{grid-template-columns:1fr;gap:8px}
  .section-head h2{text-align:left}
  .section-head .page{text-align:left}
  .entry{grid-template-columns:28px 1fr 22px;gap:12px;padding:16px 0}
  .entry__year{display:none}
  .practice__cols{grid-template-columns:1fr}
  .career__row{grid-template-columns:1fr;gap:6px;padding:18px 0}
  .career__summary{grid-column:auto}
  .colophon{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "editorial",
    css,
    body,
    fonts: ["Newsreader:ital,opsz,wght@0,6..72,400;1,6..72,400", "Work Sans:wght@300;400;500", "JetBrains Mono:wght@400"],
    background: "#f3ede1",
    foreground: "#1e1b17",
  });
}
