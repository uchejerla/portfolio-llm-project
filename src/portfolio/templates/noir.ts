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

export function renderNoir(portfolio: Portfolio): string {
  const [first, ...rest] = portfolio.name.trim().split(/\s+/);
  const last = rest.join(" ");
  const heroName = `<span class="hero__first">${esc(first ?? portfolio.name)}</span>${
    last ? `<span class="hero__last">${esc(last)}</span>` : ""
  }`;
  const stills = portfolio.projects.slice(0, 3);

  const projectRows = portfolio.projects
    .map((project, index) => {
      const href = project.link || "#contact";
      return `<article class="feature" data-reveal>
        <div class="feature__art ${index % 2 ? "feature__art--right" : ""}">
          <a href="${attr(href)}"${project.link ? ` target="_blank" rel="noreferrer noopener"` : ""}>
            ${projectArt(project, index, portfolio.accent)}
          </a>
          <span class="feature__frame-label">${pad(index + 1)} / ${esc(project.year || "—")}</span>
        </div>
        <div class="feature__copy">
          <p class="kicker">${esc(project.category)}</p>
          <h3>${esc(project.title)}</h3>
          <p class="feature__blurb">${esc(project.blurb)}</p>
          <ul class="feature__tags">${project.tags.map((tag) => `<li>${esc(tag)}</li>`).join("")}</ul>
          <a class="text-link" href="${attr(href)}"${
            project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
          }>View the work <span>→</span></a>
        </div>
      </article>`;
    })
    .join("");

  const body = `<header class="masthead">
    <div class="masthead__brand"><span class="masthead__mark">${esc(portfolio.initials)}</span><span>${esc(
      portfolio.name,
    )}<em>${esc(portfolio.role)}</em></span></div>
    <nav>${navLinks(portfolio)}</nav>
    <span class="masthead__avail"><i></i>${esc(portfolio.availability)}</span>
  </header>

  <main id="top">
    <section class="hero">
      <div class="container">
        <div class="hero__top">
          <span class="kicker">${esc(portfolio.hero.kicker)}</span>
          <span class="kicker">${esc(portfolio.location)}</span>
          <span class="kicker">Portfolio · <span data-year></span></span>
        </div>
        <h1 class="hero__name" data-reveal>${heroName}</h1>
        <div class="hero__bottom">
          <p class="hero__tagline">${esc(portfolio.hero.subtitle)}</p>
          <div class="hero__actions">
            <a class="btn" href="#work">${esc(portfolio.hero.primaryCta)} <span>↓</span></a>
            <a class="btn btn--line" href="#contact">${esc(portfolio.hero.secondaryCta)}</a>
          </div>
        </div>
      </div>
      ${
        stills.length
          ? `<div class="reel" data-reveal>
            ${stills
              .map(
                (project, index) =>
                  `<div class="reel__still ${index === 1 ? "is-large" : ""}">${projectArt(
                    project,
                    index,
                    portfolio.accent,
                  )}</div>`,
              )
              .join("")}
          </div>`
          : ""
      }
      <div class="hero__ticker"><div>${Array.from({ length: 6 })
        .map(() => `<span>${esc(portfolio.hero.marquee)}</span><i>◆</i>`)
        .join("")}</div></div>
    </section>

    <section class="work" id="work">
      <div class="container">
        <div class="section-head" data-reveal>
          <span class="kicker">Selected work</span>
          <h2>${accentWords("The picture so far", 2)}</h2>
          <span class="section-head__count">${pad(portfolio.projects.length)} projects</span>
        </div>
        ${projectRows || `<p class="empty">Work is being developed. Come back soon.</p>`}
      </div>
    </section>

    <section class="about" id="about">
      <div class="container about__inner">
        <span class="kicker" data-reveal>About the practice</span>
        <blockquote data-reveal>“${esc(portfolio.about.pullQuote)}”</blockquote>
        <div class="about__body" data-reveal>${paragraphs(portfolio.about.body)}</div>
        <div class="about__facts" data-reveal>
          ${portfolio.about.facts
            .map((fact) => `<div><span>${esc(fact.label)}</span><strong>${esc(fact.value)}</strong></div>`)
            .join("")}
        </div>
      </div>
    </section>

    ${
      portfolio.skills.length || portfolio.experience.length
        ? `<section class="credits">
          <div class="container credits__grid">
            ${
              portfolio.skills.length
                ? `<div class="credits__block" data-reveal>
                  <span class="kicker">In practice</span>
                  ${portfolio.skills
                    .map(
                      (group) => `<div class="credit-group"><h3>${esc(group.label)}</h3><p>${group.items
                        .map(esc)
                        .join(" · ")}</p></div>`,
                    )
                    .join("")}
                </div>`
                : ""
            }
            ${
              portfolio.experience.length
                ? `<div class="credits__block" data-reveal style="--d:.1s">
                  <span class="kicker">Selected credits</span>
                  ${portfolio.experience
                    .map(
                      (job) => `<div class="credit-row">
                        <span class="credit-row__period">${esc(job.period)}</span>
                        <div><h3>${esc(job.role)}</h3><p>${esc(job.company)}</p></div>
                        <p class="credit-row__summary">${esc(job.summary)}</p>
                      </div>`,
                    )
                    .join("")}
                </div>`
                : ""
            }
          </div>
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__inner" data-reveal>
        <span class="kicker">Next</span>
        <h2>${accentWords(portfolio.contact.heading, 2)}</h2>
        <p>${esc(portfolio.contact.blurb)}</p>
        <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)}<span>↗</span></a>
        <div class="contact__foot">
          ${socialLinks(portfolio)}
          <span>${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <footer class="foot container">
        <span>${esc(portfolio.name)}</span>
        <span>${esc(portfolio.location)}</span>
        <span>© <span data-year></span> · Portfolio Studio</span>
      </footer>
    </section>
  </main>`;

  const css = `
body{--display:'Bodoni Moda',Georgia,serif;--sans:'Inter',system-ui,sans-serif;background:#0a0a0a;background-image:radial-gradient(90% 60% at 50% -10%,rgba(255,255,255,.055),transparent 70%)}
.masthead{position:fixed;inset:0 0 auto;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:24px;padding:22px 32px;border-bottom:1px solid rgba(233,228,216,.14);transition:background .3s,padding .3s}
.is-scrolled .masthead{background:rgba(10,10,10,.86);backdrop-filter:blur(16px);padding:14px 32px}
.masthead__brand{display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:.16em;text-transform:uppercase}
.masthead__brand em{display:block;font-style:normal;font-size:8px;letter-spacing:.22em;color:rgba(233,228,216,.4);margin-top:4px}
.masthead__mark{display:grid;place-items:center;width:34px;height:34px;border:1px solid rgba(233,228,216,.35);border-radius:50%;font-family:var(--display);font-size:13px;letter-spacing:0}
.masthead nav{display:flex;gap:26px;font-size:9px;letter-spacing:.2em;text-transform:uppercase;color:rgba(233,228,216,.55)}
.masthead nav a{transition:color .25s}
.masthead nav a:hover{color:var(--accent)}
.masthead__avail{display:inline-flex;align-items:center;gap:8px;font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:rgba(233,228,216,.55);white-space:nowrap}
.masthead__avail i{width:5px;height:5px;border-radius:50%;background:var(--accent)}
.hero{min-height:min(100vh,900px);padding:140px 0 0;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.hero__top{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid rgba(233,228,216,.16);padding-bottom:16px;flex-wrap:wrap}
.kicker{font-family:var(--mono);font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:rgba(233,228,216,.42)}
.hero__name{font-family:var(--display);font-weight:400;font-size:clamp(68px,15vw,220px);line-height:.78;letter-spacing:-.045em;text-transform:uppercase;margin:clamp(26px,4vw,60px) 0;display:flex;flex-direction:column}
.hero__last{font-style:italic;color:transparent;-webkit-text-stroke:1px rgba(233,228,216,.55);text-align:right}
.hero__bottom{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;padding-bottom:clamp(24px,4vw,52px)}
.hero__tagline{font-family:var(--display);font-size:clamp(19px,2.3vw,28px);line-height:1.35;max-width:38ch;color:rgba(233,228,216,.7);font-style:italic}
.hero__actions{display:flex;gap:10px;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 24px;border:1px solid var(--accent);background:var(--accent);color:var(--accent-ink);border-radius:0;font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;transition:opacity .3s,transform .3s}
.btn:hover{opacity:.82;transform:translateY(-2px)}
.btn--line{background:transparent;color:var(--fg);border-color:rgba(233,228,216,.3)}
.btn--line:hover{border-color:var(--fg)}
.reel{display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:14px;align-items:end;padding:0 32px;margin-top:10px}
.reel__still{position:relative;aspect-ratio:3/4;border:1px solid rgba(233,228,216,.16);overflow:hidden;filter:grayscale(1) contrast(1.05);transition:filter .6s ease,transform .6s ease}
.reel__still .poster{position:absolute;inset:0}
.reel__still.is-large{aspect-ratio:16/12;transform:translateY(-18px)}
.reel__still:hover{filter:grayscale(.2) contrast(1.02)}
.hero__ticker{margin-top:clamp(28px,5vw,64px);border-top:1px solid rgba(233,228,216,.16);border-bottom:1px solid rgba(233,228,216,.16);overflow:hidden;padding:14px 0;white-space:nowrap}
.hero__ticker div{display:inline-flex;gap:26px;align-items:center;animation:ticker 38s linear infinite}
.hero__ticker span{font-family:var(--mono);font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(233,228,216,.5)}
.hero__ticker i{color:var(--accent);font-size:7px;font-style:normal}
@keyframes ticker{to{transform:translateX(-50%)}}
.work{padding:110px 0}
.section-head{display:flex;align-items:baseline;justify-content:space-between;gap:22px;border-bottom:1px solid rgba(233,228,216,.2);padding-bottom:22px;margin-bottom:20px;flex-wrap:wrap}
.section-head h2{font-family:var(--display);font-size:clamp(32px,4.5vw,56px);line-height:1.02;margin-left:auto}
.section-head h2 em{font-style:italic;color:var(--accent)}
.section-head__count{font-family:var(--mono);font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:rgba(233,228,216,.35)}
.feature{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(28px,6vw,90px);align-items:center;padding:56px 0;border-bottom:1px solid rgba(233,228,216,.12)}
.feature__art{position:relative}
.feature__art a{position:relative;display:block;aspect-ratio:4/3;overflow:hidden;border:1px solid rgba(233,228,216,.18);filter:grayscale(.85);transition:filter .6s,transform .6s}
.feature__art .poster{position:absolute;inset:0}
.feature__art a:hover{filter:grayscale(0);transform:scale(1.012)}
.feature__art--right{order:2}
.feature__frame-label{display:block;margin-top:12px;font-family:var(--mono);font-size:8px;letter-spacing:.2em;color:rgba(233,228,216,.32)}
.feature__copy h3{font-family:var(--display);font-size:clamp(34px,4.6vw,60px);line-height:1;margin:20px 0 20px;letter-spacing:-.02em}
.feature__blurb{font-size:13.5px;line-height:1.8;color:rgba(233,228,216,.55);max-width:48ch}
.feature__tags{display:flex;flex-wrap:wrap;gap:8px;margin:24px 0 30px;font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:rgba(233,228,216,.5)}
.feature__tags li{border:1px solid rgba(233,228,216,.2);padding:6px 10px}
.text-link{display:inline-flex;gap:12px;align-items:center;font-family:var(--mono);font-size:9px;letter-spacing:.18em;text-transform:uppercase;border-bottom:1px solid rgba(233,228,216,.4);padding-bottom:7px;transition:color .3s,border-color .3s}
.text-link:hover{color:var(--accent);border-color:var(--accent)}
.about{padding:110px 0;border-top:1px solid rgba(233,228,216,.16);background:linear-gradient(180deg,rgba(255,255,255,.02),transparent)}
.about__inner{max-width:920px;margin:auto;text-align:center}
.about blockquote{font-family:var(--display);font-size:clamp(28px,4vw,48px);line-height:1.22;font-style:italic;margin:30px auto;max-width:24ch;color:rgba(233,228,216,.9)}
.about__body{max-width:620px;margin:0 auto;text-align:left;font-size:13.5px;line-height:1.9;color:rgba(233,228,216,.55);display:grid;gap:16px}
.about__facts{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:56px;padding-top:24px;border-top:1px solid rgba(233,228,216,.16);text-align:left}
.about__facts span{display:block;font-family:var(--mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:rgba(233,228,216,.3);margin-bottom:8px}
.about__facts strong{font-weight:400;font-size:12px;color:rgba(233,228,216,.8)}
.credits{padding:90px 0;border-top:1px solid rgba(233,228,216,.16)}
.credits__grid{display:grid;grid-template-columns:.8fr 1.2fr;gap:70px}
.credit-group{padding:22px 0;border-bottom:1px solid rgba(233,228,216,.1);display:grid;grid-template-columns:150px 1fr;gap:20px}
.credit-group h3{font-family:var(--display);font-size:22px;font-weight:400}
.credit-group p{font-size:12px;line-height:1.8;color:rgba(233,228,216,.5)}
.credit-row{display:grid;grid-template-columns:110px 1fr 1.2fr;gap:22px;padding:20px 0;border-bottom:1px solid rgba(233,228,216,.1);align-items:baseline}
.credit-row__period{font-family:var(--mono);font-size:8px;letter-spacing:.14em;color:rgba(233,228,216,.35)}
.credit-row h3{font-size:14px;font-weight:400;letter-spacing:.02em}
.credit-row p{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);margin-top:5px}
.credit-row__summary{font-size:12px;line-height:1.7;color:rgba(233,228,216,.45)}
.contact{padding:110px 0 30px;border-top:1px solid rgba(233,228,216,.16);text-align:center;background:radial-gradient(70% 70% at 50% 100%,rgba(255,255,255,.05),transparent)}
.contact h2{font-family:var(--display);font-size:clamp(40px,6.6vw,92px);line-height:.95;letter-spacing:-.03em;max-width:16ch;margin:26px auto}
.contact h2 em{font-style:italic;color:var(--accent)}
.contact__inner>p{max-width:52ch;margin:0 auto;font-size:13.5px;line-height:1.8;color:rgba(233,228,216,.55)}
.contact__mail{display:inline-flex;align-items:center;gap:12px;margin:40px 0;font-family:var(--display);font-size:clamp(22px,3.2vw,38px);border-bottom:1px solid rgba(233,228,216,.3);padding-bottom:6px;transition:color .3s,border-color .3s}
.contact__mail:hover{color:var(--accent);border-color:var(--accent)}
.contact__mail span{font-size:.65em;color:var(--accent)}
.contact__foot{display:flex;justify-content:space-between;gap:20px;align-items:center;border-top:1px solid rgba(233,228,216,.16);padding-top:24px;text-align:left;flex-wrap:wrap}
.socials{display:flex;gap:22px;flex-wrap:wrap}
.socials a{font-family:var(--mono);font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:rgba(233,228,216,.5);transition:color .3s}
.socials a:hover{color:var(--accent)}
.contact__foot>span{font-size:10px;color:rgba(233,228,216,.3)}
.foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:28px 0;margin-top:50px;border-top:1px solid rgba(233,228,216,.1);font-family:var(--mono);font-size:7.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(233,228,216,.28)}
.empty{font-family:var(--display);font-size:32px;color:rgba(233,228,216,.4);padding:60px 0}
@media (max-width:1024px){
  .masthead nav{display:none}
  .hero__name{font-size:clamp(60px,17vw,150px)}
  .feature{grid-template-columns:1fr;gap:28px}
  .feature__art--right{order:0}
  .credits__grid{grid-template-columns:1fr;gap:30px}
}
@media (max-width:720px){
  .masthead{padding:16px 20px}
  .masthead__brand span:last-child{display:none}
  .masthead__avail{display:none}
  .hero{padding-top:110px}
  .hero__top{justify-content:flex-start;gap:12px 20px}
  .hero__bottom{flex-direction:column;align-items:flex-start;gap:26px}
  .reel{padding:0 20px;gap:8px}
  .reel__still.is-large{transform:none}
  .section-head h2{margin-left:0}
  .about__facts{grid-template-columns:1fr 1fr}
  .credit-group,.credit-row{grid-template-columns:1fr;gap:8px}
  .contact__foot{justify-content:flex-start}
}
`;
  return renderShell({
    portfolio,
    template: "noir",
    css,
    body,
    fonts: ["Bodoni Moda:ital,wght@0,400;0,500;1,400;1,500", "Inter:wght@300;400;500", "JetBrains Mono:wght@400"],
    background: "#0a0a0a",
    foreground: "#e9e4d8",
  });
}
