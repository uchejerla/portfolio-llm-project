import type { TemplateId } from "../types";

export interface TemplateMeta {
  id: TemplateId;
  name: string;
  description: string;
  tags: string[];
  /** Miniature preview palette used by the gallery thumbnails. */
  preview: {
    background: string;
    foreground: string;
    accent: string;
    font: "serif" | "sans" | "mono" | "display";
    layout: "billboard" | "stack" | "grid" | "split" | "index";
  };
  defaultAccent: string;
}

export const TEMPLATES: TemplateMeta[] = [
  {
    id: "cinema",
    name: "Cinema",
    description: "A dark billboard, a marquee and project rows that scroll like a streaming service.",
    tags: ["Cinematic", "Bold", "Default"],
    preview: {
      background: "#08080a",
      foreground: "#f4f0e8",
      accent: "#ff4d3d",
      font: "serif",
      layout: "billboard",
    },
    defaultAccent: "#ff4d3d",
  },
  {
    id: "noir",
    name: "Noir",
    description: "High-contrast monochrome, huge condensed titles and a slow, filmic rhythm.",
    tags: ["Monochrome", "Dramatic"],
    preview: {
      background: "#0b0b0b",
      foreground: "#e9e6df",
      accent: "#d8d0c0",
      font: "serif",
      layout: "split",
    },
    defaultAccent: "#e3ddcd",
  },
  {
    id: "editorial",
    name: "Editorial",
    description: "Warm paper, a magazine masthead, drop caps and a numbered project index.",
    tags: ["Serif", "Warm", "Print"],
    preview: {
      background: "#f3ede1",
      foreground: "#1e1b17",
      accent: "#a9412a",
      font: "serif",
      layout: "index",
    },
    defaultAccent: "#a9412a",
  },
  {
    id: "brutal",
    name: "Brutal",
    description: "Acid colour, monospace labels, hard rules and an unapologetic grid.",
    tags: ["Loud", "Brutalist"],
    preview: {
      background: "#111111",
      foreground: "#eaff8a",
      accent: "#d9ff3f",
      font: "mono",
      layout: "grid",
    },
    defaultAccent: "#d9ff3f",
  },
  {
    id: "gallery",
    name: "Gallery",
    description: "Quiet walls, generous white space and work presented like hung pieces.",
    tags: ["Minimal", "Airy"],
    preview: {
      background: "#f6f5f1",
      foreground: "#22211e",
      accent: "#4a5a4f",
      font: "serif",
      layout: "stack",
    },
    defaultAccent: "#4a5a4f",
  },
  {
    id: "terminal",
    name: "Terminal",
    description: "A phosphor-green command line for engineers, rendered as a living shell.",
    tags: ["Developer", "Mono"],
    preview: {
      background: "#07120c",
      foreground: "#b6ffca",
      accent: "#5dff8d",
      font: "mono",
      layout: "stack",
    },
    defaultAccent: "#5dff8d",
  },
  {
    id: "aurora",
    name: "Aurora",
    description: "Deep space gradients, frosted glass cards and a soft, modern glow.",
    tags: ["Gradient", "Modern"],
    preview: {
      background: "#0d1024",
      foreground: "#eef0ff",
      accent: "#9d8cff",
      font: "sans",
      layout: "split",
    },
    defaultAccent: "#9d8cff",
  },
  {
    id: "swiss",
    name: "Swiss",
    description: "Strict columns, Helvetica discipline, red accents and typographic confidence.",
    tags: ["Grid", "Type-led"],
    preview: {
      background: "#f4f2ec",
      foreground: "#161616",
      accent: "#e03122",
      font: "sans",
      layout: "grid",
    },
    defaultAccent: "#e03122",
  },
  {
    id: "kinetic",
    name: "Kinetic",
    description: "Oversized type, looping marquees and a warm poster-art energy.",
    tags: ["Playful", "Poster"],
    preview: {
      background: "#f4a259",
      foreground: "#17130f",
      accent: "#ff4d1c",
      font: "display",
      layout: "billboard",
    },
    defaultAccent: "#ff4d1c",
  },
  {
    id: "atelier",
    name: "Atelier",
    description: "Ivory, hairlines and italic serif — a fashion-house portfolio with restraint.",
    tags: ["Luxe", "Editorial"],
    preview: {
      background: "#f2ece3",
      foreground: "#2c2620",
      accent: "#8a6a4f",
      font: "serif",
      layout: "index",
    },
    defaultAccent: "#8a6a4f",
  },
];

export const TEMPLATE_BY_ID = Object.fromEntries(
  TEMPLATES.map((template) => [template.id, template]),
) as Record<TemplateId, TemplateMeta>;

export function isTemplateId(value: unknown): value is TemplateId {
  return typeof value === "string" && value in TEMPLATE_BY_ID;
}
