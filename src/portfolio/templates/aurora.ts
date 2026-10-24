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

export function renderAurora(portfolio: Portfolio): string {
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];

  const body = `<div class="aura" aria-hidden="true"><span class="aura__one"></span><span class="aura__two"></span><span class="aura__three"></span></div>

  <header class="nav">
    <a class="nav__brand" href="#top"><span>${esc(portfolio.initials)}</span>${esc(portfolio.name)}</a>
    <nav class="nav__links">${navLinks(portfolio)}</nav>
    <a class="nav__cta" href="#contact">Let's talk <b>↗</b></a>
  </header>

  <main id="top">
    <section class="hero">
      <div class="container hero__inner">
        <span class="status" data-reveal><i></i>${esc(portfolio.availability)}</span>
        <h1 data-reveal>${accentWords(portfolio.hero.title, 2)}</h1>
        <p class="hero__sub" data-reveal style="--d:.08s">${esc(portfolio.hero.subtitle)}</p>
        <div class="hero__actions" data-reveal style="--d:.14s">
          <a class="btn btn--glow" href="#work">${esc(portfolio.hero.primaryCta)} <span>→</span></a>
          <a class="btn btn--glass" href="#contact">${esc(portfolio.hero.secondaryCta)}</a>
        </div>
        <div class="hero__stats" data-reveal style="--d:.2s">
          ${portfolio.hero.stats
            .map(
              (stat) => `<div><b>${esc(stat.value)}</b><span>${esc(stat.label)}</span></div>`,
            )
            .join("")}
        </div>
      </div>
      <div class="container hero__panel" data-reveal style="--d:.24s">
        ${
          featured
            ? `<div class="hero__panel-art">${projectArt(featured, 0, portfolio.accent)}</div>
            <div class="hero__panel-copy">
              <span>Featured · ${esc(featured.category)}</span>
              <h2>${esc(featured.title)}</h2>
              <p>${esc(featured.blurb)}</p>
              <a href="${attr(featured.link || "#work")}"${
                featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              }>Explore project <b>↗</b></a>
            </div>`
            : `<p class="empty">Your first project is waiting to be made.</p>`
        }
      </div>
    </section>

    <section class="work container" id="work">
      <div class="section-head" data-reveal>
        <div><span class="eyebrow">Selected work</span><h2>Built to <em>glow</em></h2></div>
        <p>${pad(portfolio.projects.length)} projects across brand, product and motion.</p>
      </div>
      <div class="bento">
        ${portfolio.projects
          .slice(0, 7)
          .map(
            (project, i) => `<a class="tile tile--${i === 0 ? "wide" : i === 1 ? "tall" : "small"}" href="${attr(
              project.link || "#contact",
            )}"${
              project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
            } data-reveal style="--d:${i * 50}ms">
              <div class="tile__art">${projectArt(project, i, portfolio.accent)}</div>
              <div class="tile__scrim"></div>
              <span class="tile__cat">${esc(project.category)}</span>
              <div class="tile__info">
                <h3>${esc(project.title)}</h3>
                <p>${esc(project.blurb)}</p>
                <span class="tile__link">View <b>↗</b></span>
              </div>
              <span class="tile__year">${esc(project.year || "—")}</span>
            </a>`,
          )
          .join("")}
      </div>
    </section>

    <section class="about container" id="about">
      <div class="about__card" data-reveal>
        <div class="about__intro">
          <span class="eyebrow">About</span>
          <h2>${accentWords(portfolio.about.heading, 2)}</h2>
          <blockquote>“${esc(portfolio.about.pullQuote)}”</blockquote>
        </div>
        <div class="about__body">
          ${portfolio.about.body.map((item) => `<p>${esc(item)}</p>`).join("")}
          <div class="about__facts">
            ${portfolio.about.facts
              .map((fact) => `<div><span>${esc(fact.label)}</span><b>${esc(fact.value)}</b></div>`)
              .join("")}
          </div>
        </div>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="kit container">
          <div class="kit__head" data-reveal><span class="eyebrow">Capabilities</span><h2>What I bring to a team</h2></div>
          <div class="kit__grid">
            ${portfolio.skills
              .map(
                (group, i) => `<div class="kit__card" data-reveal style="--d:${i * 60}ms">
                  <span>0${i + 1}</span>
                  <h3>${esc(group.label)}</h3>
                  <div class="chips">${group.items.map((item) => `<span>${esc(item)}</span>`).join("")}</div>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    ${
      portfolio.experience.length
        ? `<section class="journey container" id="experience">
          <div class="section-head" data-reveal>
            <div><span class="eyebrow">Experience</span><h2>The <em>journey</em></h2></div>
          </div>
          <div class="timeline">
            ${portfolio.experience
              .map(
                (job, i) => `<div class="timeline__row" data-reveal style="--d:${i * 60}ms">
                  <span class="timeline__period">${esc(job.period)}</span>
                  <span class="timeline__dot"><i></i></span>
                  <div><h3>${esc(job.role)}</h3><p class="timeline__company">${esc(job.company)}</p></div>
                  <p class="timeline__summary">${esc(job.summary)}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    <section class="contact container" id="contact">
      <div class="contact__card" data-reveal>
        <div class="contact__glow" aria-hidden="true"></div>
        <span class="eyebrow">Next chapter</span>
        <h2>${accentWords(portfolio.contact.heading, 2)}</h2>
        <p>${esc(portfolio.contact.blurb)}</p>
        <div class="contact__actions">
          <a class="btn btn--glow" href="${emailHref(portfolio.email)}">${esc(portfolio.email)} <span>↗</span></a>
          ${socialLinks(portfolio, "socials")}
        </div>
        <span class="contact__note">${esc(portfolio.contact.note)}</span>
      </div>
      <footer class="foot">
        <span>${esc(portfolio.name)} · ${esc(portfolio.role)}</span>
        <span>${esc(portfolio.location)} · <span data-year></span></span>
        <span>Made with Portfolio Studio</span>
      </footer>
    </section>
  </main>`;

  const css = `
:root{--muted:rgba(238,240,255,.55);--glass:rgba(255,255,255,.055);--edge:rgba(255,255,255,.12)}
body{--display:'Sora',system-ui,sans-serif;--sans:'Inter',system-ui,sans-serif;background:#080b1d;background-image:radial-gradient(120% 70% at 50% -10%,rgba(157,140,255,.18),transparent 60%)}
.aura{position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0}
.aura span{position:absolute;border-radius:50%;filter:blur(80px);opacity:.5}
.aura__one{width:44vw;height:44vw;background:var(--accent);top:-14vw;left:-8vw;opacity:.28;animation:drift 18s ease-in-out infinite}
.aura__two{width:38vw;height:38vw;background:#3f7cff;top:14vh;right:-10vw;opacity:.2;animation:drift 22s ease-in-out infinite reverse}
.aura__three{width:36vw;height:36vw;background:#ff5fa2;bottom:0;left:24vw;opacity:.14;animation:drift 26s ease-in-out infinite}
@keyframes drift{50%{transform:translate3d(4vw,4vh,0) scale(1.08)}}
main,.nav{position:relative;z-index:1}
.nav{position:fixed;inset:16px 24px auto;z-index:60;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:10px 12px 10px 18px;border:1px solid var(--edge);border-radius:999px;background:rgba(10,13,34,.55);backdrop-filter:blur(22px)}
.nav__brand{display:flex;align-items:center;gap:10px;font-size:12px;letter-spacing:.02em}
.nav__brand span{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#6ee7ff);color:#081020;font-family:var(--display);font-size:11px}
.nav__links{display:flex;gap:26px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.nav__links a{transition:color .25s}
.nav__links a:hover{color:#fff}
.nav__cta{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid var(--edge);font-size:10px;letter-spacing:.08em;text-transform:uppercase;transition:background .25s}
.nav__cta:hover{background:var(--accent);color:#081020}
.nav__cta b{font-weight:400}
.hero{padding:170px 0 40px;text-align:center}
.eyebrow{display:block;font-family:var(--mono);font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.status{display:inline-flex;align-items:center;gap:8px;padding:7px 13px;border:1px solid var(--edge);border-radius:999px;background:var(--glass);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted);margin-bottom:28px}
.status i{width:6px;height:6px;border-radius:50%;background:#6bffb0;box-shadow:0 0 10px #6bffb0}
.hero h1{font-family:var(--display);font-size:clamp(52px,8vw,110px);font-weight:600;line-height:.95;letter-spacing:-.045em;max-width:15ch;margin:0 auto}
.hero h1 em{font-style:normal;background:linear-gradient(100deg,var(--accent),#6ee7ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.hero__sub{max-width:54ch;margin:26px auto 0;font-size:14px;line-height:1.8;color:var(--muted)}
.hero__actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:34px}
.btn{display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 22px;border-radius:999px;font-size:11px;letter-spacing:.04em;transition:transform .25s,box-shadow .25s,background .25s}
.btn--glow{background:linear-gradient(120deg,var(--accent),#6ee7ff);color:#07101f;box-shadow:0 10px 40px rgba(157,140,255,.35)}
.btn--glow:hover{transform:translateY(-2px);box-shadow:0 16px 50px rgba(157,140,255,.45)}
.btn--glass{border:1px solid var(--edge);background:var(--glass);color:var(--fg)}
.btn--glass:hover{background:rgba(255,255,255,.1)}
.hero__stats{display:flex;justify-content:center;gap:clamp(24px,5vw,70px);margin-top:50px;flex-wrap:wrap}
.hero__stats div{display:flex;flex-direction:column;gap:4px}
.hero__stats b{font-family:var(--display);font-size:30px;font-weight:600;line-height:1;background:linear-gradient(120deg,#fff,var(--accent));-webkit-background-clip:text;background-clip:text;color:transparent}
.hero__stats span{font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.hero__panel{display:grid;grid-template-columns:1.15fr .85fr;gap:0;margin-top:70px;border:1px solid var(--edge);border-radius:28px;overflow:hidden;background:var(--glass);backdrop-filter:blur(20px);text-align:left}
.hero__panel-art{position:relative;min-height:330px}
.hero__panel-art .poster{position:absolute;inset:0}
.hero__panel-copy{padding:clamp(24px,3.4vw,40px);display:flex;flex-direction:column;justify-content:center;gap:14px}
.hero__panel-copy>span{font-family:var(--mono);font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.hero__panel-copy h2{font-family:var(--display);font-size:clamp(26px,3vw,36px);font-weight:600;line-height:1.05;letter-spacing:-.02em}
.hero__panel-copy p{font-size:12px;line-height:1.75;color:var(--muted);max-width:42ch}
.hero__panel-copy a{display:inline-flex;gap:8px;align-items:center;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--accent);width:fit-content;margin-top:6px}
.hero__panel-copy a b{font-weight:400}
.empty{padding:40px;color:var(--muted)}
.section-head{display:flex;align-items:flex-end;justify-content:space-between;gap:30px;margin-bottom:30px}
.section-head h2{font-family:var(--display);font-size:clamp(32px,4.4vw,54px);font-weight:600;line-height:1;letter-spacing:-.03em;margin-top:6px}
.section-head h2 em{font-style:normal;background:linear-gradient(90deg,var(--accent),#6ee7ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.section-head>p{max-width:32ch;text-align:right;font-size:11px;line-height:1.8;color:var(--muted);padding-bottom:6px}
.work{padding:100px 0}
.bento{display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:230px;gap:14px}
.tile{position:relative;overflow:hidden;border-radius:22px;border:1px solid var(--edge);isolation:isolate;display:flex;flex-direction:column;justify-content:flex-end;transition:transform .4s,border-color .4s}
.tile--wide{grid-column:span 2;grid-row:span 2}
.tile--tall{grid-row:span 2}
.tile:hover{transform:translateY(-4px);border-color:rgba(255,255,255,.28)}
.tile__art{position:absolute;inset:0;z-index:0}
.tile__art .poster{position:absolute;inset:0;transition:transform .8s cubic-bezier(.16,1,.3,1)}
.tile:hover .tile__art .poster{transform:scale(1.05)}
.tile__scrim{position:absolute;inset:0;z-index:1;background:linear-gradient(180deg,rgba(6,9,24,.1) 30%,rgba(6,9,24,.88))}
.tile__cat,.tile__year{position:absolute;z-index:2;top:16px;font-family:var(--mono);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(238,240,255,.7)}
.tile__cat{left:18px}
.tile__year{right:18px}
.tile__info{position:relative;z-index:2;padding:20px}
.tile__info h3{font-family:var(--display);font-size:clamp(19px,2vw,26px);font-weight:600;line-height:1.12;letter-spacing:-.02em}
.tile--wide .tile__info h3{font-size:clamp(28px,3.2vw,44px)}
.tile__info p{font-size:11.5px;line-height:1.7;color:rgba(238,240,255,.55);margin-top:8px;max-width:48ch;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.tile__link{display:inline-block;margin-top:14px;font-family:var(--mono);font-size:8px;letter-spacing:.14em;text-transform:uppercase;color:var(--accent);opacity:0;transform:translateY(6px);transition:opacity .3s,transform .3s}
.tile:hover .tile__link{opacity:1;transform:none}
.about{padding:0 0 100px}
.about__card{display:grid;grid-template-columns:.9fr 1.1fr;gap:clamp(30px,5vw,64px);padding:clamp(26px,4vw,56px);border:1px solid var(--edge);border-radius:28px;background:linear-gradient(150deg,rgba(255,255,255,.07),rgba(255,255,255,.015));backdrop-filter:blur(22px)}
.about__intro h2{font-family:var(--display);font-size:clamp(30px,3.8vw,46px);font-weight:600;line-height:1;letter-spacing:-.03em}
.about__intro h2 em{font-style:normal;background:linear-gradient(90deg,var(--accent),#6ee7ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.about__intro blockquote{margin:24px 0 0;font-family:var(--display);font-size:17px;line-height:1.55;font-style:italic;color:rgba(238,240,255,.72);border-left:1px solid var(--accent);padding-left:16px}
.about__body{display:flex;flex-direction:column;gap:16px}
.about__body p{font-size:12.5px;line-height:1.85;color:var(--muted)}
.about__facts{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px;border-top:1px solid var(--edge);padding-top:20px}
.about__facts span{display:block;font-family:var(--mono);font-size:7.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.about__facts b{font-weight:400;font-size:11.5px}
.kit{padding:0 0 100px}
.kit__head{margin-bottom:28px}
.kit__head h2{font-family:var(--display);font-size:clamp(28px,3.8vw,46px);font-weight:600;letter-spacing:-.03em}
.kit__grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.kit__card{padding:24px;border:1px solid var(--edge);border-radius:20px;background:var(--glass);backdrop-filter:blur(16px)}
.kit__card>span{font-family:var(--mono);font-size:8px;color:var(--accent)}
.kit__card h3{font-family:var(--display);font-size:22px;font-weight:600;margin:12px 0 18px}
.chips{display:flex;flex-wrap:wrap;gap:7px}
.chips span{font-size:9.5px;padding:5px 9px;border:1px solid var(--edge);border-radius:999px;color:rgba(238,240,255,.68)}
.journey{padding:0 0 100px}
.timeline{border-top:1px solid var(--edge)}
.timeline__row{display:grid;grid-template-columns:120px 30px 1fr 1.3fr;gap:22px;align-items:baseline;padding:24px 0;border-bottom:1px solid var(--edge)}
.timeline__period{font-family:var(--mono);font-size:8px;letter-spacing:.12em;color:var(--muted)}
.timeline__dot{position:relative;height:10px}
.timeline__dot::before{content:"";position:absolute;top:0;left:0;right:0;height:1px;background:var(--edge)}
.timeline__dot i{position:absolute;top:-2px;left:0;width:5px;height:5px;border-radius:50%;background:var(--accent);box-shadow:0 0 10px var(--accent)}
.timeline__row h3{font-family:var(--display);font-size:20px;font-weight:600;line-height:1.2}
.timeline__company{font-family:var(--mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-top:6px}
.timeline__summary{font-size:11.5px;line-height:1.75;color:var(--muted)}
.contact{padding-bottom:30px}
.contact__card{position:relative;text-align:center;padding:clamp(40px,7vw,90px) 24px;border:1px solid var(--edge);border-radius:30px;background:linear-gradient(160deg,rgba(157,140,255,.16),rgba(110,231,255,.05));overflow:hidden}
.contact__glow{position:absolute;left:50%;top:-40%;width:60%;aspect-ratio:1;transform:translateX(-50%);background:radial-gradient(circle,rgba(157,140,255,.35),transparent 65%);filter:blur(30px);pointer-events:none}
.contact h2{position:relative;font-family:var(--display);font-size:clamp(36px,5.6vw,74px);font-weight:600;line-height:.98;letter-spacing:-.04em;max-width:16ch;margin:22px auto 0}
.contact h2 em{font-style:normal;background:linear-gradient(100deg,var(--accent),#6ee7ff);-webkit-background-clip:text;background-clip:text;color:transparent}
.contact__card>p{position:relative;max-width:50ch;margin:20px auto 0;font-size:12.5px;line-height:1.85;color:var(--muted)}
.contact__actions{position:relative;display:flex;justify-content:center;align-items:center;gap:18px;flex-wrap:wrap;margin-top:30px}
.socials{display:flex;gap:16px;flex-wrap:wrap}
.socials a{font-family:var(--mono);font-size:8px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted);transition:color .25s}
.socials a:hover{color:var(--accent)}
.contact__note{display:block;margin-top:26px;font-size:10px;color:rgba(238,240,255,.35)}
.foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;padding:26px 4px;font-family:var(--mono);font-size:7.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(238,240,255,.38)}
@media (max-width:1024px){
  .nav__links{display:none}
  .hero{padding-top:140px}
  .hero__panel{grid-template-columns:1fr}
  .hero__panel-art{min-height:260px}
  .bento{grid-template-columns:1fr 1fr;grid-auto-rows:220px}
  .tile--wide{grid-column:span 2}
  .about__card{grid-template-columns:1fr}
  .kit__grid{grid-template-columns:1fr 1fr}
  .timeline__row{grid-template-columns:100px 20px 1fr}
  .timeline__summary{grid-column:3}
}
@media (max-width:720px){
  .nav{left:12px;right:12px;top:12px}
  .nav__cta{padding:8px 12px;font-size:8px}
  .hero{padding-top:120px}
  .hero h1{font-size:clamp(40px,12vw,58px)}
  .hero__stats{gap:26px}
  .bento{grid-template-columns:1fr;grid-auto-rows:auto}
  .tile,.tile--wide,.tile--tall{grid-column:auto;grid-row:auto;min-height:300px}
  .tile__art{position:absolute}
  .about__facts{grid-template-columns:1fr}
  .kit__grid{grid-template-columns:1fr}
  .timeline__row{grid-template-columns:1fr;gap:8px;padding:20px 0}
  .timeline__dot{display:none}
  .foot{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "aurora",
    css,
    body,
    fonts: ["Sora:wght@400;500;600", "Inter:wght@300;400;500", "JetBrains Mono:wght@400"],
    background: "#080b1d",
    foreground: "#eef0ff",
  });
}
