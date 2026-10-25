export type TemplateId =
  | "cinema"
  | "noir"
  | "editorial"
  | "brutal"
  | "gallery"
  | "terminal"
  | "aurora"
  | "swiss"
  | "kinetic"
  | "atelier";

export interface PortfolioLink {
  label: string;
  url: string;
}

export interface PortfolioFact {
  label: string;
  value: string;
}

export interface PortfolioProject {
  title: string;
  category: string;
  year: string;
  blurb: string;
  tags: string[];
  link: string;
  poster?: string;
  featured?: boolean;
}

export interface PortfolioSection {
  label: string;
  items: string[];
}

export interface PortfolioExperience {
  role: string;
  company: string;
  period: string;
  summary: string;
}

export interface Portfolio {
  template: TemplateId;
  accent: string;
  name: string;
  role: string;
  location: string;
  email: string;
  availability: string;
  initials: string;
  links: PortfolioLink[];
  hero: {
    kicker: string;
    title: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    stats: PortfolioFact[];
    marquee: string;
  };
  projects: PortfolioProject[];
  about: {
    heading: string;
    pullQuote: string;
    body: string[];
    facts: PortfolioFact[];
  };
  skills: PortfolioSection[];
  experience: PortfolioExperience[];
  contact: {
    heading: string;
    blurb: string;
    note: string;
  };
}

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  error?: boolean;
  portfolioId?: string;
}

export interface Chat {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  portfolio: Portfolio | null;
}

export interface ServerStatus {
  provider: "anthropic" | "openai" | "offline";
  model: string;
  ready: boolean;
  authEnabled?: boolean;
  billingEnabled?: boolean;
  trialDays?: number;
  priceLabel?: string;
}
