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

export function renderSwiss(portfolio: Portfolio): string {
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];

  const body = `<header class="head container">
    <div class="head__brand"><span class="dot"></span>${esc(portfolio.name)}<span class="head__role">${esc(
      portfolio.role,
    )}</span></div>
    <nav>${navLinks(portfolio)}</nav>
    <span class="head__meta">${esc(portfolio.location)} / <span data-year></span></span>
  </header>

  <main id="top">
    <section class="hero container">
      <div class="hero__grid">
        <div class="hero__copy">
          <span class="kicker" data-reveal><b>01</b> ${esc(portfolio.hero.kicker)}</span>
          <h1 data-reveal>${accentWords(portfolio.hero.title, 2)}</h1>
          <div class="hero__bottom" data-reveal style="--d:.1s">
            <p>${esc(portfolio.hero.subtitle)}</p>
            <div class="hero__actions">
              <a class="btn" href="#work">${esc(portfolio.hero.primaryCta)} <span>↓</span></a>
              <a class="btn btn--line" href="#contact">${esc(portfolio.hero.secondaryCta)}</a>
            </div>
          </div>
        </div>
        <div class="hero__side" data-reveal style="--d:.14s">
          ${
            featured
              ? `<a class="hero__art" href="${attr(featured.link || "#work")}"${
                  featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
                }>${projectArt(featured, 0, portfolio.accent)}<span>${esc(featured.category)} ↗</span></a>`
              : ""
          }
          <div class="hero__index">
            <div><span>Status</span><b><i></i>${esc(portfolio.availability)}</b></div>
            ${portfolio.hero.stats
              .map((stat) => `<div><span>${esc(stat.label)}</span><b>${esc(stat.value)}</b></div>`)
              .join("")}
          </div>
        </div>
      </div>
      <div class="hero__rule" aria-hidden="true"><span>${esc(portfolio.hero.marquee)}</span></div>
    </section>

    <section class="work container" id="work">
      <div class="section-head" data-reveal>
        <span class="kicker"><b>02</b> Selected work</span>
        <span class="section-head__count">${pad(portfolio.projects.length)} / <span data-year></span></span>
      </div>
      <div class="projects">
        ${portfolio.projects
          .map(
            (project, i) => `<a class="project" href="${attr(project.link || "#contact")}"${
              project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
            } data-reveal style="--d:${i * 45}ms">
              <span class="project__num">${pad(i + 1)}</span>
              <div class="project__art">${projectArt(project, i, portfolio.accent)}</div>
              <div class="project__meta">
                <h2>${esc(project.title)}</h2>
                <div><span>${esc(project.category)}</span><span>${esc(project.year || "—")}</span></div>
                <p>${esc(project.blurb)}</p>
                <span class="project__arrow">↗</span>
              </div>
            </a>`,
          )
          .join("")}
      </div>
    </section>

    <section class="about" id="about">
      <div class="container about__grid">
        <span class="kicker" data-reveal><b>03</b> About</span>
        <div class="about__main" data-reveal>
          <h2>${accentWords(portfolio.about.heading, 2)}</h2>
          <blockquote>${esc(portfolio.about.pullQuote)}</blockquote>
        </div>
        <div class="about__body" data-reveal style="--d:.08s">${paragraphs(portfolio.about.body)}</div>
        <div class="about__facts" data-reveal style="--d:.12s">
          ${portfolio.about.facts
            .map((fact) => `<div><span>${esc(fact.label)}</span><b>${esc(fact.value)}</b></div>`)
            .join("")}
        </div>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="skills container">
          <span class="kicker" data-reveal><b>04</b> Capabilities</span>
          <div class="skills__table">
            ${portfolio.skills
              .map(
                (group, i) => `<div class="skills__row" data-reveal style="--d:${i * 40}ms">
                  <span>${esc(group.label)}</span>
                  <p>${group.items.map(esc).join(" / ")}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    ${
      portfolio.experience.length
        ? `<section class="experience container" id="experience">
          <span class="kicker" data-reveal><b>05</b> Experience</span>
          <div class="experience__table">
            ${portfolio.experience
              .map(
                (job, i) => `<div class="experience__row" data-reveal style="--d:${i * 40}ms">
                  <span>${esc(job.period)}</span>
                  <h3>${esc(job.role)}</h3>
                  <p class="experience__company">${esc(job.company)}</p>
                  <p>${esc(job.summary)}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__grid">
        <div>
          <span class="kicker" data-reveal><b>06</b> Contact</span>
          <h2 data-reveal>${accentWords(portfolio.contact.heading, 2)}</h2>
        </div>
        <div class="contact__side" data-reveal style="--d:.1s">
          <p>${esc(portfolio.contact.blurb)}</p>
          <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)} <span>↗</span></a>
          ${socialLinks(portfolio)}
          <span class="contact__note">${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <footer class="foot container">
        <span>${esc(portfolio.name)}</span>
        <span>${esc(portfolio.location)}</span>
        <span>Portfolio Studio / <span data-year></span></span>
      </footer>
    </section>
  </main>`;

  const css = `
:root{--muted:rgba(22,22,22,.55);--rule:rgba(22,22,22,.2)}
body{--display:'Archivo','Helvetica Neue',Arial,sans-serif;--sans:'Archivo','Helvetica Neue',Arial,sans-serif;background:#f4f2ec;color:#161616}
.container{width:min(1360px,calc(100% - 64px))}
.head{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;padding:22px 0;border-bottom:1px solid var(--rule);font-size:11px;letter-spacing:-.01em}
.head__brand{display:flex;align-items:center;gap:10px;font-weight:600;letter-spacing:-.02em}
.dot{width:10px;height:10px;background:var(--accent);border-radius:50%;flex:none}
.head__role{font-weight:400;color:var(--muted);font-size:10px}
.head nav{display:flex;gap:26px;font-size:10px}
.head nav a{padding-bottom:2px;border-bottom:1px solid transparent;transition:border-color .2s}
.head nav a:hover{border-color:var(--accent)}
.head__meta{justify-self:end;font-family:var(--mono);font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.hero{padding:46px 0 0}
.hero__grid{display:grid;grid-template-columns:repeat(12,1fr);gap:24px;align-items:start}
.hero__copy{grid-column:1/9}
.hero__side{grid-column:9/13;display:flex;flex-direction:column;gap:18px}
.kicker{display:flex;gap:10px;font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.kicker b{font-weight:400;color:var(--accent)}
.hero h1{font-size:clamp(52px,7.7vw,116px);line-height:.9;letter-spacing:-.055em;font-weight:500;margin:26px 0 0;max-width:12ch}
.hero h1 em{font-style:normal;color:var(--accent);font-weight:500}
.hero__bottom{display:flex;justify-content:space-between;gap:30px;align-items:flex-end;margin-top:44px;padding-top:24px;border-top:1px solid var(--rule)}
.hero__bottom p{max-width:38ch;font-size:12.5px;line-height:1.75;color:var(--muted)}
.hero__actions{display:flex;gap:8px;flex-wrap:wrap;flex:none}
.btn{display:inline-flex;align-items:center;gap:9px;padding:12px 18px;background:#161616;color:#f4f2ec;font-size:10px;letter-spacing:.02em;transition:background .2s,color .2s}
.btn:hover{background:var(--accent)}
.btn--line{background:transparent;color:#161616;border:1px solid var(--rule)}
.btn--line:hover{background:transparent;border-color:#161616}
.hero__art{display:block;position:relative;overflow:hidden;aspect-ratio:4/5;border:1px solid var(--rule)}
.hero__art .poster{position:absolute;inset:0}
.hero__art>span{position:absolute;z-index:3;left:10px;bottom:10px;padding:6px 9px;background:#f4f2ec;font-family:var(--mono);font-size:7.5px;letter-spacing:.08em;text-transform:uppercase}
.hero__index{border-top:1px solid var(--rule)}
.hero__index div{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid var(--rule);font-size:10px}
.hero__index span{font-family:var(--mono);font-size:7.5px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.hero__index b{font-weight:400;display:flex;align-items:center;gap:6px;text-align:right}
.hero__index i{width:5px;height:5px;border-radius:50%;background:var(--accent)}
.hero__rule{margin-top:60px;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);overflow:hidden;white-space:nowrap;padding:9px 0}
.hero__rule span{font-family:var(--mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);display:inline-block;min-width:100%;text-align:center}
.work{padding:90px 0}
.section-head{display:flex;justify-content:space-between;gap:20px;padding-bottom:14px;border-bottom:2px solid #161616;margin-bottom:8px}
.section-head__count{font-family:var(--mono);font-size:8px;letter-spacing:.1em;color:var(--muted)}
.projects{display:grid;grid-template-columns:1fr 1fr;gap:0}
.project{display:grid;grid-template-columns:36px 1fr;gap:12px 18px;padding:22px 0;border-bottom:1px solid var(--rule);align-content:start}
.project:nth-child(odd){padding-right:26px}
.project:nth-child(even){padding-left:26px;border-left:1px solid var(--rule)}
.project__num{font-family:var(--mono);font-size:8px;color:var(--muted);padding-top:4px}
.project__art{position:relative;aspect-ratio:16/11;overflow:hidden;border:1px solid var(--rule)}
.project__art .poster{position:absolute;inset:0;transition:transform .6s}
.project:hover .project__art .poster{transform:scale(1.035)}
.project__meta{grid-column:2;position:relative;padding-right:34px}
.project__meta h2{font-size:clamp(20px,2.2vw,29px);line-height:1.08;letter-spacing:-.03em;font-weight:500;margin-bottom:8px}
.project__meta div{display:flex;gap:14px;font-family:var(--mono);font-size:7.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.project__meta p{margin-top:10px;font-size:11px;line-height:1.7;color:var(--muted);max-width:44ch}
.project__arrow{position:absolute;right:0;bottom:2px;font-size:15px;color:var(--accent);transition:transform .25s}
.project:hover .project__arrow{transform:translate(3px,-3px)}
.about{padding:80px 0;border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);background:#efede6}
.about__grid{display:grid;grid-template-columns:repeat(12,1fr);gap:24px 30px}
.about__grid>.kicker{grid-column:1/4}
.about__main{grid-column:4/10}
.about__main h2{font-size:clamp(30px,3.8vw,48px);line-height:1;letter-spacing:-.045em;font-weight:500;max-width:14ch}
.about__main h2 em{font-style:normal;color:var(--accent)}
.about__main blockquote{margin:26px 0 0;font-size:15px;line-height:1.5;font-weight:500;border-left:2px solid var(--accent);padding-left:16px;max-width:34ch}
.about__body{grid-column:4/10;font-size:12px;line-height:1.85;color:var(--muted);display:grid;gap:14px;margin-top:6px}
.about__facts{grid-column:10/13;display:flex;flex-direction:column;gap:14px;border-left:1px solid var(--rule);padding-left:22px}
.about__facts span{display:block;font-family:var(--mono);font-size:7px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin-bottom:4px}
.about__facts b{font-weight:500;font-size:11px}
.skills{padding:70px 0}
.skills__table{border-top:1px solid var(--rule);margin-top:18px}
.skills__row{display:grid;grid-template-columns:220px 1fr;gap:24px;padding:14px 0;border-bottom:1px solid var(--rule);font-size:11px}
.skills__row>span{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);padding-top:2px}
.skills__row p{line-height:1.7}
.experience{padding:0 0 80px}
.experience__table{border-top:2px solid #161616;margin-top:18px}
.experience__row{display:grid;grid-template-columns:120px 1.1fr .9fr 1.4fr;gap:22px;padding:16px 0;border-bottom:1px solid var(--rule);align-items:baseline;font-size:11px}
.experience__row>span{font-family:var(--mono);font-size:8px;color:var(--muted)}
.experience__row h3{font-size:15px;font-weight:500;letter-spacing:-.02em;line-height:1.3}
.experience__company{font-family:var(--mono);font-size:8px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.experience__row>p:last-child{line-height:1.7;color:var(--muted)}
.contact{padding:90px 0 0;background:#161616;color:#f4f2ec}
.contact__grid{display:grid;grid-template-columns:1.2fr .8fr;gap:50px;align-items:start;padding-bottom:70px}
.contact .kicker{color:rgba(244,242,236,.45)}
.contact .kicker b{color:var(--accent)}
.contact h2{font-size:clamp(44px,7vw,104px);line-height:.86;letter-spacing:-.055em;font-weight:500;margin-top:22px;max-width:12ch}
.contact h2 em{font-style:normal;color:var(--accent)}
.contact__side{padding-top:8px}
.contact__side>p{font-size:12px;line-height:1.85;color:rgba(244,242,236,.6);max-width:42ch}
.contact__mail{display:inline-flex;gap:10px;align-items:center;margin:28px 0 24px;font-size:clamp(16px,2vw,24px);font-weight:500;border-bottom:1px solid rgba(244,242,236,.4);padding-bottom:4px;transition:color .25s,border-color .25s}
.contact__mail:hover{color:var(--accent);border-color:var(--accent)}
.socials{display:flex;gap:20px;flex-wrap:wrap}
.socials a{font-family:var(--mono);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:rgba(244,242,236,.55);border-bottom:1px solid rgba(244,242,236,.2);padding-bottom:3px}
.socials a:hover{color:var(--accent)}
.contact__note{display:block;margin-top:24px;font-size:10px;color:rgba(244,242,236,.35)}
.foot{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;border-top:1px solid rgba(244,242,236,.2);padding:20px 0;font-family:var(--mono);font-size:7.5px;letter-spacing:.12em;text-transform:uppercase;color:rgba(244,242,236,.4)}
@media (max-width:1024px){
  .head{grid-template-columns:1fr auto}
  .head nav{display:none}
  .hero__copy{grid-column:1/-1}
  .hero__side{grid-column:1/-1;display:grid;grid-template-columns:1fr 1fr;gap:20px}
  .hero__art{aspect-ratio:16/9}
  .hero h1{max-width:14ch}
  .about__main,.about__body{grid-column:1/-1}
  .about__grid>.kicker{grid-column:1/-1;margin-bottom:-8px}
  .about__facts{grid-column:1/-1;flex-direction:row;border-left:0;border-top:1px solid var(--rule);padding:16px 0 0;flex-wrap:wrap;gap:28px}
  .contact__grid{grid-template-columns:1fr;gap:30px}
  .experience__row{grid-template-columns:100px 1fr 1fr;gap:10px}
  .experience__row>p:last-child{grid-column:2/-1}
}
@media (max-width:720px){
  .container{width:calc(100% - 40px)}
  .head{padding:16px 0}
  .head__meta{display:none}
  .hero{padding-top:30px}
  .hero h1{font-size:clamp(44px,12vw,64px);margin-top:20px}
  .hero__bottom{flex-direction:column;align-items:flex-start;gap:22px;margin-top:30px}
  .hero__side{grid-template-columns:1fr}
  .projects{grid-template-columns:1fr}
  .project:nth-child(odd),.project:nth-child(even){padding:20px 0;border-left:0}
  .project{grid-template-columns:26px 1fr}
  .skills__row{grid-template-columns:1fr;gap:6px}
  .contact{padding-top:60px}
  .contact__grid{padding-bottom:50px}
  .contact h2{font-size:clamp(38px,11vw,60px)}
  .foot{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "swiss",
    css,
    body,
    fonts: ["Archivo:wght@400;500;600", "JetBrains Mono:wght@400"],
    background: "#f4f2ec",
    foreground: "#161616",
  });
}
