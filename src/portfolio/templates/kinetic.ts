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

export function renderKinetic(portfolio: Portfolio): string {
  const featured = portfolio.projects[0];
  const second = portfolio.projects[1];

  const body = `<div class="strip" aria-hidden="true">
    <div>${Array.from({ length: 5 })
      .map(() => `<span>${esc(portfolio.hero.marquee)}</span><b>✳</b>`)
      .join("")}</div>
  </div>

  <header class="nav">
    <a class="nav__brand" href="#top"><b>${esc(portfolio.initials)}</b>${esc(portfolio.name)}</a>
    <nav>${navLinks(portfolio)}</nav>
    <a class="nav__cta" href="#contact">${esc(portfolio.availability)} <span>↗</span></a>
  </header>

  <main id="top">
    <section class="hero">
      <div class="hero__blob" aria-hidden="true"></div>
      <div class="container hero__inner">
        <div class="hero__meta" data-reveal>
          <span>${esc(portfolio.hero.kicker)}</span>
          <span>${esc(portfolio.location)}</span>
          <span>↓ scroll</span>
        </div>
        <h1 data-reveal>${accentWords(portfolio.hero.title, 2)}</h1>
        <div class="hero__row">
          <p class="hero__sub" data-reveal style="--d:.08s">${esc(portfolio.hero.subtitle)}</p>
          <div class="hero__ctas" data-reveal style="--d:.14s">
            <a class="pill pill--dark" href="#work">${esc(portfolio.hero.primaryCta)} <span>↘</span></a>
            <a class="pill" href="#contact">${esc(portfolio.hero.secondaryCta)}</a>
          </div>
        </div>
        <div class="hero__bottom">
          <div class="stickers" data-reveal style="--d:.18s">
            ${portfolio.hero.stats
              .map(
                (stat, i) => `<span class="sticker" style="--tilt:${i % 2 ? "-2.4deg" : "1.8deg"}"><b>${esc(
                  stat.value,
                )}</b>${esc(stat.label)}</span>`,
              )
              .join("")}
          </div>
          ${
            featured
              ? `<div class="hero__cards" aria-hidden="true">
                ${second ? `<div class="mini mini--back">${projectArt(second, 1, portfolio.accent)}</div>` : ""}
                <div class="mini">${projectArt(featured, 0, portfolio.accent)}<span>${esc(
                  featured.category,
                )}</span></div>
              </div>`
              : ""
          }
          <div class="badge" aria-hidden="true">
            <svg viewBox="0 0 120 120">
              <defs><path id="badgePath" d="M60,60 m-43,0 a43,43 0 1,1 86,0 a43,43 0 1,1 -86,0"></path></defs>
              <text><textPath href="#badgePath">OPEN FOR WORK · ${esc(portfolio.availability.toUpperCase())} · </textPath></text>
            </svg>
            <span>✦</span>
          </div>
        </div>
      </div>
    </section>

    <section class="work" id="work">
      <div class="container">
        <div class="work__head" data-reveal>
          <h2>Selected<br><em>work</em></h2>
          <p>${pad(portfolio.projects.length)} projects<br>${esc(portfolio.hero.kicker)}</p>
        </div>
        <div class="work__grid">
          ${portfolio.projects
            .map(
              (project, i) => `<a class="card" href="${attr(project.link || "#contact")}"${
                project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              } data-reveal style="--d:${i * 45}ms;--tilt:${i % 2 ? "1.2deg" : "-1.1deg"}">
                <div class="card__top"><span>${pad(i + 1)}</span><span>${esc(project.year || "2026")}</span></div>
                <div class="card__art">${projectArt(project, i, portfolio.accent)}</div>
                <div class="card__meta">
                  <h3>${esc(project.title)}</h3>
                  <span>${esc(project.category)}</span>
                </div>
                <p>${esc(project.blurb)}</p>
                <span class="card__cta">See the work <b>↗</b></span>
              </a>`,
            )
            .join("")}
        </div>
      </div>
    </section>

    <section class="about" id="about">
      <div class="container">
        <div class="about__top" data-reveal>
          <span class="label">★ About the human</span>
          <h2>${accentWords(portfolio.about.heading, 2)}</h2>
        </div>
        <div class="about__grid">
          <div class="about__quote" data-reveal>
            <span class="quote-mark">“</span>
            <p>${esc(portfolio.about.pullQuote)}</p>
          </div>
          <div class="about__body" data-reveal style="--d:.08s">
            ${paragraphs(portfolio.about.body)}
            <div class="about__facts">
              ${portfolio.about.facts
                .map((fact) => `<div><span>${esc(fact.label)}</span><b>${esc(fact.value)}</b></div>`)
                .join("")}
            </div>
          </div>
        </div>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="skills">
          <div class="container">
            <div class="skills__head" data-reveal><span class="label">The toolkit</span><span class="label">Use freely</span></div>
            <div class="skills__grid">
              ${portfolio.skills
                .map(
                  (group, i) => `<div class="skills__group" data-reveal style="--d:${i * 50}ms">
                    <h3>${esc(group.label)}</h3>
                    <div class="tags">${group.items
                      .map((item) => `<span>${esc(item)}</span>`)
                      .join("")}</div>
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
        ? `<section class="cv" id="experience">
          <div class="container">
            <div class="cv__head" data-reveal><h2>The <em>chapters</em></h2><span class="label">Experience</span></div>
            ${portfolio.experience
              .map(
                (job, i) => `<div class="cv__row" data-reveal style="--d:${i * 45}ms">
                  <span class="cv__num">${pad(i + 1)}</span>
                  <span class="cv__period">${esc(job.period)}</span>
                  <div class="cv__role"><h3>${esc(job.role)}</h3><p>${esc(job.company)}</p></div>
                  <p class="cv__summary">${esc(job.summary)}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__inner">
        <span class="label" data-reveal>★ One more thing</span>
        <h2 data-reveal>${accentWords(portfolio.contact.heading, 2)}</h2>
        <p data-reveal style="--d:.08s">${esc(portfolio.contact.blurb)}</p>
        <a class="contact__mail" href="${emailHref(portfolio.email)}" data-reveal style="--d:.14s">${esc(
          portfolio.email,
        )} <span>↗</span></a>
        <div class="contact__foot">
          ${socialLinks(portfolio, "socials")}
          <span>${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <footer class="foot container">
        <span>${esc(portfolio.name)} — ${esc(portfolio.role)}</span>
        <span>${esc(portfolio.location)} / <span data-year></span></span>
        <span>Made in Portfolio Studio</span>
      </footer>
    </section>
  </main>`;

  const css = `
:root{--ink:#17130f;--muted:rgba(23,19,15,.62);--line:rgba(23,19,15,.24)}
body{--display:'Anton',Impact,sans-serif;--sans:'Space Grotesk',system-ui,sans-serif;--mono:'Space Grotesk',system-ui,sans-serif;background:#f4a259;color:var(--ink);font-family:var(--sans)}
.strip{background:var(--ink);color:#f4a259;overflow:hidden;padding:8px 0;position:sticky;top:0;z-index:70}
.strip div{display:flex;gap:24px;align-items:center;white-space:nowrap;animation:slide 28s linear infinite}
.strip span{font-family:var(--display);font-size:12px;letter-spacing:.06em;text-transform:uppercase}
.strip b{color:var(--accent);font-size:10px}
@keyframes slide{to{transform:translateX(-50%)}}
.nav{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 32px;border-bottom:2px solid var(--ink)}
.nav__brand{display:flex;align-items:center;gap:10px;font-family:var(--display);font-size:20px;letter-spacing:.02em;text-transform:uppercase}
.nav__brand b{display:grid;place-items:center;width:32px;height:32px;background:var(--ink);color:#f4a259;border-radius:50%;font-weight:400;font-size:12px;font-family:var(--sans)}
.nav nav{display:flex;gap:20px;font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.nav nav a{border-bottom:2px solid transparent;padding-bottom:2px;transition:border-color .2s}
.nav nav a:hover{border-color:var(--ink)}
.nav__cta{display:inline-flex;align-items:center;gap:7px;font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;background:#fbe3c8;border:2px solid var(--ink);border-radius:999px;padding:8px 13px;white-space:nowrap}
.nav__cta span{color:var(--accent)}
.hero{position:relative;padding:40px 0 0;overflow:hidden}
.hero__blob{position:absolute;right:-10%;top:-10%;width:45vw;height:45vw;border-radius:50%;background:var(--accent);filter:blur(2px);opacity:.9;z-index:0}
.hero__inner{position:relative;z-index:1}
.hero__meta{display:flex;justify-content:space-between;gap:20px;border-top:2px solid var(--ink);border-bottom:1px solid var(--ink);padding:8px 0;font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;flex-wrap:wrap}
.hero h1{font-family:var(--display);font-size:clamp(64px,12.8vw,190px);line-height:.84;letter-spacing:-.015em;text-transform:uppercase;margin:clamp(24px,4vw,50px) 0 0;max-width:14ch}
.hero h1 em{font-style:normal;background:var(--accent);color:var(--accent-ink);padding:0 .09em .02em;display:inline-block;transform:rotate(-1.2deg);box-shadow:6px 6px 0 var(--ink)}
.hero__row{display:flex;justify-content:space-between;gap:36px;align-items:flex-end;margin-top:30px}
.hero__sub{max-width:46ch;font-size:13px;line-height:1.75;font-weight:500}
.hero__ctas{display:flex;gap:9px;flex-wrap:wrap;flex:none}
.pill{display:inline-flex;align-items:center;gap:8px;padding:12px 18px;border:2px solid var(--ink);border-radius:999px;font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;transition:transform .2s}
.pill--dark{background:var(--ink);color:#f4a259}
.pill:hover{transform:translateY(-2px) rotate(-1deg)}
.hero__bottom{position:relative;margin-top:44px;padding-top:20px;border-top:2px solid var(--ink);display:flex;justify-content:space-between;align-items:flex-start;gap:20px;min-height:220px}
.stickers{display:flex;gap:12px;flex-wrap:wrap;max-width:560px}
.sticker{display:flex;flex-direction:column;gap:2px;padding:10px 14px;background:#fbe3c8;border:2px solid var(--ink);border-radius:6px;font-size:8px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;transform:rotate(var(--tilt));box-shadow:4px 4px 0 var(--ink)}
.sticker b{font-family:var(--display);font-size:26px;line-height:1;letter-spacing:.01em}
.hero__cards{position:relative;width:min(38vw,430px);height:250px;flex:none}
.mini{position:absolute;right:0;bottom:0;width:220px;border:2px solid var(--ink);background:#fbe3c8;transform:rotate(4deg);box-shadow:8px 8px 0 var(--ink)}
.mini .poster{aspect-ratio:4/5;border-bottom:2px solid var(--ink)}
.mini>span{display:block;padding:6px 8px;font-size:8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.mini--back{right:120px;bottom:36px;width:190px;transform:rotate(-7deg);z-index:-1;opacity:.92}
.badge{width:118px;height:118px;position:absolute;right:22px;bottom:-8px;background:#fbe3c8;border:2px solid var(--ink);border-radius:50%;display:grid;place-items:center;z-index:3}
.badge svg{position:absolute;inset:4px;width:110px;height:110px;animation:spin 18s linear infinite}
.badge text{font-family:var(--sans);font-size:9px;font-weight:600;letter-spacing:1.2px;fill:var(--ink);text-transform:uppercase}
.badge>span{font-size:26px;color:var(--accent)}
@keyframes spin{to{transform:rotate(360deg)}}
.work{padding:90px 0;background:#fbe3c8;border-top:2px solid var(--ink);border-bottom:2px solid var(--ink)}
.work__head{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:34px}
.work__head h2{font-family:var(--display);font-size:clamp(48px,8vw,120px);line-height:.82;text-transform:uppercase;letter-spacing:-.01em}
.work__head h2 em{font-style:normal;color:var(--accent)}
.work__head>p{font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-align:right;line-height:1.7}
.work__grid{display:grid;grid-template-columns:1fr 1fr;gap:30px}
.card{display:flex;flex-direction:column;gap:10px;border:2px solid var(--ink);background:#f4a259;padding:12px 12px 18px;transform:rotate(var(--tilt));box-shadow:8px 8px 0 var(--ink);transition:transform .25s,box-shadow .25s}
.card:hover{transform:rotate(0deg) translateY(-3px);box-shadow:10px 12px 0 var(--ink)}
.card__top{display:flex;justify-content:space-between;font-size:8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.card__art{border:2px solid var(--ink)}
.card__art .poster{aspect-ratio:16/11}
.card__meta{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
.card__meta h3{font-family:var(--display);font-size:clamp(22px,2.8vw,34px);line-height:1;text-transform:uppercase;letter-spacing:.01em}
.card__meta span{font-size:8px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;text-align:right;white-space:nowrap}
.card>p{font-size:11.5px;line-height:1.65;max-width:52ch}
.card__cta{margin-top:auto;font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;display:flex;gap:6px;align-items:center}
.card__cta b{color:var(--accent);font-size:12px}
.about{background:var(--ink);color:#f4a259;padding:80px 0;overflow:hidden}
.label{font-size:9px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
.about .label,.kinetic .label{color:rgba(244,162,89,.6)}
.about__top{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-bottom:34px}
.about__top h2{font-family:var(--display);font-size:clamp(40px,6.6vw,96px);line-height:.86;text-transform:uppercase;max-width:15ch;text-align:right}
.about__top h2 em{font-style:normal;color:var(--accent)}
.about__grid{display:grid;grid-template-columns:1fr 1fr;gap:52px;border-top:1px solid rgba(244,162,89,.3);padding-top:34px}
.about__quote{position:relative;padding-left:34px}
.quote-mark{font-family:var(--display);font-size:100px;line-height:.6;color:var(--accent);display:block;margin-bottom:14px}
.about__quote p{font-family:var(--display);font-size:clamp(24px,3.2vw,40px);line-height:1.08;text-transform:uppercase;max-width:18ch}
.about__body p{font-size:12px;line-height:1.85;color:rgba(244,162,89,.72);margin-bottom:14px;max-width:50ch}
.about__facts{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px;border-top:1px solid rgba(244,162,89,.3);padding-top:20px}
.about__facts span{display:block;font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:rgba(244,162,89,.5);margin-bottom:4px}
.about__facts b{font-weight:500;font-size:11px}
.skills{padding:70px 0;background:#f4a259}
.skills__head{display:flex;justify-content:space-between;border-bottom:2px solid var(--ink);padding-bottom:10px;margin-bottom:22px}
.skills__grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:28px}
.skills__group h3{font-family:var(--display);font-size:24px;text-transform:uppercase;margin-bottom:12px}
.tags{display:flex;flex-wrap:wrap;gap:7px}
.tags span{font-size:9px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;padding:6px 10px;border:1.5px solid var(--ink);border-radius:999px;background:#fbe3c8}
.cv{background:#fbe3c8;padding:70px 0;border-top:2px solid var(--ink)}
.cv__head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-bottom:26px}
.cv__head h2{font-family:var(--display);font-size:clamp(36px,5vw,72px);line-height:.9;text-transform:uppercase}
.cv__head h2 em{font-style:normal;background:var(--accent);color:var(--accent-ink);padding:0 .06em}
.cv__row{display:grid;grid-template-columns:40px 130px 1.1fr 1.3fr;gap:20px;align-items:baseline;padding:16px 0;border-top:1.5px solid var(--ink)}
.cv__num,.cv__period{font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.cv__period{color:var(--muted)}
.cv__role h3{font-family:var(--display);font-size:22px;line-height:1.05;text-transform:uppercase}
.cv__role p{font-size:9px;font-weight:600;color:var(--accent);letter-spacing:.04em;margin-top:4px;text-transform:uppercase}
.cv__summary{font-size:11px;line-height:1.7;color:var(--muted)}
.contact{background:var(--accent);color:var(--accent-ink);padding:70px 0 0;border-top:2px solid var(--ink)}
.contact .label{color:var(--accent-ink);opacity:.65}
.contact h2{font-family:var(--display);font-size:clamp(44px,8vw,120px);line-height:.84;text-transform:uppercase;max-width:15ch;margin:18px 0 22px}
.contact h2 em{font-style:normal;background:var(--accent-ink);color:var(--accent);padding:0 .06em}
.contact__inner>p{max-width:52ch;font-size:12.5px;line-height:1.8}
.contact__mail{display:inline-block;margin:28px 0;font-family:var(--display);font-size:clamp(24px,4vw,48px);line-height:1;text-transform:lowercase;border-bottom:3px solid currentColor;padding-bottom:5px;transition:opacity .2s}
.contact__mail:hover{opacity:.7}
.contact__mail span{font-family:var(--sans);font-size:.6em}
.contact__foot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;align-items:center;border-top:2px solid var(--accent-ink);padding-top:18px;margin-top:18px;font-size:9px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.socials{display:flex;gap:20px;flex-wrap:wrap}
.socials a{border-bottom:1px solid currentColor;padding-bottom:2px}
.contact__foot>span{opacity:.7}
.foot{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:20px 0;font-size:8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;border-top:2px solid var(--accent-ink);margin-top:40px;opacity:.8}
@media (max-width:1024px){
  .nav nav{display:none}
  .hero__cards{display:none}
  .hero__bottom{min-height:auto}
  .badge{position:relative;right:auto;bottom:auto;margin-left:auto;flex:none}
  .hero__row{flex-direction:column;align-items:flex-start;gap:20px}
  .work__grid{grid-template-columns:1fr}
  .about__grid{grid-template-columns:1fr;gap:30px}
  .about__top{flex-direction:column;align-items:flex-start}
  .about__top h2{text-align:left}
  .cv__row{grid-template-columns:30px 100px 1fr}
  .cv__summary{grid-column:3}
  .contact__foot{align-items:flex-start;flex-direction:column}
}
@media (max-width:720px){
  .nav{padding:14px 20px}
  .nav__cta{font-size:7px;padding:7px 9px}
  .hero h1{font-size:clamp(52px,16vw,88px)}
  .hero__meta span:nth-child(2){display:none}
  .hero__bottom{flex-direction:column}
  .badge{width:96px;height:96px;margin-top:10px}
  .badge svg{width:88px;height:88px}
  .work,.about,.skills,.cv,.contact{padding-top:55px}
  .work__grid{gap:22px}
  .stickers{gap:8px}
  .sticker b{font-size:22px}
  .cv__row{grid-template-columns:1fr;gap:5px}
  .cv__summary{grid-column:auto}
  .foot{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "kinetic",
    css,
    body,
    fonts: ["Anton", "Space Grotesk:wght@400;500;600;700"],
    background: "#f4a259",
    foreground: "#17130f",
  });
}
