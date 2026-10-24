import type { Chat } from "../portfolio/types";
import { normalizePortfolio } from "../portfolio/normalize";

const CHATS_KEY = "portfolio-studio:chats:v1";
const THEME_KEY = "portfolio-studio:theme";
const STUDIO_KEY = "portfolio-studio:studio-open";

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((chat) => chat && typeof chat.id === "string" && Array.isArray(chat.messages))
      .map((chat): Chat => ({
        id: String(chat.id),
        title: typeof chat.title === "string" ? chat.title : "Untitled portfolio",
        createdAt: Number(chat.createdAt) || Date.now(),
        updatedAt: Number(chat.updatedAt) || Date.now(),
        messages: chat.messages
          .filter(
            (message: unknown) =>
              message &&
              typeof message === "object" &&
              typeof (message as { content?: unknown }).content === "string",
          )
          .map((message: { id?: string; role?: string; content: string; createdAt?: number; error?: boolean }) => ({
            id: typeof message.id === "string" ? message.id : crypto.randomUUID(),
            role: message.role === "user" ? "user" : "assistant",
            content: message.content,
            createdAt: Number(message.createdAt) || Date.now(),
            error: Boolean(message.error),
          })),
        portfolio: chat.portfolio ? normalizePortfolio(chat.portfolio) : null,
      }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveChats(chats: Chat[]) {
  try {
    localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
  } catch {
    // Storage can be full or unavailable; the session still works in memory.
  }
}

export function loadTheme(): "light" | "dark" {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(theme: "light" | "dark") {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadStudioOpen(): boolean {
  if (window.innerWidth < 1100) return false;
  const saved = localStorage.getItem(STUDIO_KEY);
  if (saved === "open") return true;
  if (saved === "closed") return false;
  return window.innerWidth >= 1180;
}

export function saveStudioOpen(open: boolean) {
  localStorage.setItem(STUDIO_KEY, open ? "open" : "closed");
}

export function titleFromPrompt(text: string): string {
  const clean = text
    .replace(/\s+/g, " ")
    .replace(/^(hi|hey|hello)[,!.\s]+/i, "")
    .replace(/^(please\s+)?(can you|could you|i want you to|i'd like you to)\s+/i, "")
    .trim();
  if (!clean) return "New portfolio";
  const words = clean.split(" ").slice(0, 6).join(" ");
  return words.length > 48 ? `${words.slice(0, 47).trim()}…` : `${words.replace(/[.,;:]$/, "")}${
    clean.split(" ").length > 6 ? "…" : ""
  }`;
}

export function relativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function dayGroup(timestamp: number): "Today" | "Yesterday" | "Earlier" {
  const date = new Date(timestamp);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  if (date.getTime() >= startOfToday) return "Today";
  if (date.getTime() >= startOfToday - 86400000) return "Yesterday";
  return "Earlier";
}
