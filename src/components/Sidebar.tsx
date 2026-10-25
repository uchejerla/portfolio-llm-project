import { useMemo, useState } from "react";
import type { Chat, ServerStatus } from "../portfolio/types";
import type { AccountState } from "../lib/account";
import { accountDetail, accountName } from "../lib/account";
import { dayGroup, relativeTime } from "../lib/storage";
import { formatModel } from "../lib/samples";
import { Avatar } from "./Avatar";
import {
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  SparkIcon,
  SunIcon,
  TrashIcon,
  XIcon,
} from "./Icons";

interface SidebarProps {
  chats: Chat[];
  activeId: string | null;
  status: ServerStatus | null;
  theme: "light" | "dark";
  account: AccountState | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onToggleTheme: () => void;
  onOpenSettings: () => void;
  onOpenAccount: () => void;
  onClose: () => void;
}

const GROUPS: Array<"Today" | "Yesterday" | "Earlier"> = ["Today", "Yesterday", "Earlier"];

export function Sidebar({
  chats,
  activeId,
  status,
  theme,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onToggleTheme,
  onOpenSettings,
  onOpenAccount,
  account,
  onClose,
}: SidebarProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    const ordered = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!term) return ordered;
    return ordered.filter(
      (chat) =>
        chat.title.toLowerCase().includes(term) ||
        chat.messages.some((message) => message.content.toLowerCase().includes(term)),
    );
  }, [chats, query]);

  const modelLabel = status ? formatModel(status.provider, status.model) : "Connecting…";
  const providerNote =
    status?.provider === "offline"
      ? "Local draft engine"
      : status?.provider
        ? "Model connected"
        : "Studio server offline";

  return (
    <aside className="sidebar">
      <div className="side-brand">
        <span className="brand-mark">
          <SparkIcon width={17} height={17} />
        </span>
        <div className="brand-name">
          Portfolio Studio
          <span>Your work, in widescreen</span>
        </div>
        <button className="icon-button side-close" type="button" onClick={onClose} aria-label="Close sidebar">
          <XIcon width={17} height={17} />
        </button>
      </div>

      <button className="new-chat" type="button" onClick={onNewChat}>
        <PlusIcon width={16} height={16} />
        <span>New portfolio</span>
        <kbd>⌘K</kbd>
      </button>

      <div className="side-search">
        <SearchIcon width={15} height={15} />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search conversations"
          aria-label="Search conversations"
        />
        {query && (
          <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
            <XIcon width={12} height={12} />
          </button>
        )}
      </div>

      <div className="side-scroll">
        {filtered.length === 0 ? (
          <div className="side-empty">
            <p>{query ? "No conversations match that." : "No portfolios yet."}</p>
            {!query && <span>Start one below and the studio will take it from there.</span>}
          </div>
        ) : (
          GROUPS.map((group) => {
            const items = filtered.filter((chat) => dayGroup(chat.updatedAt) === group);
            if (!items.length) return null;
            return (
              <div className="chat-group" key={group}>
                <div className="chat-group__label">{group}</div>
                {items.map((chat) => (
                  <div
                    key={chat.id}
                    className={`chat-row ${chat.id === activeId ? "is-active" : ""}`}
                  >
                    <button
                      type="button"
                      className="chat-row__main"
                      onClick={() => onSelectChat(chat.id)}
                      title={chat.title}
                    >
                      <span className="chat-row__title">{chat.title}</span>
                      <span className="chat-row__time">{relativeTime(chat.updatedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className="chat-row__delete"
                      onClick={() => onDeleteChat(chat.id)}
                      aria-label={`Delete ${chat.title}`}
                      title="Delete conversation"
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

      <div className="side-foot">
        <button className="model-row" type="button" onClick={onOpenSettings}>
          <span className={`model-dot model-dot--${status?.provider ?? "loading"}`} />
          <span className="model-row__text">
            <b>{modelLabel}</b>
            <small>{providerNote}</small>
          </span>
          <SlidersIcon width={15} height={15} />
        </button>

        <div className="side-tools">
          <button className="icon-button" type="button" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "light" ? <MoonIcon width={16} height={16} /> : <SunIcon width={16} height={16} />}
          </button>
          <button className="side-tools__link" type="button" onClick={onOpenSettings}>
            Studio settings
          </button>
          <span className="side-tools__version">v1.0</span>
        </div>

        <button className="profile profile--button" type="button" onClick={onOpenAccount}>
          <Avatar
            user={account?.user ?? null}
            className="profile__avatar"
            fallback={account?.authEnabled ? "G" : "PS"}
          />
          <span className="profile__text">
            <b>{accountName(account)}</b>
            <small>{accountDetail(account)}</small>
          </span>
        </button>
      </div>
    </aside>
  );
}
