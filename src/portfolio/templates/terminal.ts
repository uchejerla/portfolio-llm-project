import type { Portfolio } from "../types";
import {
  attr,
  emailHref,
  esc,
  navLinks,
  pad,
  projectArt,
  renderShell,
  socialLinks,
} from "./common";

export function renderTerminal(portfolio: Portfolio): string {
  const featured = portfolio.projects.find((project) => project.featured) ?? portfolio.projects[0];
  const stack = portfolio.skills.flatMap((group) => group.items);

  const body = `<div class="shell">
    <header class="titlebar">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="titlebar__path">${esc(portfolio.email || "~/portfolio")} — zsh — 120×36</span>
      <span class="titlebar__status">CONNECTED</span>
    </header>

    <nav class="nav">
      <span class="prompt"><b>guest</b>@studio:~$</span>
      <div class="nav__links">${navLinks(portfolio)}</div>
      <span class="nav__blink">▮</span>
    </nav>

    <main id="top">
      <section class="hero">
        <div class="container">
          <p class="cmd" data-reveal><span class="sigil">$</span> whoami</p>
          <h1 data-reveal>${esc(portfolio.name)}<span class="cursor"></span></h1>
          <p class="role" data-reveal style="--d:.06s">// ${esc(portfolio.role)} — ${esc(portfolio.location)}</p>
          <p class="bio" data-reveal style="--d:.1s">${esc(portfolio.hero.subtitle)}</p>
          <div class="hero__actions" data-reveal style="--d:.14s">
            <a class="cmd-link" href="#work">./view-work --all</a>
            <a class="cmd-link cmd-link--ghost" href="#contact">./say-hello.sh</a>
          </div>
          <div class="sysinfo" data-reveal style="--d:.18s">
            <div><span>STATUS</span><b><i></i>${esc(portfolio.availability)}</b></div>
            <div><span>UPTIME</span><b>${esc(portfolio.hero.stats[0]?.value ?? "08")} years</b></div>
            <div><span>PROJECTS</span><b>${pad(portfolio.projects.length)} indexed</b></div>
            <div><span>LOCATION</span><b>${esc(portfolio.location)}</b></div>
          </div>
        </div>
      </section>

      ${
        featured
          ? `<section class="feature container" data-reveal>
            <div class="feature__term">
              <div class="term-head"><span>~/work/${esc(featured.title.toLowerCase().replace(/\s+/g, "-"))}</span><span>featured</span></div>
              ${projectArt(featured, 0, portfolio.accent)}
            </div>
            <div class="feature__copy">
              <p class="cmd"><span class="sigil">$</span> cat ${esc(featured.title.toLowerCase().replace(/\s+/g, "-"))}.md</p>
              <h2>${esc(featured.title)}</h2>
              <p>${esc(featured.blurb)}</p>
              <div class="chips">${featured.tags.map((tag) => `<span>#${esc(tag)}</span>`).join("")}</div>
              <a class="cmd-link" href="${attr(featured.link || "#contact")}"${
                featured.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              }>open case study →</a>
            </div>
          </section>`
          : ""
      }

      <section class="work container" id="work">
        <p class="cmd" data-reveal><span class="sigil">$</span> ls -la ./work</p>
        <div class="listing" data-reveal style="--d:.06s">
          <div class="listing__head">
            <span>PERMS</span><span>IDX</span><span>PROJECT</span><span>GENRE</span><span>YEAR</span><span>OPEN</span>
          </div>
          ${portfolio.projects
            .map(
              (project, i) => `<a class="listing__row" href="${attr(project.link || "#contact")}"${
                project.link ? ` target="_blank" rel="noreferrer noopener"` : ""
              }>
                <span class="dim">drwxr-xr-x</span>
                <span class="dim">${pad(i + 1)}</span>
                <span class="name">${esc(project.title)}</span>
                <span class="dim">${esc(project.category)}</span>
                <span class="dim">${esc(project.year || "—")}</span>
                <span class="go">↗</span>
              </a>`,
            )
            .join("")}
        </div>
        <p class="footnote">${portfolio.projects.length} files · last modified <span data-year></span></p>
      </section>

      <section class="about container" id="about">
        <p class="cmd" data-reveal><span class="sigil">$</span> cat about.md</p>
        <div class="about__grid" data-reveal>
          <div class="about__doc">
            <h2># ${esc(portfolio.about.heading)}</h2>
            <blockquote>&gt; ${esc(portfolio.about.pullQuote)}</blockquote>
            ${portfolio.about.body.map((item) => `<p>${esc(item)}</p>`).join("")}
            <div class="about__facts">
              ${portfolio.about.facts
                .map(
                  (fact) => `<span><b>${esc(fact.label)}:</b> ${esc(fact.value)}</span>`,
                )
                .join("")}
            </div>
          </div>
          <div class="about__side">
            ${portfolio.skills
              .map(
                (group) => `<div class="tree">
                  <span class="tree__root">${esc(group.label.toLowerCase())}/</span>
                  ${group.items
                    .map((item, i) => `<span>${i === group.items.length - 1 ? "└──" : "├──"} ${esc(item)}</span>`)
                    .join("")}
                </div>`,
              )
              .join("")}
          </div>
        </div>
      </section>

      ${
        portfolio.experience.length
          ? `<section class="log container" id="experience">
            <p class="cmd" data-reveal><span class="sigil">$</span> git log --oneline --career</p>
            <div class="log__list" data-reveal>
              ${portfolio.experience
                .map(
                  (job, i) => `<div class="log__row">
                    <span class="hash">${(0x9e3f1a + i * 7919).toString(16).slice(0, 7)}</span>
                    <span class="log__period">${esc(job.period)}</span>
                    <span class="log__msg"><b>${esc(job.role)}</b> @ ${esc(job.company)}</span>
                    <span class="log__summary">${esc(job.summary)}</span>
                  </div>`,
                )
                .join("")}
            </div>
            ${stack.length ? `<p class="stackline">$ echo $STACK → ${stack.map(esc).join(" · ")}</p>` : ""}
          </section>`
          : ""
      }

      <section class="contact container" id="contact">
        <div class="contact__box" data-reveal>
          <div class="term-head"><span>contact.sh</span><span>bash</span></div>
          <div class="contact__body">
            <p class="cmd"><span class="sigil">$</span> mail -s "let's build something" ${esc(portfolio.email)}</p>
            <h2>${esc(portfolio.contact.heading)}</h2>
            <p class="contact__blurb">${esc(portfolio.contact.blurb)}</p>
            <a class="contact__mail" href="${emailHref(portfolio.email)}">${esc(portfolio.email)}<span class="cursor cursor--small"></span></a>
            <div class="contact__foot">
              ${socialLinks(portfolio, "socials")}
              <span class="dim">${esc(portfolio.contact.note)}</span>
            </div>
          </div>
        </div>
        <footer class="footer">
          <span>${esc(portfolio.name)} — ${esc(portfolio.role)} · © <span data-year></span></span>
          <span>exit 0 <span class="cursor cursor--small"></span></span>
          <span>built with Portfolio Studio</span>
        </footer>
      </section>
    </main>
  </div>`;

  const css = `
:root{--muted:rgba(182,255,202,.5);--line:rgba(182,255,202,.16)}
body{background:#07120c;background-image:radial-gradient(100% 60% at 50% 0%,rgba(93,255,141,.07),transparent 70%);color:#b6ffca;font-family:var(--mono);font-size:13px;line-height:1.7}
body::before{content:"";position:fixed;inset:0;z-index:90;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(0,0,0,.14) 0px,rgba(0,0,0,.14) 1px,transparent 1px,transparent 3px);opacity:.4}
::selection{background:var(--accent);color:#07120c}
.shell{max-width:1320px;margin:0 auto;padding:18px}
.titlebar{display:flex;align-items:center;justify-content:space-between;gap:16px;border:1px solid var(--line);border-bottom:0;padding:9px 14px;background:rgba(182,255,202,.04);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.dots{display:flex;gap:6px}
.dots i{width:8px;height:8px;border-radius:50%;border:1px solid var(--muted);display:block}
.titlebar__status{color:var(--accent)}
.nav{display:flex;align-items:center;gap:18px;border:1px solid var(--line);padding:11px 14px;background:rgba(93,255,141,.04);position:sticky;top:18px;z-index:60;backdrop-filter:blur(8px)}
.prompt{font-size:11px;white-space:nowrap}
.prompt b{color:var(--accent);font-weight:400}
.nav__links{display:flex;gap:18px;margin-left:auto;font-size:10px;text-transform:lowercase;color:var(--muted)}
.nav__links a::before{content:"./";opacity:.45}
.nav__links a:hover{color:var(--accent)}
.nav__blink{color:var(--accent);animation:blink 1.2s step-end infinite}
@keyframes blink{50%{opacity:0}}
.container{padding:0 8px}
main{border:1px solid var(--line);border-top:0;padding:10px 6px 0}
.hero{padding:clamp(50px,9vw,110px) 0 56px;border-bottom:1px dashed var(--line)}
.cmd{font-size:10px;color:var(--muted);letter-spacing:.04em;margin-bottom:18px}
.sigil{color:var(--accent)}
.hero h1{font-family:var(--mono);font-weight:400;font-size:clamp(44px,9.2vw,118px);line-height:.92;letter-spacing:-.055em;color:#ddffe6;text-transform:uppercase;margin-bottom:18px;display:flex;align-items:flex-end;gap:4px;flex-wrap:wrap}
.cursor{display:inline-block;width:.5em;height:1em;background:var(--accent);margin-left:6px;animation:blink 1.1s step-end infinite;vertical-align:baseline;transform:translateY(.08em)}
.cursor--small{width:.4em;height:.9em;margin-left:4px}
.role{color:var(--accent);font-size:11px;letter-spacing:.06em;margin-bottom:22px}
.bio{max-width:62ch;font-size:13px;line-height:1.9;color:rgba(221,255,230,.72);margin-bottom:30px}
.hero__actions{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:44px}
.cmd-link{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;border:1px solid var(--accent);background:var(--accent);color:#07120c;font-size:10px;letter-spacing:.02em;transition:opacity .2s,transform .2s}
.cmd-link:hover{opacity:.85;transform:translateY(-1px)}
.cmd-link--ghost{background:transparent;color:var(--accent)}
.sysinfo{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);font-size:9px}
.sysinfo div{padding:11px 13px;border-right:1px solid var(--line);display:flex;flex-direction:column;gap:4px}
.sysinfo div:last-child{border-right:0}
.sysinfo span{color:var(--muted);letter-spacing:.12em}
.sysinfo b{font-weight:400;font-size:10px;color:#ddffe6;display:flex;align-items:center;gap:6px;text-transform:none;letter-spacing:0}
.sysinfo i{width:6px;height:6px;background:var(--accent);display:inline-block;border-radius:50%;box-shadow:0 0 8px var(--accent)}
.feature{display:grid;grid-template-columns:1.1fr 1fr;gap:clamp(20px,4vw,50px);padding:clamp(40px,6vw,76px) 8px;border-bottom:1px dashed var(--line);align-items:center}
.feature__term{border:1px solid var(--line);position:relative;background:#020a05}
.term-head{display:flex;justify-content:space-between;gap:12px;padding:8px 12px;border-bottom:1px solid var(--line);font-size:8px;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.feature__term .poster{aspect-ratio:16/10;border:0}
.feature__copy h2{font-size:clamp(26px,3.4vw,42px);line-height:1.05;letter-spacing:-.03em;color:#ddffe6;margin-bottom:16px}
.feature__copy p{font-size:12px;line-height:1.9;color:rgba(221,255,230,.65);max-width:48ch}
.chips{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0 26px}
.chips span{font-size:9px;color:var(--accent);border:1px solid var(--line);padding:4px 8px}
.work{padding:70px 8px;border-bottom:1px dashed var(--line)}
.listing{border:1px solid var(--line);overflow:hidden}
.listing__head,.listing__row{display:grid;grid-template-columns:110px 46px 1.5fr 1fr 70px 46px;gap:12px;align-items:center;padding:11px 14px;font-size:10px}
.listing__head{background:rgba(182,255,202,.06);color:var(--muted);letter-spacing:.12em;font-size:8px;border-bottom:1px solid var(--line)}
.listing__row{border-bottom:1px solid rgba(182,255,202,.08);transition:background .2s,color .2s}
.listing__row:last-child{border-bottom:0}
.listing__row:hover{background:rgba(93,255,141,.07)}
.listing__row .name{color:#ddffe6;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.listing__row:hover .name{color:var(--accent)}
.dim{color:var(--muted);font-size:9px;letter-spacing:.02em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.go{color:var(--accent);text-align:right;font-size:12px}
.footnote{font-size:9px;color:var(--muted);margin-top:14px}
.about{padding:70px 8px;border-bottom:1px dashed var(--line)}
.about__grid{display:grid;grid-template-columns:1.4fr .6fr;gap:clamp(28px,5vw,70px)}
.about__doc h2{font-family:var(--mono);font-size:clamp(20px,2.6vw,30px);letter-spacing:-.02em;color:#ddffe6;margin-bottom:20px;font-weight:400}
.about__doc blockquote{margin:0 0 22px;padding-left:16px;border-left:2px solid var(--accent);font-size:12px;line-height:1.9;color:rgba(221,255,230,.7)}
.about__doc p{font-size:12px;line-height:1.95;color:rgba(221,255,230,.6);margin-bottom:14px;max-width:64ch}
.about__facts{display:flex;flex-wrap:wrap;gap:8px 22px;margin-top:22px;padding-top:16px;border-top:1px solid var(--line);font-size:9px;color:var(--muted)}
.about__facts b{color:var(--accent);font-weight:400}
.tree{display:flex;flex-direction:column;gap:5px;font-size:10px;color:var(--muted);margin-bottom:20px}
.tree__root{color:var(--accent);margin-bottom:3px}
.tree span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.log{padding:70px 8px;border-bottom:1px dashed var(--line)}
.log__row{display:grid;grid-template-columns:86px 110px 1.1fr 1.4fr;gap:18px;padding:11px 0;border-bottom:1px solid rgba(182,255,202,.09);font-size:10px;align-items:baseline}
.hash{color:var(--accent);opacity:.7}
.log__period{color:var(--muted)}
.log__msg{color:#ddffe6}
.log__msg b{font-weight:400}
.log__summary{color:rgba(221,255,230,.5);font-size:10px;line-height:1.7}
.stackline{font-size:9px;color:var(--muted);margin-top:18px;line-height:1.9}
.contact{padding:70px 8px 0}
.contact__box{border:1px solid var(--line);background:rgba(93,255,141,.025)}
.contact__body{padding:clamp(24px,4vw,48px)}
.contact__body h2{font-size:clamp(26px,4.4vw,54px);line-height:1.05;letter-spacing:-.04em;color:#ddffe6;margin-bottom:18px;max-width:18ch}
.contact__blurb{max-width:56ch;font-size:12px;line-height:1.9;color:rgba(221,255,230,.6)}
.contact__mail{display:inline-flex;align-items:center;gap:2px;margin:28px 0;font-size:clamp(16px,2.6vw,28px);color:var(--accent);border-bottom:1px solid var(--accent);padding-bottom:4px}
.contact__foot{display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap;border-top:1px solid var(--line);padding-top:18px;font-size:9px}
.socials{display:flex;gap:18px;flex-wrap:wrap}
.socials a{color:var(--accent);font-size:9px}
.socials a::before{content:"→ "}
.socials a:hover{color:#ddffe6}
.footer{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;padding:22px 4px;font-size:8px;color:var(--muted)}
@media (max-width:1024px){
  .nav{flex-wrap:wrap;top:12px}
  .nav__links{margin-left:0;order:3;width:100%;border-top:1px solid var(--line);padding-top:8px}
  .listing__head,.listing__row{grid-template-columns:80px 36px 1.6fr 90px 40px}
  .listing__head span:nth-child(4),.listing__row .dim:nth-child(4){display:none}
  .feature,.about__grid{grid-template-columns:1fr}
  .sysinfo{grid-template-columns:1fr 1fr}
  .sysinfo div:nth-child(2){border-right:0}
  .sysinfo div:nth-child(1),.sysinfo div:nth-child(2){border-bottom:1px solid var(--line)}
  .log__row{grid-template-columns:70px 90px 1fr;gap:10px}
  .log__summary{grid-column:3}
}
@media (max-width:640px){
  .shell{padding:8px}
  .titlebar__path{display:none}
  .hero{padding-top:50px}
  .listing__head,.listing__row{grid-template-columns:36px 1.7fr 60px 30px;gap:8px}
  .listing__head span:nth-child(1),.listing__row .dim:nth-child(1){display:none}
  .nav__links{gap:12px;flex-wrap:wrap}
  .footer{font-size:7px}
}
`;
  return renderShell({
    portfolio,
    template: "terminal",
    css,
    body,
    fonts: ["JetBrains Mono:wght@300;400;500;700"],
    background: "#07120c",
    foreground: "#b6ffca",
  });
}
