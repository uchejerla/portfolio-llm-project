export interface SampleBrief {
  id: string;
  label: string;
  caption: string;
  prompt: string;
}

export const SAMPLES: SampleBrief[] = [
  {
    id: "motion",
    label: "Motion designer",
    caption: "Cinematic · title sequences",
    prompt: `I'm Ava Mercer, a motion designer and creative director based in Lisbon. I make title sequences, brand films and product launches that feel cinematic. Give me a portfolio like a streaming service — dark, big type, something with a little drama.

Projects:
- Afterglow — Title sequence for the Lisbon Film Festival, built around light leaks and a 1970s score
- Halcyon — Identity and motion system for a boutique hotel group
- Night Shift — A short brand film for a late-night coffee roaster
- Common Ground — Launch film and social toolkit for a community radio station

Skills: art direction, motion design, After Effects, Cinema 4D, sound design
Experience:
- 2022—Now · Design Lead at Studio Nova
- 2019—2022 · Senior Motion Designer at Frame
- 2017—2019 · Freelance

Links: instagram.com/avamercer, vimeo.com/avamercer
Email hello@avamercer.com`,
  },
  {
    id: "photography",
    label: "Photographer",
    caption: "Gallery · quiet and airy",
    prompt: `I'm Noah Reyes, a photographer based in Mexico City. I shoot quiet interiors, architecture and the people who live in them. I want something minimal and gallery-like, with lots of white space and small captions.

Projects:
- Casa Luz — A study of light inside a brutalist home in Cuernavaca
- Still / Life — Portraits of makers in their workshops
- Concrete Gardens — Rooftop gardens across the city
- The Long Table — A series on family restaurants before service

Skills: medium format film, digital, lighting, darkroom printing
Experience:
- 2021—Now · Independent practice
- 2018—2021 · Staff Photographer at Revista Norte
- 2016—2018 · Assistant at Estudio Claro

Links: noahreyes.com, instagram.com/noahreyes
Email studio@noahreyes.com`,
  },
  {
    id: "engineer",
    label: "Backend engineer",
    caption: "Terminal · systems and craft",
    prompt: `I'm Priya Raman, a backend engineer in Bangalore. I work on distributed systems and developer tools. I like dark mode, monospace and things that feel like a terminal.

Projects:
- Atlas — A multi-region job queue handling 40k jobs a minute in Go
- Ledgerline — An append-only billing service with exactly-once semantics
- Papertrail — A small observability tool for cron jobs
- Relay — A typed event bus used by twelve internal teams

Skills: Go, Rust, PostgreSQL, Kafka, Kubernetes, distributed systems
Experience:
- 2023—Now · Staff Engineer at Northwind
- 2020—2023 · Senior Backend Engineer at Ledgerline
- 2017—2020 · Software Engineer at a fintech

Links: github.com/priyaraman, linkedin.com/in/priyaraman
Email priya@raman.dev`,
  },
  {
    id: "brand",
    label: "Brand designer",
    caption: "Brutal · loud identities",
    prompt: `I'm Sol Kim, a brand designer and art director in Seoul. I make loud identities for culture and fashion clients. Give me something brutalist and acidic — I don't want another quiet portfolio.

Projects:
- Acid House — Identity for an underground club night
- New Seoul — Campaign system for a streetwear label
- Paper Cuts — Zine and exhibition identity for a print collective
- Off-Grid — Packaging for a small-batch soju brand

Skills: brand identity, typography, art direction, editorial, Figma, InDesign
Experience:
- 2022—Now · Founder at Studio Sol
- 2019—2022 · Art Director at Post Office
- 2017—2019 · Designer at Workroom

Links: instagram.com/solkim, solkim.kr
Email hi@solkim.kr`,
  },
];

export const STORY_SCAFFOLD = `I'm [your name], a [role] based in [city]. I make [what you make and who for].

Projects:
- [Project name] — [What it was, who it was for, and one detail you're proud of]
- [Project name] — [One sentence]
- [Project name] — [One sentence]

Skills: [craft], [tools]
Experience:
- [Year—Year] · [Role] at [Company]

Links: [website], [instagram]
Email [you@email.com]

A few things I don't want: [anything to avoid]`;

export const ACCENTS = [
  "#ff4d3d",
  "#f0a35e",
  "#d9ff3f",
  "#6ee7b7",
  "#74b8ff",
  "#9d8cff",
];

export function formatModel(provider: string, model: string): string {
  if (provider === "offline") return "Local draft";
  if (provider === "anthropic") {
    return model.includes("opus") ? "Claude Opus" : model.includes("haiku") ? "Claude Haiku" : "Claude Sonnet";
  }
  return model.length > 26 ? `${model.slice(0, 24)}…` : model;
}
