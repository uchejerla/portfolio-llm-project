import type { Portfolio } from "../types";
import {
  accentWords,
  attr,
  emailHref,
  esc,
  pad,
  paragraphs,
  projectArt,
  renderShell,
  socialLinks,
} from "./common";

export function renderAtelier(portfolio: Portfolio): string {
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];

  const body = `<header class="top">
    <div class="container top__row">
      <span class="top__est">Est. ${new Date().getFullYear() - 6} · ${esc(portfolio.location)}</span>
      <a class="top__brand" href="#top">${esc(portfolio.name)}<span>Portfolio</span></a>
      <a class="top__contact" href="#contact">${esc(portfolio.availability)}</a>
    </div>
    <div class="top__rule"></div>
    <nav class="container top__nav">
      <a href="#work">Collection</a><a href="#about">Maison</a><a href="#experience">Parcours</a><a href="#contact">Contact</a>
    </nav>
  </header>

  <main id="top">
    <section class="hero container">
      <p class="eyebrow" data-reveal>${esc(portfolio.hero.kicker)} — ${esc(portfolio.role)}</p>
      <h1 data-reveal>${accentWords(portfolio.hero.title, 2)}</h1>
      <p class="hero__sub" data-reveal style="--d:.08s">${esc(portfolio.hero.subtitle)}</p>
      <div class="hero__links" data-reveal style="--d:.14s">
        <a href="#work">${esc(portfolio.hero.primaryCta)} <span>↓</span></a>
        <i></i>
        <a href="#contact">${esc(portfolio.hero.secondaryCta)} <span>↗</span></a>
      </div>
      ${
        featured
          ? `<figure class="hero__plate" data-reveal style="--d:.2s">
            <a href="${attr(featured.link || "#work")}"${
              featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
            }>${projectArt(featured, 0, portfolio.accent)}</a>
            <figcaption>
              <span>${esc(featured.category)}</span>
              <span>${esc(featured.title)}</span>
              <span>${esc(featured.year || "2026")}</span>
            </figcaption>
          </figure>`
          : ""
      }
    </section>

    <section class="line" aria-hidden="true"><div class="container"><span>${esc(portfolio.hero.marquee)}</span></div></section>

    <section class="collection container" id="work">
      <div class="section-label" data-reveal>
        <span>Collection</span><i></i><span>${pad(portfolio.projects.length)} pieces</span>
      </div>
      <div class="lookbook">
        ${portfolio.projects
          .map(
            (project, i) => `<article class="look" data-reveal style="--d:${i * 50}ms">
              <a class="look__art" href="${attr(project.link || "#contact")}"${
                project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              }>${projectArt(project, i, portfolio.accent)}</a>
              <div class="look__caption">
                <span class="look__num">${pad(i + 1)}</span>
                <div>
                  <h2>${esc(project.title)}</h2>
                  <p>${esc(project.category)} · ${esc(project.year || "—")}</p>
                </div>
                <a href="${attr(project.link || "#contact")}"${
                  project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
                }>View</a>
              </div>
              <p class="look__blurb">${esc(project.blurb)}</p>
            </article>`,
          )
          .join("")}
      </div>
    </section>

    <section class="about" id="about">
      <div class="container about__grid">
        <div class="about__seal" data-reveal>
          <span>${esc(portfolio.initials)}</span>
          <small>Atelier</small>
        </div>
        <div class="about__main">
          <p class="eyebrow" data-reveal>The maison</p>
          <h2 data-reveal>${accentWords(portfolio.about.heading, 2)}</h2>
          <blockquote data-reveal style="--d:.06s">${esc(portfolio.about.pullQuote)}</blockquote>
          <div class="about__copy" data-reveal style="--d:.1s">${paragraphs(portfolio.about.body)}</div>
        </div>
        <aside class="about__facts" data-reveal style="--d:.14s">
          ${portfolio.about.facts
            .map((fact) => `<div><span>${esc(fact.label)}</span><b>${esc(fact.value)}</b></div>`)
            .join("")}
        </aside>
      </div>
    </section>

    ${
      portfolio.skills.length
        ? `<section class="savoir container">
          <div class="section-label" data-reveal><span>Savoir-faire</span><i></i><span>Disciplines</span></div>
          <div class="savoir__list">
            ${portfolio.skills
              .map(
                (group, i) => `<div class="savoir__row" data-reveal style="--d:${i * 40}ms">
                  <h3>${esc(group.label)}</h3>
                  <p>${group.items.map(esc).join(" · ")}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    ${
      portfolio.experience.length
        ? `<section class="parcours" id="experience">
          <div class="container">
            <div class="section-label" data-reveal><span>Parcours</span><i></i><span>Selected houses</span></div>
            ${portfolio.experience
              .map(
                (job, i) => `<div class="parcours__row" data-reveal style="--d:${i * 40}ms">
                  <span class="parcours__period">${esc(job.period)}</span>
                  <h3>${esc(job.role)}</h3>
                  <p class="parcours__house">${esc(job.company)}</p>
                  <p class="parcours__summary">${esc(job.summary)}</p>
                </div>`,
              )
              .join("")}
          </div>
        </section>`
        : ""
    }

    <section class="contact" id="contact">
      <div class="container contact__inner">
        <p class="eyebrow" data-reveal>Enquiries</p>
        <h2 data-reveal>${accentWords(portfolio.contact.heading, 2)}</h2>
        <p class="contact__blurb" data-reveal style="--d:.06s">${esc(portfolio.contact.blurb)}</p>
        <a class="contact__mail" href="${emailHref(portfolio.email)}" data-reveal style="--d:.12s">${esc(
          portfolio.email,
        )}</a>
        <div class="contact__meta" data-reveal style="--d:.16s">
          ${socialLinks(portfolio)}
          <span>${esc(portfolio.contact.note)}</span>
        </div>
      </div>
      <footer class="foot container">
        <span>${esc(portfolio.name)} · ${esc(portfolio.role)}</span>
        <span>${esc(portfolio.location)}</span>
        <span>Portfolio Studio · <span data-year></span></span>
      </footer>
    </section>
  </main>`;

  const css = `
:root{--muted:rgba(44,38,32,.55);--line:rgba(44,38,32,.2)}
body{--display:'Cormorant Garamond',Georgia,serif;--sans:'Jost',system-ui,sans-serif;--mono:'Jost',system-ui,sans-serif;background:#f2ece3;color:#2c2620;font-family:var(--sans);font-weight:300}
.container{width:min(1280px,calc(100% - 72px))}
.top{padding-top:20px;position:relative;z-index:10}
.top__row{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px;padding-bottom:18px}
.top__est,.top__contact{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}
.top__contact{justify-self:end;border-bottom:1px solid var(--line);padding-bottom:2px;white-space:nowrap}
.top__brand{font-family:var(--display);font-size:28px;letter-spacing:.02em;text-align:center;text-transform:uppercase;line-height:1}
.top__brand span{display:block;font-family:var(--sans);font-size:7px;letter-spacing:.36em;color:var(--muted);margin-top:6px}
.top__rule{height:1px;background:var(--line)}
.top__nav{display:flex;justify-content:center;gap:36px;padding:13px 0;font-size:8px;letter-spacing:.24em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--line)}
.top__nav a{transition:color .25s}
.top__nav a:hover{color:var(--accent)}
.eyebrow{font-family:var(--sans);font-size:8px;letter-spacing:.26em;text-transform:uppercase;color:var(--muted)}
.hero{padding:clamp(60px,9vw,110px) 0 0;text-align:center}
.hero h1{font-family:var(--display);font-size:clamp(56px,9.4vw,150px);line-height:.9;letter-spacing:-.02em;font-weight:400;max-width:13ch;margin:clamp(20px,3vw,34px) auto 0}
.hero h1 em{font-style:italic;color:var(--accent)}
.hero__sub{max-width:46ch;margin:28px auto 0;font-size:13px;line-height:1.9;color:var(--muted)}
.hero__links{display:flex;justify-content:center;align-items:center;gap:22px;margin:32px 0 clamp(44px,6vw,70px);font-size:8px;letter-spacing:.2em;text-transform:uppercase}
.hero__links a{padding-bottom:4px;border-bottom:1px solid transparent;transition:border-color .25s,color .25s}
.hero__links a:hover{color:var(--accent);border-color:var(--accent)}
.hero__links span{color:var(--accent)}
.hero__links i{width:34px;height:1px;background:var(--line);display:block}
.hero__plate{margin:0}
.hero__plate a{display:block;position:relative;aspect-ratio:21/9;overflow:hidden;background:#e6ded2}
.hero__plate .poster{position:absolute;inset:0;transition:transform 1.2s cubic-bezier(.16,1,.3,1)}
.hero__plate a:hover .poster{transform:scale(1.02)}
.hero__plate figcaption{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;padding-top:12px;font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);text-align:left}
.hero__plate figcaption span:nth-child(2){text-align:center;color:#2c2620}
.hero__plate figcaption span:last-child{text-align:right}
.line{border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:12px 0;margin-top:clamp(40px,6vw,70px);overflow:hidden;white-space:nowrap}
.line span{display:block;text-align:center;font-size:8px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted);font-family:var(--display);font-style:italic;font-size:13px}
.collection{padding:clamp(60px,8vw,100px) 0}
.section-label{display:flex;align-items:center;gap:18px;font-size:8px;letter-spacing:.26em;text-transform:uppercase;color:var(--muted);margin-bottom:44px}
.section-label i{flex:1;height:1px;background:var(--line);display:block}
.lookbook{display:grid;grid-template-columns:1fr 1fr;gap:60px 44px}
.look:nth-child(even){margin-top:70px}
.look__art{display:block;position:relative;aspect-ratio:3/4;overflow:hidden;background:#e6ded2}
.look__art .poster{position:absolute;inset:0;transition:transform 1.2s cubic-bezier(.16,1,.3,1),filter .6s}
.look__art:hover .poster{transform:scale(1.035)}
.look__caption{display:flex;align-items:baseline;gap:14px;padding:14px 0 8px;border-bottom:1px solid var(--line)}
.look__num{font-size:8px;letter-spacing:.16em;color:var(--muted)}
.look__caption>div{flex:1}
.look__caption h2{font-family:var(--display);font-size:clamp(24px,2.8vw,34px);font-weight:400;line-height:1.1;letter-spacing:.01em}
.look__caption p{font-size:8px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted);margin-top:6px}
.look__caption>a{font-size:8px;letter-spacing:.2em;text-transform:uppercase;border-bottom:1px solid var(--line);padding-bottom:2px;transition:color .25s,border-color .25s}
.look__caption>a:hover{color:var(--accent);border-color:var(--accent)}
.look__blurb{margin-top:12px;font-size:11.5px;line-height:1.9;color:var(--muted);max-width:46ch}
.about{padding:clamp(60px,8vw,100px) 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:rgba(255,255,255,.25)}
.about__grid{display:grid;grid-template-columns:170px 1.2fr .8fr;gap:clamp(26px,5vw,64px)}
.about__seal{width:150px;height:150px;border:1px solid var(--line);border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;margin-top:6px}
.about__seal span{font-family:var(--display);font-size:48px;line-height:1;color:var(--accent)}
.about__seal small{font-size:7px;letter-spacing:.3em;text-transform:uppercase;color:var(--muted)}
.about__main h2{font-family:var(--display);font-size:clamp(36px,4.6vw,58px);line-height:1.02;font-weight:400;letter-spacing:-.01em;margin:18px 0 24px;max-width:16ch}
.about__main h2 em{font-style:italic;color:var(--accent)}
.about__main blockquote{margin:0 0 24px;font-family:var(--display);font-size:22px;line-height:1.5;font-style:italic;color:rgba(44,38,32,.8);max-width:36ch;border-left:1px solid var(--accent);padding-left:18px}
.about__copy{font-size:11.5px;line-height:2;color:var(--muted);display:grid;gap:14px;max-width:54ch}
.about__facts{display:flex;flex-direction:column;gap:18px;border-top:1px solid var(--line);padding-top:18px}
.about__facts span{display:block;font-size:7px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);margin-bottom:5px}
.about__facts b{font-weight:400;font-size:11px;letter-spacing:.02em}
.savoir{padding:clamp(60px,8vw,90px) 0}
.savoir__list{border-top:1px solid var(--line)}
.savoir__row{display:grid;grid-template-columns:220px 1fr;gap:30px;padding:16px 0;border-bottom:1px solid var(--line);align-items:baseline}
.savoir__row h3{font-family:var(--display);font-size:20px;font-weight:400;letter-spacing:.02em}
.savoir__row p{font-size:10.5px;line-height:1.8;color:var(--muted)}
.parcours{padding:0 0 clamp(60px,8vw,90px)}
.parcours__row{display:grid;grid-template-columns:110px 1.1fr .9fr 1.3fr;gap:24px;padding:16px 0;border-bottom:1px solid var(--line);align-items:baseline}
.parcours__period{font-size:8px;letter-spacing:.14em;color:var(--muted)}
.parcours__row h3{font-family:var(--display);font-size:21px;font-weight:400;line-height:1.2}
.parcours__house{font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent)}
.parcours__summary{font-size:10.5px;line-height:1.8;color:var(--muted)}
.contact{border-top:1px solid var(--line);padding:clamp(60px,8vw,100px) 0 0;text-align:center}
.contact h2{font-family:var(--display);font-size:clamp(40px,6vw,80px);line-height:.98;font-weight:400;letter-spacing:-.015em;max-width:16ch;margin:20px auto 0}
.contact h2 em{font-style:italic;color:var(--accent)}
.contact__blurb{max-width:48ch;margin:22px auto 0;font-size:11.5px;line-height:2;color:var(--muted)}
.contact__mail{display:inline-block;margin:32px 0 26px;font-family:var(--display);font-size:clamp(24px,3.4vw,40px);border-bottom:1px solid var(--line);padding-bottom:4px;transition:color .25s,border-color .25s}
.contact__mail:hover{color:var(--accent);border-color:var(--accent)}
.contact__meta{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:18px;text-align:left}
.socials{display:flex;gap:22px;flex-wrap:wrap}
.socials a{font-size:8px;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);transition:color .25s}
.socials a:hover{color:var(--accent)}
.contact__meta>span{font-size:9px;color:var(--muted);font-style:italic}
.foot{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;border-top:1px solid var(--line);margin-top:40px;padding:18px 0;font-size:7px;letter-spacing:.18em;text-transform:uppercase;color:var(--muted)}
@media (max-width:1024px){
  .top__nav{display:none}
  .about__grid{grid-template-columns:1fr;gap:24px}
  .about__seal{width:104px;height:104px}
  .about__seal span{font-size:34px}
  .about__facts{flex-direction:row;flex-wrap:wrap;gap:24px}
  .lookbook{gap:48px 30px}
  .parcours__row{grid-template-columns:100px 1fr 1fr;gap:10px}
  .parcours__summary{grid-column:2/-1}
}
@media (max-width:720px){
  .container{width:calc(100% - 40px)}
  .top__row{grid-template-columns:1fr auto;gap:12px}
  .top__est{display:none}
  .top__brand{text-align:left;font-size:23px}
  .hero{padding-top:44px}
  .hero h1{font-size:clamp(44px,13vw,68px);max-width:12ch}
  .hero__plate a{aspect-ratio:4/3}
  .hero__plate figcaption{grid-template-columns:1fr auto;gap:8px}
  .hero__plate figcaption span:nth-child(2){text-align:left;grid-row:2;grid-column:1/-1}
  .lookbook{grid-template-columns:1fr;gap:48px}
  .look:nth-child(even){margin-top:0}
  .savoir__row{grid-template-columns:1fr;gap:6px}
  .parcours__row{grid-template-columns:1fr;gap:6px}
  .parcours__summary{grid-column:auto}
  .contact__meta{flex-direction:column}
  .foot{font-size:6.5px}
}
`;
  return renderShell({
    portfolio,
    template: "atelier",
    css,
    body,
    fonts: ["Cormorant Garamond:ital,wght@0,300;0,400;1,300;1,400", "Jost:wght@300;400;500"],
    background: "#f2ece3",
    foreground: "#2c2620",
  });
}
