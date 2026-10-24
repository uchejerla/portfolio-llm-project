import type {
  Portfolio,
  PortfolioExperience,
  PortfolioLink,
  PortfolioProject,
  TemplateId,
} from "../src/portfolio/types";
import { normalizePortfolio } from "../src/portfolio/normalize";
import { TEMPLATE_BY_ID, TEMPLATES } from "../src/portfolio/templates/meta";

type BriefSection = "brief" | "projects" | "skills" | "experience" | "links";

interface ParsedProject {
  title: string;
  blurb: string;
  year: string;
  link: string;
}

interface ParsedBrief {
  name: string;
  role: string;
  kind: string;
  location: string;
  email: string;
  links: PortfolioLink[];
  projects: ParsedProject[];
  skills: string[];
  experience: PortfolioExperience[];
  prose: string[];
  projectBullets: number;
}

interface Profile {
  kind: string;
  category: string;
  defaultTemplate: TemplateId;
  heroTitle: string;
  subtitle: string;
  aboutHeading: string;
  quote: string;
  contactHeading: string;
  contactBlurb: string;
  starterProjects: Array<{ title: string; blurb: string }>;
  skills: string[];
  tools: string[];
}

const PROFILES: Record<string, Profile> = {
  motion: {
    kind: "motion",
    category: "Motion design",
    defaultTemplate: "cinema",
    heroTitle: "Stories that move.",
    subtitle:
      "Title sequences, brand films and motion systems built to stay with you after the screen goes dark.",
    aboutHeading: "A practice built in frames.",
    quote: "Motion isn't decoration. It's the moment a story becomes inevitable.",
    contactHeading: "Have a story worth moving?",
    contactBlurb:
      "I take on a small number of film, brand and title-sequence projects each year. Tell me what you're making and where it needs to land.",
    starterProjects: [
      { title: "Afterglow", blurb: "A title sequence built around light, grain and a score that arrives late." },
      { title: "Halcyon", blurb: "A brand in motion: one idea carried across film, social and launch." },
      { title: "Night Shift", blurb: "A short film about the people who keep a city open after midnight." },
    ],
    skills: ["Art direction", "Motion design", "Storyboarding", "Sound design"],
    tools: ["After Effects", "Cinema 4D", "Premiere Pro"],
  },
  photo: {
    kind: "photo",
    category: "Photography",
    defaultTemplate: "gallery",
    heroTitle: "Light, held still.",
    subtitle:
      "Interiors, architecture and the people who live between them — photographed slowly, edited with restraint.",
    aboutHeading: "A practice of looking longer.",
    quote: "The photograph is what the room remembers.",
    contactHeading: "Commission a story.",
    contactBlurb:
      "Available for editorial, architectural and portrait commissions. Send a note about the place, the people and when you need it.",
    starterProjects: [
      { title: "Casa Luz", blurb: "A study of light moving through a brutalist house over one afternoon." },
      { title: "Still / Life", blurb: "Portraits of makers in the workshops where they spend their days." },
      { title: "Concrete Gardens", blurb: "The quiet, improvised gardens growing on rooftops across the city." },
    ],
    skills: ["Composition", "Natural light", "Portraiture", "Darkroom printing"],
    tools: ["Medium format film", "Lightroom", "Capture One"],
  },
  brand: {
    kind: "brand",
    category: "Brand identity",
    defaultTemplate: "brutal",
    heroTitle: "A louder kind of taste.",
    subtitle:
      "Identities, campaigns and printed matter for people who would rather be remembered than approved of.",
    aboutHeading: "Design with a point of view.",
    quote: "If it doesn't risk something, it isn't an identity yet.",
    contactHeading: "Start something loud.",
    contactBlurb:
      "I work with founders, cultural organisations and small teams on identities that need to mean something from the first impression.",
    starterProjects: [
      { title: "Acid House", blurb: "An identity for a club night that refuses to sit still." },
      { title: "New Seoul", blurb: "A campaign system built for posters, pavements and phones." },
      { title: "Paper Cuts", blurb: "A zine and exhibition identity made almost entirely from type." },
    ],
    skills: ["Identity", "Typography", "Art direction", "Editorial"],
    tools: ["Figma", "InDesign", "Illustrator"],
  },
  design: {
    kind: "design",
    category: "Digital design",
    defaultTemplate: "swiss",
    heroTitle: "Clarity, with an edge.",
    subtitle:
      "Product and digital experiences that make the complicated feel obvious — without sanding off the character.",
    aboutHeading: "Structure first, then surprise.",
    quote: "Clarity is not the absence of ideas. It's the proof of them.",
    contactHeading: "Let's make it make sense.",
    contactBlurb:
      "I partner with product teams on interfaces, design systems and the decisions that hold them together. A few projects a year, done properly.",
    starterProjects: [
      { title: "Northstar", blurb: "A design system that gave a sprawling product one voice." },
      { title: "Field Notes", blurb: "A research tool shaped around how people actually take notes." },
      { title: "Soft Systems", blurb: "A visual language for a service that needed to feel human." },
    ],
    skills: ["Product design", "Interaction", "Design systems", "Research"],
    tools: ["Figma", "Framer", "Storybook"],
  },
  dev: {
    kind: "dev",
    category: "Engineering",
    defaultTemplate: "terminal",
    heroTitle: "Systems that hold up.",
    subtitle:
      "Backend services and developer tools built for the boring, important moments: the migration, the outage, the thousandth request.",
    aboutHeading: "The work behind the work.",
    quote: "Good infrastructure is invisible right up until it isn't.",
    contactHeading: "Got a hard problem?",
    contactBlurb:
      "I join small teams on hard backend problems: reliability, data integrity, developer experience. Available for focused engagements.",
    starterProjects: [
      { title: "Atlas", blurb: "A multi-region job queue handling tens of thousands of jobs a minute." },
      { title: "Ledgerline", blurb: "An append-only billing service built around correctness first." },
      { title: "Papertrail", blurb: "A small observability tool for jobs that quietly stop running." },
    ],
    skills: ["Distributed systems", "API design", "Reliability", "Developer experience"],
    tools: ["Go", "PostgreSQL", "Kubernetes", "Kafka"],
  },
  editorial: {
    kind: "editorial",
    category: "Writing",
    defaultTemplate: "editorial",
    heroTitle: "Sentences that stay.",
    subtitle:
      "Essays, interviews and editorial work about culture, places and the people who make both.",
    aboutHeading: "A practice of paying attention.",
    quote: "The story is usually one question deeper than the obvious one.",
    contactHeading: "Have a story worth telling?",
    contactBlurb:
      "I write features, profiles and interviews for magazines and independent studios. Commissions and long-form collaborations welcome.",
    starterProjects: [
      { title: "The Long Read", blurb: "A feature about a street that changed faster than its residents." },
      { title: "Margin Notes", blurb: "An essay series on the books people keep returning to." },
      { title: "City in Sentences", blurb: "A weekly column built from small observations." },
    ],
    skills: ["Features", "Interviews", "Editing", "Research"],
    tools: ["Notion", "Google Docs", "Field notes"],
  },
  generic: {
    kind: "generic",
    category: "Selected work",
    defaultTemplate: "cinema",
    heroTitle: "Make them remember the name.",
    subtitle:
      "A selection of work about clarity, atmosphere and the small decisions nobody notices until they do.",
    aboutHeading: "A practice built on attention.",
    quote: "The best work feels obvious only after someone has done the hard part.",
    contactHeading: "Have something worth making?",
    contactBlurb:
      "I take on a small number of projects each year. If yours is ambitious, strange, or overdue, I would like to hear about it.",
    starterProjects: [
      { title: "Signal", blurb: "A first project, waiting for the real story to be dropped in." },
      { title: "Common Ground", blurb: "A second slot for the work you're proudest of." },
      { title: "After Hours", blurb: "A third slot for the side project that got out of hand." },
    ],
    skills: ["Direction", "Design", "Collaboration", "Craft"],
    tools: ["Figma", "Adobe Creative Cloud"],
  },
};

const ROLE_WORDS: Array<[string, string]> = [
  ["creative director", "motion"],
  ["art director", "brand"],
  ["motion designer", "motion"],
  ["brand designer", "brand"],
  ["product designer", "design"],
  ["graphic designer", "brand"],
  ["interaction designer", "design"],
  ["ux designer", "design"],
  ["ui designer", "design"],
  ["web designer", "design"],
  ["interior designer", "design"],
  ["photographer", "photo"],
  ["filmmaker", "motion"],
  ["video editor", "motion"],
  ["animator", "motion"],
  ["3d artist", "motion"],
  ["illustrator", "brand"],
  ["ceramic artist", "generic"],
  ["sculptor", "generic"],
  ["painter", "generic"],
  ["artist", "generic"],
  ["copywriter", "editorial"],
  ["journalist", "editorial"],
  ["writer", "editorial"],
  ["editor", "editorial"],
  ["architect", "design"],
  ["backend engineer", "dev"],
  ["frontend engineer", "dev"],
  ["full-stack engineer", "dev"],
  ["full stack engineer", "dev"],
  ["software engineer", "dev"],
  ["systems engineer", "dev"],
  ["developer", "dev"],
  ["engineer", "dev"],
  ["designer", "design"],
];

const TOOL_WORDS = [
  "After Effects",
  "Cinema 4D",
  "Premiere Pro",
  "Blender",
  "Figma",
  "Framer",
  "InDesign",
  "Illustrator",
  "Photoshop",
  "Lightroom",
  "Capture One",
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Go",
  "Rust",
  "Python",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Kafka",
  "Kubernetes",
  "Docker",
  "AWS",
  "Terraform",
  "Swift",
  "Kotlin",
  "Flutter",
  "Next.js",
  "Storybook",
  "Notion",
  "Webflow",
];

const TEMPLATE_KEYWORDS: Record<TemplateId, string[]> = {
  cinema: ["cinematic", "cinema", "netflix", "streaming service", "title sequence", "movie", "dark and"],
  noir: ["noir", "monochrome", "black and white", "b&w", "moody", "high contrast", "dramatic"],
  editorial: ["editorial", "magazine", "newspaper", "print", "journal", "writer", "paper"],
  brutal: ["brutalist", "brutal", "acidic", "acid", "punk", "zine", "loud", "industrial", "raw"],
  gallery: ["gallery", "minimal", "white space", "museum", "quiet", "photograph", "airy"],
  terminal: ["terminal", "monospace", "command line", "developer", "engineer", "backend", "code"],
  aurora: ["aurora", "gradient", "glass", "futuristic", "saas", "ai product", "soft"],
  swiss: ["swiss", "grid", "helvetica", "typographic", "structured", "international style"],
  kinetic: ["kinetic", "poster", "playful", "energetic", "streetwear", "colorful", "colourful"],
  atelier: ["atelier", "fashion", "luxury", "couture", "lookbook", "elegant", "understated"],
};

const COLOR_WORDS: Record<string, string> = {
  red: "#ff4438",
  crimson: "#e63946",
  orange: "#ff7a33",
  amber: "#e9a23b",
  gold: "#c9a227",
  yellow: "#e3d13f",
  green: "#3ecf8e",
  emerald: "#2fbf8f",
  teal: "#2dd4bf",
  blue: "#4c8dff",
  navy: "#3557b7",
  purple: "#9d8cff",
  violet: "#8b7cff",
  pink: "#ff6fa5",
  rose: "#e07a8b",
  black: "#d8d0c0",
  white: "#e8e1d5",
};

const LINK_LABELS: Array<[RegExp, string]> = [
  [/instagram\./i, "Instagram"],
  [/dribbble\./i, "Dribbble"],
  [/behance\./i, "Behance"],
  [/github\./i, "GitHub"],
  [/linkedin\./i, "LinkedIn"],
  [/vimeo\./i, "Vimeo"],
  [/youtube\./i, "YouTube"],
  [/tiktok\./i, "TikTok"],
  [/x\.com|twitter\./i, "X"],
];

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

function currentYear(): string {
  return String(new Date().getFullYear());
}

function detectName(text: string): string {
  const capital = text.match(
    /(?:[Mm]y name is|[Ii]'m|[Ii] am|[Nn]amed|[Nn]ame\s*:)\s+([A-Z][a-zA-Z'’.-]+(?:\s+[A-Z][a-zA-Z'’.-]+){0,2})/,
  );
  if (capital?.[1]) {
    return capital[1]
      .replace(/\s+(?:Based|Working|A|An|And|The)$/i, "")
      .trim()
      .slice(0, 60);
  }
  const loose = text.match(/(?:[Mm]y name is|[Ii]'m|[Ii] am)\s+([a-z]+(?:\s+[a-z]+)?)/);
  if (loose?.[1]) {
    const words = loose[1].split(/\s+/);
    if (/^(a|an|the|from|based|working|currently|really|just)$/i.test(words[0])) return "";
    return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ").slice(0, 60);
  }
  return "";
}

function detectRole(text: string): { role: string; kind: string } {
  const haystack = text.toLowerCase();
  let best: { index: number; role: string; kind: string; length: number } | null = null;
  for (const [word, kind] of ROLE_WORDS) {
    const match = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\\\]/g, "\\\\$&")}\\b`, "i").exec(
      haystack,
    );
    if (!match) continue;
    const index = match.index;
    if (!best || index < best.index || (index === best.index && word.length > best.length)) {
      best = { index, role: titleCase(word), kind, length: word.length };
    }
  }
  if (best) return { role: best.role, kind: best.kind };
  const loose = text.match(/\bas an? ([a-z][a-z\s-]{2,32}?)(?=\s+(?:based|working|named)\b|[,.]|$)/i);
  if (loose?.[1]) {
    const role = titleCase(loose[1].trim());
    return { role, kind: profileFor(role.toLowerCase()).kind };
  }
  return { role: "Independent Creative", kind: "generic" };
}

function profileFor(kind: string): Profile {
  return PROFILES[kind] ?? PROFILES.generic;
}

function detectLocation(text: string): string {
  const match =
    text.match(/\b(?:based|living|working|located)\s+in\s+([^.,;\n]{2,48})/i) ??
    text.match(
      /\b(?:I am|I'm)\s+(?:an?\s+)?[a-z][a-z\s-]{2,40}?\s+in\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/,
    );
  if (!match?.[1]) return "";
  return titleCase(match[1].replace(/\s+(?:and|working|where)\b.*$/i, "").trim()).slice(0, 48);
}

function detectEmail(text: string): string {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
}

function cleanUrl(raw: string): string {
  const trimmed = raw.replace(/[),.;'"]+$/g, "").replace(/^[('"]+/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function detectLinks(text: string, allowBare = false): PortfolioLink[] {
  const pattern =
    /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s,;)]*)?/gi;
  const seen = new Set<string>();
  const links: PortfolioLink[] = [];
  for (const match of text.matchAll(pattern)) {
    const before = text[match.index - 1] ?? "";
    if (match[0].includes("@") || before === "@" || before === ".") continue;
    const url = cleanUrl(match[0]);
    if (!url || seen.has(url)) continue;
    const label = LINK_LABELS.find(([labelPattern]) => labelPattern.test(url))?.[1];
    if (!label && !/^https?:\/\//i.test(match[0]) && !allowBare) continue;
    seen.add(url);
    links.push({
      label: label ?? "Website",
      url,
    });
    if (links.length >= 4) break;
  }
  return links;
}

function mergeLinks(...groups: PortfolioLink[][]): PortfolioLink[] {
  const seen = new Set<string>();
  const merged: PortfolioLink[] = [];
  for (const group of groups) {
    for (const link of group) {
      if (seen.has(link.url)) continue;
      seen.add(link.url);
      merged.push(link);
      if (merged.length >= 4) return merged;
    }
  }
  return merged;
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").trim();
}

function parseBrief(text: string): ParsedBrief {
  const parsed: ParsedBrief = {
    name: "",
    role: "",
    kind: "generic",
    location: "",
    email: "",
    links: [],
    projects: [],
    skills: [],
    experience: [],
    prose: [],
    projectBullets: 0,
  };

  parsed.name = detectName(text);
  const role = detectRole(text);
  parsed.role = role.role;
  parsed.kind = role.kind;
  parsed.location = detectLocation(text);
  parsed.email = detectEmail(text);
  let linkLineText = "";

  const sections: Record<BriefSection, string[]> = {
    brief: [],
    projects: [],
    skills: [],
    experience: [],
    links: [],
  };

  let section: BriefSection = "brief";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const heading = line.match(/^(projects?|work|skills?|experience|links?|profile|about)\s*:?\s*$/i);
    if (heading) {
      const key = heading[1].toLowerCase();
      section =
        key === "projects" || key === "work"
          ? "projects"
          : key === "skills"
            ? "skills"
            : key === "experience"
              ? "experience"
              : key === "links"
                ? "links"
                : "brief";
      continue;
    }

    const inlineSkills = line.match(/^skills?\s*:\s*(.+)$/i);
    if (inlineSkills) {
      parsed.skills.push(...splitList(inlineSkills[1]));
      continue;
    }
    const inlineEmail = line.match(/^e-?mail\s*:\s*(.+)$/i);
    if (inlineEmail) {
      parsed.email = inlineEmail[1].match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? parsed.email;
      continue;
    }
    const inlineLinks = line.match(/^links?\s*:\s*(.+)$/i);
    if (inlineLinks) {
      linkLineText += ` ${inlineLinks[1]}`;
      continue;
    }
    const inlineProjects = line.match(/\b(?:projects?|work)\s*:\s*(.+)$/i);
    if (inlineProjects) {
      const list = splitProjectList(inlineProjects[1].split(/\s*[.!?]\s+(?=[A-Z])/)[0]);
      if (list.length) {
        sections.projects.push(...list);
        continue;
      }
    }
    if (/^(?:[-*•]|\d+[.)])\s+/.test(line)) {
      sections[section].push(stripBullet(line));
      continue;
    }
    if (section === "brief") parsed.prose.push(line);
  }

  parsed.projectBullets = sections.projects.length;
  parsed.projects = sections.projects.map(parseProject).filter((project) => project.title).slice(0, 6);

  const extraSkills = [...parsed.skills, ...sections.skills.flatMap(splitList)];
  const allSkillText = `${text}\n${extraSkills.join(", ")}`;
  const detectedTools = TOOL_WORDS.filter((tool) =>
    new RegExp(`(^|[^a-z0-9])${tool.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i").test(
      allSkillText,
    ),
  );
  parsed.skills = dedupe([...extraSkills, ...detectedTools]).slice(0, 10);

  parsed.experience = sections.experience
    .map(parseExperience)
    .filter((job) => job.role)
    .slice(0, 4);

  parsed.links = mergeLinks(
    detectLinks(text),
    detectLinks(linkLineText, true),
    detectLinks(sections.links.join(", "), true),
  );

  return parsed;
}

function splitList(value: string): string[] {
  return value
    .split(/[,·/|]+/)
    .map((item) => item.replace(/\.$/, "").trim())
    .filter((item) => item.length > 1 && item.length < 40);
}

/** Project titles can contain slashes or dashes, so only split on commas and semicolons. */
function splitProjectList(value: string): string[] {
  return value
    .replace(/\s+(?:and|&)\s+/gi, ", ")
    .split(/[,;]+/)
    .map((item) => item.replace(/^\s*(?:[-*•]|\d+[.)])\s+/, "").replace(/\.$/, "").trim())
    .filter((item) => item.length > 1 && item.length < 80)
    .slice(0, 6);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = value.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function parseProject(line: string): ParsedProject {
  let content = line;
  const yearMatch = content.match(/\b(20\d{2})\b/);
  const year = yearMatch?.[1] ?? currentYear();
  if (yearMatch) content = content.replace(yearMatch[0], "").trim();

  const linkMatch = content.match(/https?:\/\/[^\s,;)]+/i);
  const link = linkMatch ? cleanUrl(linkMatch[0]) : "";
  if (linkMatch) content = content.replace(linkMatch[0], "").trim();

  const split = content.split(/\s+[—–]\s+|\s+-\s+|\s*:\s*/);
  let title = (split[0] ?? content).replace(/^["“']|["”']$/g, "").trim();
  let blurb = split.slice(1).join(" — ").trim();

  if (!blurb) {
    const words = content.split(/\s+/);
    if (words.length > 7) {
      title = words.slice(0, 5).join(" ");
      blurb = content;
    } else {
      blurb = `A recent ${currentYear()} project.`;
    }
  }

  if (title.length > 70) {
    blurb = `${title} ${blurb}`;
    title = title.slice(0, 60).trim();
  }

  return {
    title: title.replace(/\s{2,}/g, " ").slice(0, 70),
    blurb: blurb.replace(/\s{2,}/g, " ").slice(0, 320),
    year,
    link,
  };
}

function parseExperience(line: string): PortfolioExperience {
  let content = line;
  let period = "";
  const periodPattern =
    /((?:19|20)\d{2}\s*[—–-]\s*(?:(?:19|20)\d{2}|now|present|current))/i;
  const periodMatch = content.match(periodPattern);
  if (periodMatch) {
    period = periodMatch[0].replace(/\s+/g, "");
    content = content.replace(periodMatch[0], "").trim();
  }
  content = content.replace(/^[·|,\s]+|[·|,\s]+$/g, "");

  let role = content;
  let company = "";
  const at = content.split(/\s+(?:at|@)\s+/i);
  if (at.length > 1) {
    role = at[0].trim();
    company = at.slice(1).join(" at ").trim();
  }

  if (!period) {
    const tail = role.match(/\((?:(?:19|20)\d{2}[^)]*)\)$/);
    if (tail) {
      period = tail[0].replace(/[()]/g, "");
      role = role.replace(tail[0], "").trim();
    }
  }

  return {
    role: role.slice(0, 80),
    company: company.slice(0, 60),
    period: period || "—",
    summary: "",
  };
}

function templateScore(haystack: string, template: TemplateId): { score: number; first: number } {
  let score = 0;
  let first = Number.POSITIVE_INFINITY;
  for (const keyword of TEMPLATE_KEYWORDS[template]) {
    const index = haystack.indexOf(keyword);
    if (index < 0) continue;
    score += keyword.includes(" ") ? 2 : 1;
    first = Math.min(first, index);
  }
  const name = template.toLowerCase();
  const nameIndex = haystack.indexOf(name);
  if (nameIndex >= 0) {
    score += 2;
    first = Math.min(first, nameIndex);
  }
  return { score, first };
}

function detectTemplate(text: string, fallback: TemplateId): TemplateId {
  // Style intent usually lives in the opening paragraph; project names often
  // contain misleading words like "Paper" or "Editorial".
  const primary = text.split(/\n\s*(?:projects?|experience|skills?|links?)\s*:?\s*\n/i)[0]?.trim();
  const scope = primary && primary.length >= 20 ? primary.toLowerCase() : text.toLowerCase();
  let best: { id: TemplateId; score: number; first: number } | null = null;
  for (const template of TEMPLATES) {
    const { score, first } = templateScore(scope, template.id);
    if (score <= 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && first < best.first)
    ) {
      best = { id: template.id, score, first };
    }
  }
  if (best) return best.id;

  if (scope !== text.toLowerCase()) {
    let fallbackBest: { id: TemplateId; score: number; first: number } | null = null;
    for (const template of TEMPLATES) {
      const { score, first } = templateScore(text.toLowerCase(), template.id);
      if (score <= 0) continue;
      if (
        !fallbackBest ||
        score > fallbackBest.score ||
        (score === fallbackBest.score && first < fallbackBest.first)
      ) {
        fallbackBest = { id: template.id, score, first };
      }
    }
    if (fallbackBest) return fallbackBest.id;
  }
  return fallback;
}

function detectAccent(text: string, fallback: string): string {
  const match = text.match(
    /\b(?:accent|colou?r|palette|theme)\s*(?:of|is|to|should be|:)?\s*(red|crimson|orange|amber|gold|yellow|green|emerald|teal|blue|navy|purple|violet|pink|rose|black|white)\b/i,
  );
  if (match?.[1]) return COLOR_WORDS[match[1].toLowerCase()] ?? fallback;
  const make = text.match(/\b(?:make it|go|use)\s+(?:a\s+|an\s+)?(red|crimson|orange|amber|gold|yellow|green|emerald|teal|blue|navy|purple|violet|pink|rose)\b/i);
  if (make?.[1]) return COLOR_WORDS[make[1].toLowerCase()] ?? fallback;
  return fallback;
}

function buildProjects(parsed: ParsedBrief, profile: Profile): PortfolioProject[] {
  const source = parsed.projects.length
    ? parsed.projects
    : profile.starterProjects.map((project) => ({
        title: project.title,
        blurb: project.blurb,
        year: currentYear(),
        link: "",
      }));

  return source.slice(0, 6).map((project, index) => ({
    title: project.title,
    category: profile.category,
    year: project.year,
    blurb: project.blurb,
    tags: profile.skills.slice(0, index === 0 ? 3 : 2),
    link: project.link,
    featured: index === 0,
  }));
}

function buildHero(parsed: ParsedBrief, profile: Profile, projects: PortfolioProject[]) {
  return {
    kicker: `${parsed.role} · Portfolio ${currentYear()}`,
    title: profile.heroTitle,
    subtitle: profile.subtitle,
    primaryCta: "View selected work",
    secondaryCta: "Start a conversation",
    stats: [
      { value: String(projects.length).padStart(2, "0"), label: "Projects in the reel" },
      { value: parsed.location || "Remote", label: "Based in" },
      { value: "Open", label: "For select work" },
    ],
    marquee: `${parsed.role} · ${parsed.location || "Independent practice"} · Selected work ${currentYear()}`,
  } satisfies Portfolio["hero"];
}

function buildPortfolio(
  parsed: ParsedBrief,
  template: TemplateId,
  accent: string,
): Portfolio {
  const profile = profileFor(parsed.kind);
  const projects = buildProjects(parsed, profile);
  const name = parsed.name || "Your Name";
  const rawSkills = parsed.skills.length
    ? parsed.skills
    : [...profile.skills.slice(0, 4), ...profile.tools.slice(0, 3)];
  const skills = dedupe(
    rawSkills.map((item) => {
      const canonicalTool = TOOL_WORDS.find((tool) => tool.toLowerCase() === item.toLowerCase());
      if (canonicalTool) return canonicalTool;
      return item.charAt(0).toUpperCase() + item.slice(1);
    }),
  );
  const craft = skills.filter((item) => !profile.tools.includes(item));
  const tools = skills.filter((item) => profile.tools.includes(item));
  const skillGroups = [
    { label: "Craft", items: craft.slice(0, 6) },
    { label: "Tools", items: tools.slice(0, 6) },
  ].filter((group) => group.items.length);
  if (!skillGroups.length) skillGroups.push({ label: "Toolkit", items: skills.slice(0, 6) });

  const intro =
    name === "Your Name"
      ? `A ${parsed.role.toLowerCase()}${parsed.location ? ` based in ${parsed.location}` : ""}, working with people who care about how things feel as much as how they work.`
      : `${name} is a ${parsed.role.toLowerCase()}${parsed.location ? ` based in ${parsed.location}` : ""}, working with people who care about how things feel as much as how they work.`;

  const raw = {
    template,
    accent,
    name,
    role: parsed.role,
    location: parsed.location || "Based anywhere",
    email: parsed.email || "hello@yourname.com",
    availability: "Available for select projects",
    initials: "",
    links: parsed.links,
    hero: buildHero(parsed, profile, projects),
    projects,
    about: {
      heading: profile.aboutHeading,
      pullQuote: profile.quote,
      body: [
        intro,
        `The practice moves between ${craft.slice(0, 3).join(", ") || profile.skills.slice(0, 3).join(", ")}. The aim is simple: make the idea land, then make it stay.`,
      ],
      facts: [
        { label: "Based in", value: parsed.location || "Anywhere" },
        { label: "Focus", value: parsed.role },
        { label: "Availability", value: "Select projects" },
      ],
    },
    skills: skillGroups,
    experience: parsed.experience,
    contact: {
      heading: profile.contactHeading,
      blurb: profile.contactBlurb,
      note: "Replies within two working days.",
    },
  };

  return normalizePortfolio(raw);
}

export interface OfflineReply {
  message: string;
  portfolio: Portfolio;
}

export function buildOfflineReply(input: string, existing: Portfolio | null): OfflineReply {
  const text = input.slice(0, 40_000);
  const parsed = parseBrief(text);
  const richBrief = parsed.projects.length > 0 || parsed.projectBullets >= 2;
  const startingOver = /\b(start over|new portfolio|from scratch|rebuild)\b/i.test(text);

  if (existing && !richBrief && !startingOver) {
    const template = detectTemplate(text, existing.template);
    const accent = detectAccent(text, existing.accent);
    const name = parsed.name || existing.name;
    const location = parsed.location || existing.location;
    const email = parsed.email || existing.email;
    const links = parsed.links.length ? parsed.links : existing.links;
    const changedLook = template !== existing.template || accent !== existing.accent;
    const changedFacts =
      name !== existing.name || location !== existing.location || email !== existing.email;

    if (!changedLook && !changedFacts) {
      return {
        message:
          "I'm running on the local draft engine, so I can't rewrite the copy yet. I can still change the look — name a template or a colour — and you can connect Claude in settings for full revisions.",
        portfolio: existing,
      };
    }

    const updated = normalizePortfolio(
      {
        ...existing,
        template,
        accent,
        name,
        location,
        email,
        links,
      },
      existing,
    );

    const changed = [
      template !== existing.template ? `the ${TEMPLATE_BY_ID[template].name} template` : "",
      accent !== existing.accent ? `${accent} as the accent` : "",
    ].filter(Boolean);

    return {
      message: changed.length
        ? `Changed ${changed.join(" and ")} in the studio. Local draft mode can't rewrite the writing — connect Claude for that — but the look is yours to push further.`
        : "Updated your details in the studio. Local draft mode handles structure and styling; connect Claude when you want the copy rewritten.",
      portfolio: updated,
    };
  }

  const profile = profileFor(parsed.kind);
  const template = detectTemplate(text, profile.defaultTemplate);
  const accent = detectAccent(text, TEMPLATE_BY_ID[template].defaultAccent);
  const portfolio = buildPortfolio(parsed, template, accent);
  const templateName = TEMPLATE_BY_ID[template].name;
  const hasRealProjects = parsed.projects.length > 0;

  let message: string;
  if (parsed.name && hasRealProjects) {
    message = `I've built the first cut for ${parsed.name} in the ${templateName} look — ${portfolio.projects.length} projects, a hero with real presence and the story trimmed to what matters. It's live in the studio; tell me what to push further.`;
  } else if (parsed.name) {
    message = `I've set up a ${templateName} starting point for ${parsed.name}, with three project slots so you can see the shape. Send your real work, links and a line about yourself and I'll swap them in.`;
  } else if (hasRealProjects) {
    message = `I've set the stage in the ${templateName} template and filled in your projects. Tell me your name, where you're based and any links, and I'll finish the billing.`;
  } else {
    message = `I've started a ${templateName} draft with three placeholder projects so you can see the shape. Share your name, a few real projects and your links, and I'll make it yours.`;
  }

  if (TEMPLATE_KEYWORDS[template].some((keyword) => text.toLowerCase().includes(keyword))) {
    message += " The look follows the mood you described; the lookbook has nine more if you want to compare.";
  }

  return { message, portfolio };
}
