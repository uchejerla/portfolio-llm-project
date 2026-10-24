import type {
  Portfolio,
  PortfolioExperience,
  PortfolioFact,
  PortfolioLink,
  PortfolioProject,
  PortfolioSection,
} from "./types";
import { isTemplateId, TEMPLATE_BY_ID } from "./templates/meta";

const MAX = {
  name: 60,
  role: 80,
  location: 60,
  email: 120,
  label: 48,
  short: 140,
  medium: 260,
  long: 620,
  url: 400,
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, fallback: string, max = MAX.medium): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned.slice(0, max) : fallback;
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "portfolio"
  );
}

export function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "PS";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : ""))
    .toUpperCase()
    .slice(0, 2);
}

function safeUrl(value: unknown, fallback = ""): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().slice(0, MAX.url);
  if (!trimmed) return fallback;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("#") || trimmed.startsWith("/")) return trimmed;
  if (/^[\w.+-]+@[\w-]+\.[\w.]+$/.test(trimmed)) return `mailto:${trimmed}`;
  if (/^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(trimmed)) return `https://${trimmed}`;
  return fallback;
}

function safeHex(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const hex = value.trim();
  return /^#[0-9a-f]{3}$/i.test(hex) || /^#[0-9a-f]{6}$/i.test(hex) ? hex : fallback;
}

function strings(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => text(item, "", maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function records(value: unknown, maxItems: number): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item && typeof item === "object").slice(0, maxItems) as Record<
    string,
    unknown
  >[];
}

function facts(value: unknown, maxItems: number): PortfolioFact[] {
  return records(value, maxItems)
    .map((item) => ({
      label: text(item.label, "", MAX.label),
      value: text(item.value, "", MAX.short),
    }))
    .filter((item) => item.label && item.value);
}

function links(value: unknown, maxItems = 5): PortfolioLink[] {
  return records(value, maxItems)
    .map((item) => {
      const label = text(item.label, "", MAX.label);
      const url = safeUrl(item.url);
      return { label, url };
    })
    .filter((item) => item.label && item.url);
}

function projects(value: unknown): PortfolioProject[] {
  const list = records(value, 9)
    .map((item) => ({
      title: text(item.title, "", MAX.name),
      category: text(item.category, "Selected work", MAX.label),
      year: text(item.year, "", 12),
      blurb: text(item.blurb, "", MAX.long),
      tags: strings(item.tags, 5, 32),
      link: safeUrl(item.link),
      poster: /^https?:\/\//i.test(text(item.poster, "")) ? text(item.poster, "") : undefined,
      featured: item.featured === true,
    }))
    .filter((item) => item.title);

  if (list.length && !list.some((item) => item.featured)) list[0].featured = true;
  return list;
}

function experience(value: unknown): PortfolioExperience[] {
  return records(value, 6)
    .map((item) => ({
      role: text(item.role, "", MAX.role),
      company: text(item.company, "", MAX.name),
      period: text(item.period, "", 32),
      summary: text(item.summary, "", MAX.medium),
    }))
    .filter((item) => item.role || item.company);
}

function sections(value: unknown): PortfolioSection[] {
  return records(value, 6)
    .map((item) => ({
      label: text(item.label, "", MAX.label),
      items: strings(item.items, 14, 40),
    }))
    .filter((item) => item.label && item.items.length);
}

const BODY_FALLBACK =
  "I design digital work that earns attention, then keeps it. I like clear ideas, sharp craft, and the moment a thing finally feels inevitable.";

export function emptyPortfolio(): Portfolio {
  return {
    template: "cinema",
    accent: "#ff4d3d",
    name: "Your Name",
    role: "Designer & Director",
    location: "Based anywhere",
    email: "hello@yourname.com",
    availability: "Available for select projects",
    initials: "YN",
    links: [
      { label: "Instagram", url: "https://instagram.com" },
      { label: "LinkedIn", url: "https://linkedin.com" },
    ],
    hero: {
      kicker: "Portfolio / 2026",
      title: "Make them remember the name.",
      subtitle:
        "A selection of work about clarity, atmosphere and the small decisions nobody notices until they do.",
      primaryCta: "View selected work",
      secondaryCta: "Start a conversation",
      stats: [
        { value: "08", label: "Years practising" },
        { value: "30+", label: "Projects shipped" },
        { value: "12", label: "Happy partners" },
      ],
      marquee: "Selected work · 2018—2026 · Independent practice",
    },
    projects: [],
    about: {
      heading: "A practice built on attention.",
      pullQuote: "The best work feels obvious only after someone has done the hard part.",
      body: [BODY_FALLBACK],
      facts: [
        { label: "Based in", value: "Somewhere with good light" },
        { label: "Focus", value: "Brand, digital, motion" },
        { label: "Availability", value: "Select projects" },
      ],
    },
    skills: [
      { label: "Craft", items: ["Art direction", "Brand identity", "Motion", "Digital design"] },
      { label: "Tools", items: ["Figma", "After Effects", "Blender", "Framer"] },
    ],
    experience: [],
    contact: {
      heading: "Have something worth making?",
      blurb:
        "I take on a small number of projects each year. If yours is ambitious, strange, or overdue, I would like to hear about it.",
      note: "Replies within two working days.",
    },
  };
}

/** Merge any AI output into a complete, render-safe blueprint. */
export function normalizePortfolio(value: unknown, base?: Portfolio | null): Portfolio {
  const fallback = base ?? emptyPortfolio();
  const raw = record(value);
  const rawHero = record(raw.hero);
  const rawAbout = record(raw.about);
  const rawContact = record(raw.contact);

  const template = isTemplateId(raw.template) ? raw.template : fallback.template;
  const accent = safeHex(
    raw.accent,
    raw.template && isTemplateId(raw.template) && !base
      ? TEMPLATE_BY_ID[raw.template].defaultAccent
      : fallback.accent,
  );
  const name = text(raw.name, fallback.name, MAX.name);

  const normalizedProjects = "projects" in raw ? projects(raw.projects) : fallback.projects;
  const normalizedExperience = "experience" in raw ? experience(raw.experience) : fallback.experience;
  const normalizedSkills = "skills" in raw ? sections(raw.skills) : fallback.skills;

  return {
    template,
    accent,
    name,
    role: text(raw.role, fallback.role, MAX.role),
    location: text(raw.location, fallback.location, MAX.location),
    email: safeUrl(raw.email, fallback.email).replace(/^mailto:/, ""),
    availability: text(raw.availability, fallback.availability, MAX.short),
    initials: text(raw.initials, initialsFrom(name), 3),
    links: "links" in raw ? links(raw.links) : fallback.links,
    hero: {
      kicker: text(rawHero.kicker, fallback.hero.kicker, MAX.label),
      title: text(rawHero.title, fallback.hero.title, MAX.short),
      subtitle: text(rawHero.subtitle, fallback.hero.subtitle, MAX.long),
      primaryCta: text(rawHero.primaryCta, fallback.hero.primaryCta, 40),
      secondaryCta: text(rawHero.secondaryCta, fallback.hero.secondaryCta, 40),
      stats: "stats" in rawHero ? facts(rawHero.stats, 3) : fallback.hero.stats,
      marquee: text(rawHero.marquee, fallback.hero.marquee, MAX.medium),
    },
    projects: normalizedProjects,
    about: {
      heading: text(rawAbout.heading, fallback.about.heading, MAX.label),
      pullQuote: text(rawAbout.pullQuote, fallback.about.pullQuote, MAX.medium),
      body:
        "body" in rawAbout
          ? strings(rawAbout.body, 4, MAX.long).length
            ? strings(rawAbout.body, 4, MAX.long)
            : [text(rawAbout.body, BODY_FALLBACK, MAX.long)]
          : fallback.about.body,
      facts: "facts" in rawAbout ? facts(rawAbout.facts, 4) : fallback.about.facts,
    },
    skills: normalizedSkills,
    experience: normalizedExperience,
    contact: {
      heading: text(rawContact.heading, fallback.contact.heading, MAX.short),
      blurb: text(rawContact.blurb, fallback.contact.blurb, MAX.long),
      note: text(rawContact.note, fallback.contact.note, MAX.medium),
    },
  };
}
