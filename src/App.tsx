import { useCallback, useEffect, useRef, useState } from "react";
import type { Chat, ChatMessage, Portfolio, ServerStatus, TemplateId } from "./portfolio/types";
import { emptyPortfolio, initialsFrom, slugify } from "./portfolio/normalize";
import { TEMPLATE_BY_ID } from "./portfolio/templates/meta";
import { renderPortfolio } from "./portfolio/render";
import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { Studio } from "./components/Studio";
import { TemplateGallery } from "./components/TemplateGallery";
import { SettingsDialog } from "./components/SettingsDialog";
import { AccountDialog } from "./components/AccountDialog";
import type { Attachment, SendMeta, ToastMessage } from "./lib/types";
import type { AccountIntent, AccountState } from "./lib/account";
import { fetchAccount } from "./lib/account";
import { fetchStatus, streamChat } from "./lib/chatApi";
import {
  loadChats,
  loadStudioOpen,
  loadTheme,
  saveChats,
  saveStudioOpen,
  saveTheme,
  titleFromPrompt,
} from "./lib/storage";

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [chats, setChats] = useState<Chat[]>(loadChats);
  const [activeId, setActiveId] = useState<string | null>(() => chats[0]?.id ?? null);
  const [scratchPortfolio, setScratchPortfolio] = useState<Portfolio | null>(null);
  const [theme, setTheme] = useState<"light" | "dark">(loadTheme);
  const [studioOpen, setStudioOpen] = useState<boolean>(loadStudioOpen);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [streamChatId, setStreamChatId] = useState<string | null>(null);
  const [status, setStatus] = useState<ServerStatus | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [account, setAccount] = useState<AccountState | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const [accountIntent, setAccountIntent] = useState<AccountIntent>("account");
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const streamTextRef = useRef("");
  const pendingPortfolioRef = useRef<Portfolio | null>(null);
  const toastTimer = useRef<number | null>(null);

  const activeChat = chats.find((chat) => chat.id === activeId) ?? null;
  const portfolio = activeChat?.portfolio ?? scratchPortfolio;

  useEffect(() => {
    saveChats(chats);
  }, [chats]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    saveStudioOpen(studioOpen);
  }, [studioOpen]);

  useEffect(() => {
    void fetchStatus().then(setStatus);
    void fetchAccount().then(setAccount);
  }, []);

  const notify = useCallback((text: string, actionLabel?: string, action?: () => void) => {
    setToast({ id: makeId(), text, actionLabel, action });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 4800);
  }, []);

  const refreshAccount = useCallback(async () => {
    const next = await fetchAccount();
    if (next) setAccount(next);
  }, []);

  const openAccount = useCallback((intent: AccountIntent = "account") => {
    setAccountIntent(intent);
    setAccountOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const auth = params.get("auth");
    const billing = params.get("billing");
    if (!auth && !billing) return;

    const clean = new URL(window.location.href);
    clean.searchParams.delete("auth");
    clean.searchParams.delete("billing");
    window.history.replaceState({}, "", `${clean.pathname}${clean.search}${clean.hash}`);

    let timer: number | null = null;
    if (auth === "success") {
      void refreshAccount();
      notify("Signed in with Google.");
    } else if (auth === "error") {
      notify("Google sign-in didn't finish. Please try again.");
    }

    if (billing === "success") {
      notify("Payment received — activating your plan…");
      let attempts = 0;
      timer = window.setInterval(async () => {
        attempts += 1;
        const next = await fetchAccount();
        if (next) setAccount(next);
        if (next?.access?.plan === "pro" || attempts >= 5) {
          if (timer) window.clearInterval(timer);
          if (next?.access?.plan === "pro") notify("Studio Pro is active. Welcome in.");
        }
      }, 1500);
    } else if (billing === "cancel") {
      notify("Checkout cancelled. Your trial is unchanged.");
    } else if (billing === "portal") {
      void refreshAccount();
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [notify, refreshAccount]);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId(null);
    setScratchPortfolio(null);
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        newChat();
      }
      if (event.key === "Escape") {
        if (galleryOpen || settingsOpen || sidebarOpen) {
          setGalleryOpen(false);
          setSettingsOpen(false);
          setSidebarOpen(false);
        } else if (window.innerWidth < 1100) {
          setStudioOpen(false);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [newChat, galleryOpen, settingsOpen, sidebarOpen]);

  const selectChat = (id: string) => {
    if (id === activeId) {
      setSidebarOpen(false);
      return;
    }
    abortRef.current?.abort();
    setActiveId(id);
    setScratchPortfolio(null);
    setSidebarOpen(false);
  };

  const deleteChat = (id: string) => {
    const previous = chats;
    const remaining = chats.filter((chat) => chat.id !== id);
    setChats(remaining);
    if (activeId === id) {
      if (streamChatId === id) abortRef.current?.abort();
      setActiveId(remaining[0]?.id ?? null);
    }
    notify("Conversation deleted.", "Undo", () => {
      setChats(previous);
      setActiveId(id);
    });
  };

  const updatePortfolio = (next: Portfolio) => {
    if (activeChat) {
      setChats((current) =>
        current.map((chat) =>
          chat.id === activeChat.id
            ? { ...chat, portfolio: next, updatedAt: Date.now() }
            : chat,
        ),
      );
    } else {
      setScratchPortfolio(next);
    }
  };

  const chooseTemplate = (id: TemplateId) => {
    const meta = TEMPLATE_BY_ID[id];
    const base = portfolio ?? emptyPortfolio();
    updatePortfolio({
      ...base,
      template: id,
      accent: meta.defaultAccent,
      initials: base.initials || initialsFrom(base.name),
    });
    setGalleryOpen(false);
    setStudioOpen(true);
  };

  const changeAccent = (accent: string) => {
    if (!portfolio) return;
    updatePortfolio({ ...portfolio, accent });
  };

  const accessNotice: "signin" | "upgrade" | null =
    status?.ready && account?.billingEnabled
      ? account.user
        ? account.access && !account.access.canGenerate
          ? "upgrade"
          : null
        : "signin"
      : null;

  const sendMessage = async (text: string, attachments: Attachment[], meta?: SendMeta) => {
    const clean = text.trim();
    if (!clean || streaming) return;
    if (accessNotice) {
      openAccount(accessNotice);
      notify(
        accessNotice === "signin"
          ? "Sign in with Google to start your free trial."
          : "Your trial has ended. Upgrade to keep writing with Claude.",
      );
      return;
    }

    const now = Date.now();
    let chat = activeChat;
    let chatId = chat?.id ?? "";

    if (!chat) {
      const newChatRecord: Chat = {
        id: makeId(),
        title: titleFromPrompt(clean),
        createdAt: now,
        updatedAt: now,
        messages: [],
        portfolio: scratchPortfolio,
      };
      chat = newChatRecord;
      chatId = newChatRecord.id;
      setChats((current) => [newChatRecord, ...current]);
      setActiveId(newChatRecord.id);
      setScratchPortfolio(null);
    }

    const attachmentNames = attachments.map((file) => `📎 ${file.name}`).join("\n");
    const displayContent = attachmentNames ? `${clean}\n\n${attachmentNames}` : clean;
    const shownContent = meta?.display
      ? attachmentNames
        ? `${meta.display}\n\n${attachmentNames}`
        : meta.display
      : displayContent;
    const requestContent = attachments.length
      ? `${clean}\n\n${attachments
          .map((file) => `--- Attached brief: ${file.name} ---\n${file.text}`)
          .join("\n\n")}`
      : clean;

    const userMessage: ChatMessage = {
      id: makeId(),
      role: "user",
      content: shownContent,
      createdAt: now,
    };

    const basePortfolio = chat.portfolio ?? scratchPortfolio;
    const title = chat.messages.length
      ? chat.title
      : meta?.title ?? titleFromPrompt(clean);

    setChats((current) =>
      current.map((item) =>
        item.id === chatId
          ? {
              ...item,
              title,
              messages: [...item.messages, userMessage],
              updatedAt: now,
              portfolio: basePortfolio,
            }
          : item,
      ),
    );

    const history = [...chat.messages, userMessage]
      .map((message, index) => ({
        role: message.role,
        content:
          index === chat!.messages.length ? requestContent : message.content,
      }))
      .slice(-12);

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    setStreamText("");
    streamTextRef.current = "";
    pendingPortfolioRef.current = null;
    setStreamChatId(chatId);
    if (window.innerWidth >= 1100) setStudioOpen(true);

    let committed = false;
    const commit = (message: string, options: { error?: boolean; portfolio?: Portfolio | null } = {}) => {
      if (committed) return;
      committed = true;
      const assistantMessage: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: message,
        createdAt: Date.now(),
        error: options.error,
      };
      setChats((current) =>
        current.map((item) =>
          item.id === chatId
            ? {
                ...item,
                messages: [...item.messages, assistantMessage],
                updatedAt: Date.now(),
                portfolio: options.portfolio ?? item.portfolio,
              }
            : item,
        ),
      );
    };

    try {
      await streamChat(
        {
          messages: history,
          portfolio: basePortfolio,
          signal: controller.signal,
        },
        {
          onText: (value) => {
            streamTextRef.current = value;
            setStreamText(value);
          },
          onPortfolio: (value) => {
            pendingPortfolioRef.current = value;
          },
          onDone: ({ message, portfolio: finalPortfolio }) => {
            const resolved = finalPortfolio ?? pendingPortfolioRef.current ?? basePortfolio;
            const fallback = streamTextRef.current.trim() || "Your portfolio is ready in the studio.";
            commit(message.trim() || fallback, { portfolio: resolved });
          },
          onError: (message) => {
            commit(message, { error: true });
          },
          onAccessDenied: (code, message) => {
            commit(message, { error: true });
            setAccountIntent(code === "trial_expired" ? "upgrade" : "signin");
            setAccountOpen(true);
            void refreshAccount();
          },
        },
      );
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        const partial = streamTextRef.current.trim();
        commit(partial || "Stopped. Tell me where to pick up.", {
          portfolio: pendingPortfolioRef.current ?? undefined,
        });
      } else {
        commit("Something went wrong while writing. Try again in a moment.", { error: true });
      }
    } finally {
      abortRef.current = null;
      setStreaming(false);
      setStreamText("");
      streamTextRef.current = "";
      setStreamChatId(null);
    }
  };

  const exportPortfolio = () => {
    if (!portfolio) return;
    const html = renderPortfolio(portfolio);
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${slugify(portfolio.name)}-${portfolio.template}.html`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify("Portfolio exported as a standalone HTML file.");
  };

  const openPortfolio = () => {
    if (!portfolio) return;
    const blob = new Blob([renderPortfolio(portfolio)], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };

  const copyBlueprint = async () => {
    if (!portfolio) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(portfolio, null, 2));
      notify("Blueprint JSON copied.");
    } catch {
      notify("Clipboard access was blocked.");
    }
  };

  const toggleTheme = () => setTheme((current) => (current === "light" ? "dark" : "light"));

  return (
    <div className="app">
      <div
        className={`sidebar-shell ${sidebarOpen ? "is-open" : ""}`}
        onClick={(event) => {
          if (event.target === event.currentTarget) setSidebarOpen(false);
        }}
      >
        <Sidebar
          chats={chats}
          activeId={activeId}
          status={status}
          theme={theme}
          onNewChat={newChat}
          onSelectChat={selectChat}
          onDeleteChat={deleteChat}
          onToggleTheme={toggleTheme}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAccount={() => openAccount()}
          account={account}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="workspace">
        <ChatView
          chat={activeChat}
          streaming={streaming}
          streamText={streamText}
          status={status}
          studioOpen={studioOpen}
          hasPortfolio={Boolean(portfolio)}
          onSend={sendMessage}
          onStop={stopStreaming}
          onToggleStudio={() => setStudioOpen((open) => !open)}
          onOpenGallery={() => setGalleryOpen(true)}
          onOpenStudio={() => setStudioOpen(true)}
          onToggleSidebar={() => setSidebarOpen((open) => !open)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAccount={openAccount}
          account={account}
          accessNotice={accessNotice}
        />

        {studioOpen && (
          <Studio
            portfolio={portfolio}
            onChooseTemplate={chooseTemplate}
            onOpenGallery={() => setGalleryOpen(true)}
            onAccent={changeAccent}
            onClose={() => setStudioOpen(false)}
            onExport={exportPortfolio}
            onOpen={openPortfolio}
            onCopy={copyBlueprint}
          />
        )}
      </div>

      {galleryOpen && (
        <TemplateGallery
          active={portfolio?.template ?? null}
          onSelect={chooseTemplate}
          onClose={() => setGalleryOpen(false)}
        />
      )}

      {settingsOpen && (
        <SettingsDialog status={status} onClose={() => setSettingsOpen(false)} />
      )}

      {accountOpen && (
        <AccountDialog
          account={account}
          intent={accountIntent}
          onClose={() => setAccountOpen(false)}
          onRefresh={refreshAccount}
          notify={notify}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <span>{toast.text}</span>
          {toast.action && toast.actionLabel && (
            <button
              type="button"
              onClick={() => {
                toast.action?.();
                setToast(null);
              }}
            >
              {toast.actionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
