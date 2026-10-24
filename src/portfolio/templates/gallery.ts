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

export function renderGallery(portfolio: Portfolio): string {
  const body = `<header class="nav">
    <a class="nav__name" href="#top">${esc(portfolio.name)}</a>
    <nav>${navLinks(portfolio)}</nav>
    <span class="nav__meta">${esc(portfolio.availability)}</span>
  </header>

  <main id="top">
    <section class="hero">
      <div class="container">
        <p class="eyebrow" data-reveal>${esc(portfolio.hero.kicker)}</p>
        <h1 data-reveal>${accentWords(portfolio.hero.title, 2)}</h1>
        <div class="hero__bottom">
          <p data-reveal style="--d:.1s">${esc(portfolio.hero.subtitle)}</p>
          <a class="scroll-link" href="#work" data-reveal style="--d:.16s">Selected work <span>↓</span></a>
        </div>
      </div>
      <span class="hero__side">${esc(portfolio.location)} — <span data-year></span></span>
    </section>

    <section class="plates" id="work">
      <div class="plates__head container">
        <span>Selected work</span>
        <span>${pad(portfolio.projects.length)} pieces</span>
      </div>
      ${portfolio.projects
        .map(
          (project, i) => `<figure class="plate container" data-reveal>
            <a class="plate__image" href="${attr(project.link || "#contact")}"${
              project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
            }>${projectArt(project, i, portfolio.accent)}</a>
            <figcaption class="plate__caption">
              <span class="plate__num">${pad(i + 1)}</span>
              <div class="plate__title">
                <h2>${esc(project.title)}</h2>
                <p>${esc(project.blurb)}</p>
              </div>
              <div class="plate__meta">
                <span>${esc(project.category)}</span>
                <span>${esc(project.year || "—")}</span>
                <a href="${attr(project.link || "#contact")}"${
                  project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
                }>View piece ↗</a>
              </div>
            </figcaption>
          </figure>`,
        )
        .join("")}
    </section>

    <section class="about" id="about">
      <div class="container about__grid">
        <span class="eyebrow" data-reveal>About</span>
        <div class="about__main">
          <h2 data-reveal>${accentWords(portfolio.about.heading, 2)}</h2>
          <blockquote data-reveal style="--d:.08s">${esc(portfolio.about.pullQuote)}</blockquote>
        </div>
        <div class="about__copy" data-reveal style="--d:.12s">${paragraphs(portfolio.about.body)}</div>
        <dl class="about__facts" data-reveal style="--d:.16s">
          ${portfolio.about.facts
            .map((fact) => `<div><dt>${esc(fact.label)}</dt><dd>${esc(fact.value)}</dd></div>`)
            .join("")}
        </dl>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="practice">
          <div class="container practice__grid">
            <span class="eyebrow" data-reveal>Practice</span>
            <div class="practice__list">
              ${portfolio.skills
                .map(
                  (group) => `<div class="practice__row" data-reveal>
                    <h3>${esc(group.label)}</h3>
                    <p>${group.items.map(esc).join(" · ")}</p>
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
        ? `<section class="history" id="experience">
          <div class="container">
            <div class="history__head" data-reveal><span class="eyebrow">History</span><span class="eyebrow">${pad(
              portfolio.experience.length,
            )} positions</span></div>
            ${portfolio.experience
              .map(
                (job, i) => `<div class="history__row" data-reveal style="--d:${i * 40}ms">
                  <span>${esc(job.period)}</span>
                  <h3>${esc(job.role)}</h3>
                  <p class="history__company">${esc(job.company)}</p>
                  <p class="history__summary">${esc(job.summary)}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__inner" data-reveal>
        <span class="eyebrow">Contact</span>
        <h2>${accentWords(portfolio.contact.heading, 2)}</h2>
        <p>${esc(portfolio.contact.blurb)}</p>
        <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)}</a>
        <div class="contact__foot">
          ${socialLinks(portfolio)}
          <span>${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <footer class="foot container">
        <span>${esc(portfolio.name)} · ${esc(portfolio.role)}</span>
        <span>${esc(portfolio.location)} · <span data-year></span></span>
        <span>Portfolio Studio</span>
      </footer>
    </section>
  </main>`;

  const css = `
:root{--muted:rgba(34,33,30,.55);--rule:rgba(34,33,30,.16)}
body{background:#f6f5f1}
.nav{position:fixed;inset:0 0 auto;z-index:60;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px;padding:22px 40px;transition:background .3s,padding .3s,border-color .3s;border-bottom:1px solid transparent}
.is-scrolled .nav{background:rgba(246,245,241,.9);backdrop-filter:blur(16px);padding:14px 40px;border-color:var(--rule)}
.nav__name{font-family:var(--display);font-size:19px;letter-spacing:-.01em;white-space:nowrap}
.nav nav{display:flex;gap:30px;font-family:var(--mono);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.nav nav a{transition:color .25s}
.nav nav a:hover{color:var(--accent)}
.nav__meta{justify-self:end;font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);white-space:nowrap}
.hero{min-height:min(100vh,820px);display:flex;align-items:center;position:relative;padding:150px 0 60px}
.eyebrow{font-family:var(--mono);font-size:8px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);display:block}
.hero h1{font-family:var(--display);font-size:clamp(52px,8.4vw,124px);line-height:.92;letter-spacing:-.035em;max-width:14ch;margin:clamp(24px,4vw,52px) 0 clamp(34px,5vw,64px)}
.hero h1 em{font-style:italic;color:var(--accent)}
.hero__bottom{display:flex;justify-content:space-between;gap:40px;align-items:end;max-width:1000px}
.hero__bottom p{max-width:38ch;font-size:13.5px;line-height:1.8;color:var(--muted)}
.scroll-link{display:inline-flex;gap:10px;align-items:center;font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;border-bottom:1px solid var(--rule);padding-bottom:6px;white-space:nowrap;transition:border-color .3s,color .3s}
.scroll-link:hover{color:var(--accent);border-color:var(--accent)}
.hero__side{position:absolute;right:40px;bottom:60px;writing-mode:vertical-rl;font-family:var(--mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.plates{padding:40px 0 100px}
.plates__head{display:flex;justify-content:space-between;border-top:1px solid var(--rule);padding-top:16px;margin-bottom:20px;font-family:var(--mono);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
.plate{margin:0 auto 100px;max-width:1280px}
.plate:nth-of-type(even) .plate__image{width:78%;margin-left:auto}
.plate__image{display:block;width:88%;aspect-ratio:16/10;overflow:hidden;background:#e9e6dd;position:relative}
.plate__image .poster{position:absolute;inset:0;transition:transform 1s cubic-bezier(.16,1,.3,1)}
.plate__image:hover .poster{transform:scale(1.025)}
.plate__caption{display:grid;grid-template-columns:58px minmax(0,1fr) 220px;gap:28px;align-items:start;padding:22px 0 0;border-top:1px solid var(--rule);margin-top:22px}
.plate:nth-of-type(even) .plate__caption{width:78%;margin-left:auto}
.plate__num{font-family:var(--mono);font-size:8px;letter-spacing:.14em;color:var(--muted);padding-top:6px}
.plate__title h2{font-family:var(--display);font-size:clamp(26px,3.4vw,42px);line-height:1.06;letter-spacing:-.01em}
.plate__title p{max-width:56ch;margin-top:10px;font-size:12px;line-height:1.8;color:var(--muted)}
.plate__meta{display:flex;flex-direction:column;align-items:flex-end;gap:7px;font-family:var(--mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);padding-top:6px;text-align:right}
.plate__meta a{color:var(--accent);border-bottom:1px solid currentColor;padding-bottom:2px;margin-top:8px}
.about{padding:100px 0;border-top:1px solid var(--rule)}
.about__grid{display:grid;grid-template-columns:180px 1fr .9fr;gap:40px 60px}
.about__main h2{font-family:var(--display);font-size:clamp(32px,4.2vw,52px);line-height:1.03;letter-spacing:-.02em;max-width:16ch}
.about__main h2 em{font-style:italic;color:var(--accent)}
.about__main blockquote{margin:28px 0 0;font-family:var(--display);font-size:19px;line-height:1.55;font-style:italic;color:var(--muted);border-left:1px solid var(--accent);padding-left:18px;max-width:40ch}
.about__copy{font-size:12.5px;line-height:1.95;color:var(--muted);display:grid;gap:16px;padding-top:8px}
.about__facts{grid-column:2/-1;display:flex;flex-wrap:wrap;gap:40px;border-top:1px solid var(--rule);padding-top:22px;margin-top:18px}
.about__facts dt{font-family:var(--mono);font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-bottom:6px}
.about__facts dd{margin:0;font-size:12px}
.practice{padding:80px 0;border-top:1px solid var(--rule)}
.practice__grid{display:grid;grid-template-columns:180px 1fr;gap:40px 60px}
.practice__row{display:grid;grid-template-columns:180px 1fr;gap:30px;padding:16px 0;border-bottom:1px solid var(--rule)}
.practice__row:first-child{border-top:1px solid var(--rule)}
.practice__row h3{font-weight:400;font-family:var(--display);font-size:19px}
.practice__row p{font-size:11.5px;line-height:1.8;color:var(--muted);align-self:center}
.history{padding:80px 0;border-top:1px solid var(--rule)}
.history__head{display:flex;justify-content:space-between;border-bottom:1px solid var(--rule);padding-bottom:14px}
.history__row{display:grid;grid-template-columns:110px 1fr 1fr 1.4fr;gap:24px;padding:20px 0;border-bottom:1px solid var(--rule);align-items:baseline}
.history__row>span{font-family:var(--mono);font-size:8px;color:var(--muted);letter-spacing:.1em}
.history__row h3{font-family:var(--display);font-size:22px;font-weight:400;line-height:1.2}
.history__company{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent)}
.history__summary{font-size:11.5px;line-height:1.75;color:var(--muted)}
.contact{padding:100px 0 0;border-top:1px solid var(--rule);background:#efede6;text-align:center}
.contact__inner h2{font-family:var(--display);font-size:clamp(38px,5.4vw,70px);line-height:1;letter-spacing:-.025em;margin:26px auto;max-width:16ch}
.contact__inner h2 em{font-style:italic;color:var(--accent)}
.contact__inner>p{max-width:48ch;margin:0 auto;font-size:12.5px;line-height:1.9;color:var(--muted)}
.contact__mail{display:inline-block;margin:36px 0 30px;font-family:var(--display);font-size:clamp(22px,3vw,36px);border-bottom:1px solid var(--rule);padding-bottom:5px;transition:color .3s,border-color .3s}
.contact__mail:hover{color:var(--accent);border-color:var(--accent)}
.contact__foot{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap;align-items:center;border-top:1px solid var(--rule);padding-top:20px;text-align:left}
.socials{display:flex;gap:22px;flex-wrap:wrap}
.socials a{font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);transition:color .3s}
.socials a:hover{color:var(--accent)}
.contact__foot>span{font-size:10px;color:var(--muted);font-style:italic}
.foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;border-top:1px solid var(--rule);margin-top:50px;padding:22px 0;font-family:var(--mono);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
@media (max-width:1024px){
  .nav{grid-template-columns:1fr auto;padding:18px 24px}
  .nav nav{display:none}
  .hero__side{display:none}
  .plate__image,.plate:nth-of-type(even) .plate__image{width:100%;margin:0}
  .plate__caption,.plate:nth-of-type(even) .plate__caption{width:100%;margin-left:0}
  .about__grid{grid-template-columns:1fr;gap:24px}
  .about__facts{grid-column:auto}
  .practice__grid{grid-template-columns:1fr;gap:20px}
  .history__row{grid-template-columns:100px 1fr 1fr;gap:14px}
  .history__summary{grid-column:2/-1}
}
@media (max-width:720px){
  .nav{padding:14px 20px}
  .nav__meta{display:none}
  .hero{min-height:88vh;padding-top:120px}
  .hero h1{font-size:clamp(44px,12vw,64px)}
  .hero__bottom{flex-direction:column;align-items:flex-start;gap:26px}
  .plates{padding-top:20px}
  .plate{margin-bottom:70px}
  .plate__image{aspect-ratio:4/3}
  .plate__caption{grid-template-columns:1fr;gap:12px}
  .plate__meta{flex-direction:row;flex-wrap:wrap;align-items:center;justify-content:flex-start}
  .plate__meta a{margin-top:0}
  .about,.practice,.history,.contact{padding-top:70px}
  .practice__row{grid-template-columns:1fr;gap:6px}
  .history__row{grid-template-columns:1fr;gap:6px}
  .history__summary{grid-column:auto}
  .contact__foot{justify-content:flex-start}
  .foot{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "gallery",
    css,
    body,
    fonts: ["Instrument Serif:ital@0;1", "Inter:wght@300;400;500", "JetBrains Mono:wght@400"],
    background: "#f6f5f1",
    foreground: "#22211e",
  });
}
