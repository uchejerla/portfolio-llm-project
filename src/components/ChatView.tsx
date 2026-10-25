import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Chat, Portfolio, ServerStatus } from "../portfolio/types";
import { TEMPLATE_BY_ID } from "../portfolio/templates/meta";
import { SAMPLES, STORY_SCAFFOLD, formatModel } from "../lib/samples";
import type { AccountIntent, AccountState } from "../lib/account";
import { accountPlanLabel } from "../lib/account";
import type { Attachment, SendMeta } from "../lib/types";
import { Avatar } from "./Avatar";
import {
  ArrowUpIcon,
  ChevronDownIcon,
  MenuIcon,
  PanelIcon,
  PaperclipIcon,
  SparkIcon,
  StopIcon,
  XIcon,
} from "./Icons";

interface ChatViewProps {
  chat: Chat | null;
  streaming: boolean;
  streamText: string;
  status: ServerStatus | null;
  studioOpen: boolean;
  hasPortfolio: boolean;
  account: AccountState | null;
  accessNotice: "signin" | "upgrade" | null;
  onOpenAccount: (intent?: AccountIntent) => void;
  onSend: (text: string, attachments: Attachment[], meta?: SendMeta) => void;
  onStop: () => void;
  onToggleStudio: () => void;
  onOpenGallery: () => void;
  onOpenStudio: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning.";
  if (hour < 18) return "Good afternoon.";
  return "Good evening.";
}

function assistantMark() {
  return (
    <span className="msg__avatar">
      <SparkIcon width={15} height={15} />
    </span>
  );
}

function UpdateCard({ portfolio, onOpen }: { portfolio: Portfolio; onOpen: () => void }) {
  const meta = TEMPLATE_BY_ID[portfolio.template];
  return (
    <button className="update-card" type="button" onClick={onOpen}>
      <span
        className="update-card__thumb"
        style={{
          background: `linear-gradient(135deg, ${meta.preview.background} 0%, ${meta.preview.background} 55%, ${portfolio.accent} 160%)`,
        }}
      >
        <i style={{ background: portfolio.accent }} />
      </span>
      <span className="update-card__text">
        <b>Portfolio updated</b>
        <small>
          {meta.name} template · {portfolio.projects.length} project
          {portfolio.projects.length === 1 ? "" : "s"}
        </small>
      </span>
      <span className="update-card__action">
        Open studio
        <ArrowUpIcon width={13} height={13} style={{ transform: "rotate(45deg)" }} />
      </span>
    </button>
  );
}

function ThreadMessage({
  role,
  content,
  error,
}: {
  role: "user" | "assistant";
  content: string;
  error?: boolean;
}) {
  if (role === "user") {
    return (
      <div className="msg msg--user">
        <div className="user-bubble">{content}</div>
      </div>
    );
  }
  return (
    <div className={`msg msg--assistant ${error ? "msg--error" : ""}`}>
      {assistantMark()}
      <div className={`prose ${error ? "prose--error" : ""}`}>
        {error ? (
          <p>{content}</p>
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noreferrer noopener">
                  {children}
                </a>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export function ChatView({
  chat,
  streaming,
  streamText,
  status,
  studioOpen,
  hasPortfolio,
  account,
  accessNotice,
  onOpenAccount,
  onSend,
  onStop,
  onToggleStudio,
  onOpenGallery,
  onOpenStudio,
  onToggleSidebar,
  onOpenSettings,
}: ChatViewProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const messages = chat?.messages ?? [];
  const isEmpty = messages.length === 0;
  const lastMessage = messages[messages.length - 1];
  const showUpdateCard =
    Boolean(chat?.portfolio) &&
    !streaming &&
    lastMessage?.role === "assistant" &&
    !lastMessage?.error;
  const modelLabel = status ? formatModel(status.provider, status.model) : "Connecting";
  const offline = status?.provider === "offline";

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat?.id, messages.length, streamText, streaming]);

  useEffect(() => {
    setInput("");
    setAttachments([]);
    setFileError(null);
  }, [chat?.id]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const addFiles = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setFileError(null);
    const next: Attachment[] = [];
    for (const file of Array.from(fileList).slice(0, 3)) {
      if (file.size > 300_000) {
        setFileError(`${file.name} is too large. Keep briefs under 300 KB.`);
        continue;
      }
      try {
        const raw = await file.text();
        next.push({
          id: `${file.name}-${file.lastModified}`,
          name: file.name,
          text: raw.slice(0, 30_000),
        });
      } catch {
        setFileError(`Could not read ${file.name}.`);
      }
    }
    if (next.length) setAttachments((current) => [...current, ...next].slice(0, 3));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = () => {
    if (streaming) return;
    if (!input.trim() && !attachments.length) return;
    onSend(input, attachments);
    setInput("");
    setAttachments([]);
    setFileError(null);
    textareaRef.current?.focus();
  };

  const startScaffold = () => {
    setInput(STORY_SCAFFOLD);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(0, STORY_SCAFFOLD.length);
    });
  };

  return (
    <section className="chat-pane">
      <header className="topbar">
        <div className="topbar__left">
          <button
            className="icon-button menu-button"
            type="button"
            onClick={onToggleSidebar}
            aria-label="Open conversations"
          >
            <MenuIcon width={18} height={18} />
          </button>
          <div className="topbar__title">
            <span>Portfolio Studio</span>
            <b>{chat?.title ?? "New portfolio"}</b>
          </div>
        </div>
        <div className="topbar__right">
          {account?.authEnabled && (
            <button
              className="account-pill"
              type="button"
              onClick={() => onOpenAccount()}
              title={account.user ? account.user.email : "Sign in with Google"}
            >
              <Avatar user={account.user} className="account-pill__avatar" />
              <span>{accountPlanLabel(account)}</span>
            </button>
          )}
          <button className="model-pill" type="button" onClick={onOpenSettings}>
            <span className={`model-dot model-dot--${status?.provider ?? "loading"}`} />
            {modelLabel}
            <ChevronDownIcon width={13} height={13} />
          </button>
          <button
            className={`studio-toggle ${studioOpen ? "is-active" : ""}`}
            type="button"
            onClick={onToggleStudio}
            aria-pressed={studioOpen}
          >
            <PanelIcon width={16} height={16} />
            <span>{studioOpen ? "Studio open" : hasPortfolio ? "Open studio" : "Studio"}</span>
          </button>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {isEmpty ? (
            <div className="greeting">
              <span className="greeting__mark">
                <SparkIcon width={22} height={22} />
              </span>
              <h1>{greeting()}</h1>
              <p className="greeting__sub">
                I'm your studio director. Tell me who you are and what you make — I'll cut it into a
                portfolio worth watching.
              </p>

              <div className="samples">
                {SAMPLES.map((sample, index) => (
                  <button
                    className="sample-card"
                    key={sample.id}
                    type="button"
                    onClick={() =>
                      onSend(sample.prompt, [], {
                        display: `Build a portfolio from the ${sample.label.toLowerCase()} sample brief.`,
                        title: sample.label,
                      })
                    }
                  >
                    <span className="sample-card__num">0{index + 1}</span>
                    <span className="sample-card__label">{sample.label}</span>
                    <span className="sample-card__caption">{sample.caption}</span>
                    <span className="sample-card__arrow">↗</span>
                  </button>
                ))}
              </div>

              <div className="greeting__links">
                <button type="button" onClick={startScaffold}>
                  Start from your own story <span>→</span>
                </button>
                <span className="dot-sep" />
                <button type="button" onClick={onOpenGallery}>
                  Browse 10 templates
                </button>
              </div>

              {offline && (
                <button className="local-note" type="button" onClick={onOpenSettings}>
                  <span className="model-dot model-dot--offline" />
                  <span>
                    <b>Local draft mode.</b> The studio is assembling portfolios itself. Connect Claude
                    for real writing and revisions.
                  </span>
                  <span className="local-note__cta">Connect →</span>
                </button>
              )}
            </div>
          ) : (
            <div className="thread">
              {messages.map((message) => (
                <ThreadMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  error={message.error}
                />
              ))}

              {streaming && (
                <div className="msg msg--assistant msg--streaming">
                  {assistantMark()}
                  <div className="prose">
                    {streamText ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamText}</ReactMarkdown>
                    ) : (
                      <span className="thinking" aria-label="Writing">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    {streamText && <span className="stream-caret" />}
                  </div>
                </div>
              )}

              {showUpdateCard && chat?.portfolio && (
                <UpdateCard portfolio={chat.portfolio} onOpen={onOpenStudio} />
              )}
            </div>
          )}
        </div>
      </div>

      <div className="composer-wrap">
        <div className="composer-inner">
          {accessNotice && (
            <div className="access-banner">
              <span className="access-banner__mark">
                <SparkIcon width={15} height={15} />
              </span>
              <div className="access-banner__text">
                <b>{accessNotice === "signin" ? "Your trial is waiting" : "Your trial has ended"}</b>
                <small>
                  {accessNotice === "signin"
                    ? `Sign in with Google to write with Claude. ${account?.trialDays ?? 7} days free, no card required.`
                    : "Upgrade to keep writing and revising with Claude. Your portfolios stay yours."}
                </small>
              </div>
              <button
                type="button"
                className="access-banner__action"
                onClick={() => onOpenAccount(accessNotice)}
              >
                {accessNotice === "signin" ? "Sign in" : "Upgrade"}
              </button>
            </div>
          )}
          <div className={`composer ${streaming ? "is-streaming" : ""}`}>
            {attachments.length > 0 && (
              <div className="attachments">
                {attachments.map((file) => (
                  <span className="attachment" key={file.id}>
                    <PaperclipIcon width={12} height={12} />
                    {file.name}
                    <button
                      type="button"
                      onClick={() =>
                        setAttachments((current) => current.filter((item) => item.id !== file.id))
                      }
                      aria-label={`Remove ${file.name}`}
                    >
                      <XIcon width={11} height={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              placeholder={
                isEmpty
                  ? "I'm a designer in Lisbon. Here are three projects…"
                  : "Ask for a change — a colour, a section, a whole new mood…"
              }
              aria-label="Message the studio"
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            <div className="composer__bar">
              <div className="composer__tools">
                <button
                  className="icon-button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach a brief or résumé (.txt, .md, .json)"
                  aria-label="Attach a brief"
                >
                  <PaperclipIcon width={17} height={17} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,.json,.csv,.rtf,text/plain,text/markdown,application/json"
                  multiple
                  hidden
                  onChange={(event) => void addFiles(event.target.files)}
                />
                <button className="composer__model" type="button" onClick={onOpenSettings}>
                  <SparkIcon width={13} height={13} />
                  {modelLabel}
                  <ChevronDownIcon width={12} height={12} />
                </button>
              </div>
              <div className="composer__send">
                {streaming ? (
                  <button
                    className="send-button send-button--stop"
                    type="button"
                    onClick={onStop}
                    aria-label="Stop generating"
                  >
                    <StopIcon width={16} height={16} />
                  </button>
                ) : (
                  <button
                    className="send-button"
                    type="button"
                    onClick={submit}
                    disabled={!input.trim() && !attachments.length}
                    aria-label="Send"
                  >
                    <ArrowUpIcon width={17} height={17} />
                  </button>
                )}
              </div>
            </div>
            {fileError && <div className="composer__error">{fileError}</div>}
          </div>
          <p className="composer__hint">
            <span>Enter to send · Shift + Enter for line breaks</span>
            <span>Portfolio Studio can make mistakes.</span>
          </p>
        </div>
      </div>
    </section>
  );
}
